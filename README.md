# 🎵 BeatBurst

**Educational Streaming Media Converter**

BeatBurst is a modern, cross-platform desktop application that allows users to convert streaming media to MP3 format. Built with cutting-edge web technologies and featuring stunning party-style animations, BeatBurst provides a beautiful and intuitive user experience.

## ⚠️ Legal Notice

**IMPORTANT**: This application is provided for educational purposes only. Users are solely responsible for ensuring they have the legal right to download and convert any content. Please respect copyright laws and platform terms of service.


## 🛠️ Technologies Used

### Frontend
- **[Angular 18](https://angular.io/)** - Modern web framework with standalone components
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript with comprehensive interfaces
- **[anime.js](https://animejs.com/)** - Lightweight animation library for party effects
- **[RxJS](https://rxjs.dev/)** - Reactive programming for state management

### Backend
- **[Tauri](https://tauri.app/)** - Rust-based desktop application framework
- **[Rust](https://www.rust-lang.org/)** - Systems programming language for performance and security
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** - Media extraction and conversion engine

### Development Tools
- **[Angular CLI](https://cli.angular.io/)** - Development and build tooling
- **[Cargo](https://doc.rust-lang.org/cargo/)** - Rust package manager and build system
- **[ESLint](https://eslint.org/)** - Code quality and consistency
- **[Prettier](https://prettier.io/)** - Code formatting

### Architecture
- **Service-Based Architecture** - Separation of concerns with dedicated services
- **Type-Safe Interfaces** - Comprehensive TypeScript type definitions
- **Reactive State Management** - RxJS observables for real-time updates
- **Component-Based Design** - Modular and reusable UI components

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

### Required Software

1. **Node.js** (v18 or later)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Rust** (latest stable version)
   - Install from [rustup.rs](https://rustup.rs/)

3. **Media Downloader** (bundled with the application)
   - ✅ **No manual installation required!**
   - Media downloader binaries are automatically downloaded and bundled with the application
   - Supports Windows, macOS, and Linux out of the box

4. **Tauri Prerequisites**
   - Follow the [Tauri prerequisites guide](https://tauri.app/v1/guides/getting-started/prerequisites)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd beatburst
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Download media processing binaries**
   Or setup everything at once:
   ```bash
   npm run setup
   ```

## 🏃‍♂️ Running the Application

### Development Mode

To run the application in development mode with hot reload:

```bash
npm run tauri dev
```

This will:
- Start the Angular development server
- Launch the Tauri application with party animations
- Enable hot reload for both frontend and backend changes
- Display the legal disclaimer on first run

### Frontend Only (Web Development)

To run just the Angular frontend for UI development:

```bash
npm start
```

### Production Build

To build the application for production:

```bash
npm run tauri build
```

This will create a distributable application in the `src-tauri/target/release/bundle/` directory.

### Available Scripts

- `npm start` - Start Angular development server
- `npm run tauri dev` - Start Tauri development mode
- `npm run tauri build` - Build production application
- `npm run download-yt-dlp` - Download media processing binaries
- `npm run setup` - Install dependencies and download binaries

## 🎯 Usage

1. **Launch the application**
   - Run `npm run tauri dev` for development or install the built application

2. **Accept Legal Terms**
   - On first launch, read and accept the comprehensive legal disclaimer
   - This ensures you understand your responsibilities regarding copyright compliance

3. **Enter a Video URL**
   - Paste any valid video URL into the input field

4. **Convert to MP3**
   - Click the "Convert to MP3" button
   - Enjoy the party-style animations while processing
   - Monitor the progress through the real-time progress bar
   - The converted MP3 file will be saved to your Downloads folder

## 🏗️ Technical Architecture

#### Frontend
- `@angular/core`: ^18.0.0 - Core Angular framework
- `@tauri-apps/api`: ^2.7.0 - Tauri API bindings
- `animejs`: ^3.2.1 - Animation library for party effects
- `rxjs`: ~7.8.0 - Reactive programming

#### Backend
- `tauri`: 2.0 - Desktop application framework
- `tauri-plugin-shell`: 2.0 - Shell plugin for media downloader integration
- `tokio`: 1.0 - Async runtime for Rust
- `serde`: 1.0 - Serialization framework
- `regex`: 1.0 - Regular expressions for URL validation





1. **Animations not working**
   - **Cause**: anime.js failed to load or reduced motion is enabled
   - **Solution**: Check browser console for errors, ensure CDN is accessible

2. **Performance issues**
   - **Cause**: Too many animations on low-end devices
   - **Solution**: Animations automatically reduce on mobile/low-end devices

### Development Issues

1. **Tauri build fails**
   - Ensure all Rust dependencies are properly installed
   - Update Rust toolchain: `rustup update`
   - Check Tauri prerequisites are met

2. **Angular build fails**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility (v18+)
   - Verify TypeScript version compatibility

3. **Animation service errors**
   - Check anime.js CDN availability
   - Verify script integrity hash is correct
   - Ensure CSP allows the animation library



## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚖️ Legal Disclaimer

**IMPORTANT**: This application is for educational purposes only. Users must:
- Respect copyright laws and platform Terms of Service
- Only download content they have permission to access
- Accept full legal responsibility for their usage

The developers assume no liability for user actions or legal consequences.

## 🙏 Acknowledgments

- **[Tauri](https://tauri.app/)** - For the excellent secure desktop app framework
- **[Angular](https://angular.io/)** - For the powerful and modern frontend framework
- **[anime.js](https://animejs.com/)** - For the lightweight and powerful animation library
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** - For reliable video downloading capabilities
- **[Rust](https://www.rust-lang.org/)** - For memory safety and performance
- **[TypeScript](https://www.typescriptlang.org/)** - For type safety and developer experience

## 💡 Recommended IDE Setup

**[VS Code](https://code.visualstudio.com/)** with the following extensions:
- **[Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)** - Tauri development support
- **[rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)** - Rust language support
- **[Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template)** - Angular development support
- **[TypeScript Importer](https://marketplace.visualstudio.com/items?itemName=pmneo.tsimporter)** - Auto import for TypeScript

---

**Built for learning tauri and angular. For educational purposes. Please use responsibly and respect content creators' rights.**
