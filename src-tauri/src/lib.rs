
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tauri_plugin_shell::ShellExt;
use thiserror::Error;
use regex::Regex;

#[derive(Error, Debug)]
pub enum DownloadError {
    #[error("Invalid video URL: {0}")]
    InvalidUrl(String),
    #[error("Download failed: {0}")]
    DownloadFailed(String),
    #[error("Conversion failed: {0}")]
    ConversionFailed(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Shell command error: {0}")]
    ShellError(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgress {
    pub stage: String,
    pub progress: f64,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DownloadResult {
    pub success: bool,
    pub file_path: Option<String>,
    pub error: Option<String>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to", name)
}

#[tauri::command]
async fn validate_video_url(url: String) -> Result<bool, String> {
    // Generic video URL validation - supports multiple platforms
    let video_regex = Regex::new(
        r"^(https?://)?(www\.)?(youtube\.com/(watch\?v=|embed/|v/)|youtu\.be/|vimeo\.com/|dailymotion\.com/|twitch\.tv/)[\w-]+(&\S*)?$"
    ).map_err(|e| format!("Regex compilation failed: {}", e))?;

    Ok(video_regex.is_match(&url))
}

#[tauri::command]
async fn download_video_to_mp3(
    app_handle: tauri::AppHandle,
    url: String,
) -> Result<DownloadResult, String> {
    let result = download_and_convert_internal(app_handle, url).await;

    match result {
        Ok(file_path) => Ok(DownloadResult {
            success: true,
            file_path: Some(file_path),
            error: None,
        }),
        Err(e) => Ok(DownloadResult {
            success: false,
            file_path: None,
            error: Some(e.to_string()),
        }),
    }
}

async fn download_and_convert_internal(
    app_handle: tauri::AppHandle,
    url: String,
) -> Result<String, DownloadError> {
    // Emit progress update
    let emit_progress = |stage: &str, progress: f64, message: &str| {
        let _ = app_handle.emit("download-progress", DownloadProgress {
            stage: stage.to_string(),
            progress,
            message: message.to_string(),
        });
    };

    emit_progress("validation", 0.0, "Validating video URL...");

    // Validate URL format - supports multiple video platforms
    let video_regex = Regex::new(
        r"^(https?://)?(www\.)?(youtube\.com/(watch\?v=|embed/|v/)|youtu\.be/|vimeo\.com/|dailymotion\.com/|twitch\.tv/)[\w-]+(&\S*)?$"
    ).unwrap();

    if !video_regex.is_match(&url) {
        return Err(DownloadError::InvalidUrl(format!("Invalid video URL format: {}", url)));
    }

    // Create a unique temporary directory for this download
    let base_downloads_dir = match dirs::download_dir() {
        Some(dir) => dir,
        None => std::env::temp_dir(),
    };

    let unique_id = uuid::Uuid::new_v4().to_string();
    let temp_download_dir = base_downloads_dir.join(format!("beatburst-{}", &unique_id[..8]));

    std::fs::create_dir_all(&temp_download_dir)
        .map_err(|e| DownloadError::IoError(e))?;

    emit_progress("preparing", 10.0, "Preparing media downloader...");

    // Use bundled media downloader sidecar
    let shell = app_handle.shell();

    // Get the sidecar command for media downloader
    let yt_dlp_cmd = shell.sidecar("yt-dlp")
        .map_err(|e| DownloadError::ShellError(format!("Failed to get media downloader sidecar: {}", e)))?;

    // Test media downloader availability
    let yt_dlp_check = yt_dlp_cmd
        .args(["--version"])
        .output()
        .await;

    if yt_dlp_check.is_err() {
        return Err(DownloadError::DownloadFailed(
            "Bundled media downloader is not available. Please check the application installation.".to_string()
        ));
    }

    emit_progress("downloading", 30.0, "Downloading audio from video source...");

    // Use media downloader to download audio directly as MP3
    let output_template = temp_download_dir.join("%(title)s.mp3");
    let output_template_str = output_template.to_string_lossy();

    // Try to download as MP3 directly, fallback to best audio
    let download_result = shell.sidecar("yt-dlp")
        .map_err(|e| DownloadError::ShellError(format!("Failed to get media downloader sidecar: {}", e)))?
        .args([
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "192K",
            "--output", &output_template_str,
            "--no-playlist",
            &url,
        ])
        .output()
        .await;

    match download_result {
        Ok(output) => {
            if !output.status.success() {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                return Err(DownloadError::DownloadFailed(format!("Media downloader failed: {}", error_msg)));
            }

            emit_progress("processing", 70.0, "Processing downloaded file...");

            // Find the downloaded audio file in the temporary directory
            let audio_files: Vec<_> = std::fs::read_dir(&temp_download_dir)
                .map_err(|e| DownloadError::IoError(e))?
                .filter_map(|entry| {
                    let entry = entry.ok()?;
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                            if matches!(ext, "mp3" | "m4a" | "webm" | "ogg" | "aac" | "opus") {
                                log::info!("Found audio file: {} (extension: {})", path.display(), ext);
                                return Some(path);
                            }
                        }
                    }
                    None
                })
                .collect();

            log::info!("Found {} audio files in temp directory", audio_files.len());

            if let Some(audio_file) = audio_files.first() {
                let file_ext = audio_file.extension().and_then(|s| s.to_str()).unwrap_or("unknown");
                log::info!("Processing audio file: {} (extension: {})", audio_file.display(), file_ext);

                // Move file to final Downloads location
                let final_downloads_dir = base_downloads_dir;
                let final_file_path = final_downloads_dir.join(audio_file.file_name().unwrap());

                // Check if it's already MP3
                if file_ext == "mp3" {
                    log::info!("File is already MP3, moving to Downloads folder");
                    std::fs::copy(&audio_file, &final_file_path)
                        .map_err(|e| DownloadError::IoError(e))?;

                    // Clean up temp directory
                    std::fs::remove_dir_all(&temp_download_dir)
                        .map_err(|e| DownloadError::IoError(e))?;

                    emit_progress("complete", 100.0, "MP3 download complete!");
                    Ok(final_file_path.to_string_lossy().to_string())
                } else {
                    // Convert to MP3 using FFmpeg
                    log::info!("File is {}, converting to MP3...", file_ext);
                    emit_progress("converting", 80.0, "Converting to MP3...");
                    let mp3_file = convert_to_mp3_with_ffmpeg(&app_handle, audio_file, &final_downloads_dir).await?;

                    // Clean up temp directory
                    std::fs::remove_dir_all(&temp_download_dir)
                        .map_err(|e| DownloadError::IoError(e))?;

                    emit_progress("complete", 100.0, "Download and conversion complete!");
                    Ok(mp3_file)
                }
            } else {
                // Clean up temp directory when no audio files found
                if let Err(cleanup_err) = std::fs::remove_dir_all(&temp_download_dir) {
                    log::warn!("Failed to clean up temp directory when no audio files found: {}", cleanup_err);
                }
                Err(DownloadError::DownloadFailed("Audio file not found after download".to_string()))
            }
        }
        Err(e) => {
            // Clean up temp directory on error
            if let Err(cleanup_err) = std::fs::remove_dir_all(&temp_download_dir) {
                log::warn!("Failed to clean up temp directory on error: {}", cleanup_err);
            }
            Err(DownloadError::ShellError(format!("Failed to execute media downloader: {}", e)))
        }
    }
}

async fn convert_to_mp3_with_ffmpeg(
    app_handle: &tauri::AppHandle,
    input_file: &std::path::Path,
    output_dir: &std::path::Path,
) -> Result<String, DownloadError> {
    let shell = app_handle.shell();

    log::info!("Starting MP3 conversion for: {}", input_file.display());

    // Create output filename
    let file_stem = input_file.file_stem()
        .ok_or_else(|| DownloadError::ConversionFailed("Invalid input file name".to_string()))?
        .to_string_lossy();

    let safe_filename = sanitize_filename(&file_stem);
    let output_file = output_dir.join(format!("{}.mp3", safe_filename));

    log::info!("Output file will be: {}", output_file.display());

    // Test FFmpeg availability first
    let ffmpeg_test = shell.sidecar("ffmpeg")
        .map_err(|e| DownloadError::ShellError(format!("Failed to get ffmpeg sidecar: {}", e)))?
        .args(["-version"])
        .output()
        .await;

    match ffmpeg_test {
        Ok(test_output) => {
            if !test_output.status.success() {
                let error_msg = String::from_utf8_lossy(&test_output.stderr);
                return Err(DownloadError::ConversionFailed(format!("FFmpeg test failed: {}", error_msg)));
            }
            log::info!("FFmpeg is available");
        }
        Err(e) => {
            return Err(DownloadError::ShellError(format!("FFmpeg not available: {}", e)));
        }
    }

    // Convert using FFmpeg sidecar
    log::info!("Starting FFmpeg conversion...");
    let conversion_result = shell.sidecar("ffmpeg")
        .map_err(|e| DownloadError::ShellError(format!("Failed to get ffmpeg sidecar: {}", e)))?
        .args([
            "-i", &input_file.to_string_lossy(),
            "-vn", // No video
            "-acodec", "libmp3lame", // Use LAME MP3 encoder
            "-ab", "192k", // Audio bitrate
            "-ar", "44100", // Audio sample rate
            "-ac", "2", // Stereo
            "-y", // Overwrite output file
            &output_file.to_string_lossy(),
        ])
        .output()
        .await;

    match conversion_result {
        Ok(output) => {
            log::info!("FFmpeg command completed with status: {:?}", output.status);

            if !output.status.success() {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                let stdout_msg = String::from_utf8_lossy(&output.stdout);
                log::error!("FFmpeg stderr: {}", error_msg);
                log::error!("FFmpeg stdout: {}", stdout_msg);
                return Err(DownloadError::ConversionFailed(format!("FFmpeg conversion failed: {}", error_msg)));
            }

            // Verify output file was created
            if !output_file.exists() {
                return Err(DownloadError::ConversionFailed("MP3 file was not created".to_string()));
            }

            log::info!("MP3 conversion successful: {}", output_file.display());

            // Clean up the original file
            if let Err(e) = std::fs::remove_file(input_file) {
                log::warn!("Failed to remove original file: {}", e);
            }

            Ok(output_file.to_string_lossy().to_string())
        }
        Err(e) => {
            log::error!("Failed to execute FFmpeg: {}", e);
            Err(DownloadError::ShellError(format!("Failed to execute FFmpeg: {}", e)))
        }
    }
}

fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            validate_video_url,
            download_video_to_mp3
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
