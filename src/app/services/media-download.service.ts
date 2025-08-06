import { Injectable, OnDestroy } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { Subject, BehaviorSubject } from 'rxjs';
import { DownloadProgress, DownloadResult } from '../interfaces/app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class MediaDownloadService implements OnDestroy {
  private progressSubject = new Subject<DownloadProgress>();
  private isDownloadingSubject = new BehaviorSubject<boolean>(false);
  private unlistenFn: UnlistenFn | null = null;

  public progress$ = this.progressSubject.asObservable();
  public isDownloading$ = this.isDownloadingSubject.asObservable();

  constructor() {
    this.setupProgressListener();
  }

  ngOnDestroy(): void {
    // Clean up Tauri event listener
    if (this.unlistenFn) {
      this.unlistenFn();
    }

    // Complete subjects to prevent memory leaks
    this.progressSubject.complete();
    this.isDownloadingSubject.complete();
  }

  private async setupProgressListener(): Promise<void> {
    try {
      if (typeof listen === 'undefined') {
        console.warn('Tauri listen not available, progress updates will not work');
        return;
      }
      this.unlistenFn = await listen<DownloadProgress>('download-progress', (event) => {
        console.log('Progress update:', event.payload);
        this.progressSubject.next(event.payload);
      });
    } catch (error) {
      console.error('Failed to setup progress listener:', error);
    }
  }

  async validateVideoUrl(url: string): Promise<boolean> {
    try {
      if (typeof invoke === 'undefined') {
        console.warn('Tauri invoke not available, falling back to client-side validation');
        return this.isValidVideoUrl(url);
      }
      return await invoke<boolean>('validate_video_url', { url });
    } catch (error) {
      console.error('URL validation failed:', error);
      // Fallback to client-side validation
      return this.isValidVideoUrl(url);
    }
  }

  async downloadVideoToMp3(url: string): Promise<DownloadResult> {
    this.isDownloadingSubject.next(true);

    try {
      if (typeof invoke === 'undefined') {
        throw new Error('Tauri is not available. Please run this application in the Tauri desktop environment.');
      }
      const result = await invoke<DownloadResult>('download_video_to_mp3', { url });
      return result;
    } catch (error) {
      console.error('Download failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      this.isDownloadingSubject.next(false);
    }
  }

  isValidVideoUrl(url: string): boolean {
    // Generic URL validation - supports multiple video platforms
    const videoUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/|vimeo\.com\/|dailymotion\.com\/|twitch\.tv\/)/;
    return videoUrlRegex.test(url);
  }

  extractVideoId(url: string): string | null {
    // Generic video ID extraction for multiple platforms
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /vimeo\.com\/(\d+)/,
      /dailymotion\.com\/video\/([^_]+)/,
      /twitch\.tv\/videos\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}
