#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BINARIES_DIR = path.join(__dirname, '..', 'src-tauri', 'binaries');
const YT_DLP_VERSION = 'latest'; // You can specify a version like '2023.12.30'

// Platform-specific binary information
// Tauri automatically appends the target triple to the binary name
const PLATFORMS = {
  'yt-dlp-x86_64-pc-windows-msvc.exe': {
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    executable: true
  },
  'yt-dlp-x86_64-apple-darwin': {
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
    executable: true
  },
  'yt-dlp-x86_64-unknown-linux-gnu': {
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
    executable: true
  },
  // FFmpeg binaries
  'ffmpeg-x86_64-pc-windows-msvc.exe': {
    url: 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip',
    executable: true,
    isZip: true,
    extractPath: 'ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe'
  },
  'ffmpeg-x86_64-apple-darwin': {
    url: 'https://evermeet.cx/ffmpeg/getrelease/zip',
    executable: true,
    isZip: true,
    extractPath: 'ffmpeg'
  },
  'ffmpeg-x86_64-unknown-linux-gnu': {
    url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    executable: true,
    isTarXz: true,
    extractPath: 'ffmpeg-*-amd64-static/ffmpeg'
  }
};

// Ensure binaries directory exists
if (!fs.existsSync(BINARIES_DIR)) {
  fs.mkdirSync(BINARIES_DIR, { recursive: true });
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${outputPath}...`);

    const file = fs.createWriteStream(outputPath);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded ${path.basename(outputPath)}`);
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

function extractFile(archivePath, extractPath, finalPath) {
  try {
    const tempDir = path.join(BINARIES_DIR, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    console.log(`Extracting ${path.basename(archivePath)}...`);

    if (archivePath.endsWith('.zip')) {
      // Use PowerShell on Windows, unzip on others
      if (process.platform === 'win32') {
        execSync(`powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${tempDir}' -Force"`, { stdio: 'inherit' });
      } else {
        execSync(`unzip -o "${archivePath}" -d "${tempDir}"`, { stdio: 'inherit' });
      }
    } else if (archivePath.endsWith('.tar.xz')) {
      execSync(`tar -xf "${archivePath}" -C "${tempDir}"`, { stdio: 'inherit' });
    }

    // Find and move the extracted file
    const extractedFile = findFileInDir(tempDir, extractPath);
    if (extractedFile) {
      fs.copyFileSync(extractedFile, finalPath);
      if (process.platform !== 'win32') {
        fs.chmodSync(finalPath, 0o755);
      }
      console.log(`✓ Extracted to ${path.basename(finalPath)}`);
    } else {
      throw new Error(`Could not find ${extractPath} in extracted archive`);
    }

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(archivePath);

  } catch (error) {
    throw new Error(`Extraction failed: ${error.message}`);
  }
}

function findFileInDir(dir, pattern) {
  const files = fs.readdirSync(dir, { recursive: true });
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isFile()) {
      if (pattern.includes('*')) {
        // Simple glob matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(file)) {
          return fullPath;
        }
      } else if (file.endsWith(path.basename(pattern))) {
        return fullPath;
      }
    }
  }
  return null;
}

async function downloadAllBinaries() {
  console.log('Downloading media processing binaries for all platforms...\n');

  try {
    for (const [filename, info] of Object.entries(PLATFORMS)) {
      const outputPath = path.join(BINARIES_DIR, filename);

      // Skip if file already exists
      if (fs.existsSync(outputPath)) {
        console.log(`⚠ ${filename} already exists, skipping...`);
        continue;
      }

      if (info.isZip || info.isTarXz) {
        // Download archive and extract
        const archivePath = path.join(BINARIES_DIR, `temp_${Date.now()}_${path.basename(info.url)}`);
        await downloadFile(info.url, archivePath);
        extractFile(archivePath, info.extractPath, outputPath);
      } else {
        // Direct download
        await downloadFile(info.url, outputPath);

        // Make executable on Unix-like systems
        if (info.executable && process.platform !== 'win32') {
          fs.chmodSync(outputPath, 0o755);
        }
      }
    }

    console.log('\n✅ All binaries downloaded successfully!');
    console.log('\nDownloaded files:');

    fs.readdirSync(BINARIES_DIR).forEach(file => {
      if (!file.startsWith('temp_')) {
        const filePath = path.join(BINARIES_DIR, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  - ${file} (${sizeMB} MB)`);
      }
    });

  } catch (error) {
    console.error('❌ Error downloading binaries:', error.message);
    process.exit(1);
  }
}

// Run the download
downloadAllBinaries();
