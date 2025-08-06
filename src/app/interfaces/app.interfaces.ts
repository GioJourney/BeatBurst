export interface DownloadProgress {
  stage: string;
  progress: number;
  message: string;
}

export interface DownloadResult {
  success: boolean;
  file_path?: string;
  error?: string;
}

export interface AnimeInstance {
  play(): void;
  pause(): void;
  remove?(): void;
  progress?: number;
  restart?(): void;
  complete?(): void;
  cancel?(): void;
}

export interface LegalAcceptance {
  accepted: boolean;
  timestamp: Date;
  version: string;
}

export interface UserSettings {
  legalAcceptance?: LegalAcceptance;
  animationsEnabled: boolean;
  reducedMotion: boolean;
}
