#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BINARIES_DIR = path.join(__dirname, '..', 'src-tauri', 'binaries');

// Simplified FFmpeg download - Windows only for now
const FFMPEG_WINDOWS_URL = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';

// Ensure binaries directory exists
if (!fs.existsSync(BINARIES_DIR)) {
  fs.mkdirSync(BINARIES_DIR, { recursive: true });
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading FFmpeg...`);
    
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 303) {
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
        process.stdout.write(`\rDownloading FFmpeg: ${progress}%`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`\n✓ Downloaded FFmpeg`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

async function extractFFmpeg() {
  const zipPath = path.join(BINARIES_DIR, 'ffmpeg.zip');
  const outputPath = path.join(BINARIES_DIR, 'ffmpeg-x86_64-pc-windows-msvc.exe');
  
  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log('✓ FFmpeg already exists');
    return;
  }
  
  try {
    // Download
    await downloadFile(FFMPEG_WINDOWS_URL, zipPath);
    
    console.log('Extracting FFmpeg...');
    
    // Extract using PowerShell
    const tempDir = path.join(BINARIES_DIR, 'temp_ffmpeg');
    execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`, { stdio: 'inherit' });
    
    // Find ffmpeg.exe in the extracted folder
    const extractedDirs = fs.readdirSync(tempDir);
    const ffmpegDir = extractedDirs.find(dir => dir.startsWith('ffmpeg-'));
    
    if (!ffmpegDir) {
      throw new Error('Could not find FFmpeg directory in extracted files');
    }
    
    const ffmpegExePath = path.join(tempDir, ffmpegDir, 'bin', 'ffmpeg.exe');
    
    if (!fs.existsSync(ffmpegExePath)) {
      throw new Error('Could not find ffmpeg.exe in extracted files');
    }
    
    // Copy to final location
    fs.copyFileSync(ffmpegExePath, outputPath);
    
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);
    
    console.log('✅ FFmpeg extracted successfully!');
    
    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`FFmpeg size: ${sizeMB} MB`);
    
  } catch (error) {
    console.error('❌ Error setting up FFmpeg:', error.message);
    process.exit(1);
  }
}

// Run the extraction
extractFFmpeg();
