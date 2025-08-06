import { Injectable } from '@angular/core';
import { AnimeInstance } from '../interfaces/app.interfaces';

// Anime.js type declaration
interface AnimeParams {
  targets: any;
  [key: string]: any;
}

interface AnimeTimeline {
  add(params: AnimeParams, offset?: number): AnimeTimeline;
  play(): void;
  pause(): void;
  remove?(): void;
  progress?: number;
}

declare const anime: {
  (params: AnimeParams): AnimeInstance;
  timeline(params?: { loop?: boolean; duration?: number; easing?: string }): AnimeTimeline;
};

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private animations: AnimeInstance[] = [];
  private isAnimationEnabled = true;

  constructor() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isAnimationEnabled = !prefersReducedMotion;
  }

  isEnabled(): boolean {
    return this.isAnimationEnabled && typeof anime !== 'undefined';
  }

  createAnimation(params: AnimeParams): AnimeInstance | null {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const animation = anime(params);
      this.animations.push(animation);
      return animation;
    } catch (error) {
      console.warn('Failed to create animation:', error);
      return null;
    }
  }

  createTimeline(params?: { loop?: boolean; duration?: number; easing?: string }): AnimeTimeline | null {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const timeline = anime.timeline(params);
      this.animations.push(timeline as any);
      return timeline;
    } catch (error) {
      console.warn('Failed to create timeline:', error);
      return null;
    }
  }

  pauseAll(): void {
    this.animations.forEach((animation, index) => {
      try {
        if (animation && typeof animation.pause === 'function') {
          animation.pause();
        }
      } catch (error) {
        console.warn(`Failed to pause animation ${index}:`, error);
      }
    });
  }

  resumeAll(): void {
    this.animations.forEach((animation, index) => {
      try {
        if (animation && typeof animation.play === 'function') {
          animation.play();
        }
      } catch (error) {
        console.warn(`Failed to resume animation ${index}:`, error);
      }
    });
  }

  cleanup(): void {
    try {
      this.animations.forEach((animation, index) => {
        try {
          if (animation && typeof animation.pause === 'function') {
            animation.pause();
          }
          if (animation && typeof animation.remove === 'function') {
            animation.remove();
          }
        } catch (error) {
          console.warn(`Failed to cleanup animation ${index}:`, error);
        }
      });
      this.animations = [];
    } catch (error) {
      console.error('Critical error during animation cleanup:', error);
    }
  }

  getDeviceCapabilities() {
    const isMobile = window.innerWidth < 768;
    const isLowEnd = window.innerWidth < 480 || navigator.hardwareConcurrency <= 2;
    
    return {
      isMobile,
      isLowEnd,
      particleCount: isLowEnd ? 6 : isMobile ? 10 : 20,
      ballCount: isLowEnd ? 2 : isMobile ? 3 : 4,
      starCount: isLowEnd ? 4 : isMobile ? 6 : 12,
      confettiCount: isLowEnd ? 8 : isMobile ? 10 : 20,
      pulseCount: isLowEnd ? 3 : isMobile ? 4 : 8
    };
  }
}
