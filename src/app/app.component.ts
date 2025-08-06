import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MediaDownloadService } from './services/media-download.service';
import { AnimationService } from './services/animation.service';
import { DownloadProgress, DownloadResult, LegalAcceptance, AnimeInstance } from './interfaces/app.interfaces';

// Anime.js declaration
declare const anime: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('partyContainer', { static: false }) partyContainer!: ElementRef<HTMLDivElement>;

  videoUrl = '';
  isDownloading = false;
  downloadProgress: DownloadProgress | null = null;
  downloadResult: DownloadResult | null = null;
  errorMessage = '';
  successMessage = '';

  // Legal compliance
  userAcceptedTerms = false;
  showLegalNotice = true;
  readonly LEGAL_VERSION = '1.0.0';

  private subscriptions = new Subscription();
  private animations: AnimeInstance[] = [];

  constructor(
    private mediaService: MediaDownloadService,
    private animationService: AnimationService
  ) {}

  ngOnInit(): void {
    // Check if user has previously accepted terms
    this.checkLegalAcceptance();

    // Subscribe to download progress
    this.subscriptions.add(
      this.mediaService.progress$.subscribe(progress => {
        this.downloadProgress = progress;
      })
    );

    // Subscribe to download status
    this.subscriptions.add(
      this.mediaService.isDownloading$.subscribe(isDownloading => {
        this.isDownloading = isDownloading;
      })
    );
  }

  ngAfterViewInit(): void {
    // Initialize party animations after view is ready
    try {
      this.initializePartyAnimations();
    } catch (error) {
      console.error('Failed to initialize party animations:', error);
      // Graceful degradation - app continues to work without animations
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Clean up animations and DOM elements
    this.animationService.cleanup();
    this.cleanupDOMElements();
  }

  private cleanupDOMElements(): void {
    try {
      // Clean up party container elements
      if (this.partyContainer?.nativeElement) {
        const container = this.partyContainer.nativeElement;
        try {
          // Remove all child elements safely
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        } catch (error) {
          console.warn('Failed to cleanup party container:', error);
          // Fallback: try to clear innerHTML
          try {
            container.innerHTML = '';
          } catch (fallbackError) {
            console.error('Complete cleanup failed:', fallbackError);
          }
        }
      }
    } catch (error) {
      console.error('Critical error during DOM cleanup:', error);
    }
  }

  async onDownload(): Promise<void> {
    this.clearMessages();

    // Check if user has accepted legal terms
    if (!this.userAcceptedTerms) {
      this.errorMessage = 'You must accept the legal terms before downloading content.';
      return;
    }

    if (!this.videoUrl.trim()) {
      this.errorMessage = 'Please enter a video URL';
      return;
    }

    if (!this.mediaService.isValidVideoUrl(this.videoUrl)) {
      this.errorMessage = 'Please enter a valid video URL';
      return;
    }

    try {
      // Reduce animation intensity during download for better performance
      this.pauseAnimations();

      // Validate URL with backend
      const isValid = await this.mediaService.validateVideoUrl(this.videoUrl);
      if (!isValid) {
        this.errorMessage = 'Invalid video URL or content not accessible. Please check the URL and try again.';
        return;
      }

      // Start download
      this.downloadResult = await this.mediaService.downloadVideoToMp3(this.videoUrl);

      if (this.downloadResult.success) {
        this.successMessage = `Download completed! File saved to: ${this.downloadResult.file_path}`;
        // Clear the URL after successful download
        this.videoUrl = '';
      } else {
        this.errorMessage = this.downloadResult.error || 'Download failed. Please try again.';
      }
    } catch (error) {
      console.error('Download error:', error);
      if (error instanceof Error) {
        this.errorMessage = `Download failed: ${error.message}`;
      } else {
        this.errorMessage = 'An unexpected error occurred during download. Please try again.';
      }
    } finally {
      // Resume animations after download completes
      try {
        this.resumeAnimations();
      } catch (animationError) {
        console.warn('Failed to resume animations:', animationError);
      }
    }
  }

  onUrlChange(): void {
    this.clearMessages();
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.downloadResult = null;
    this.downloadProgress = null;
  }

  get progressPercentage(): number {
    return this.downloadProgress?.progress || 0;
  }

  get progressMessage(): string {
    return this.downloadProgress?.message || '';
  }

  get isUrlValid(): boolean {
    return this.videoUrl.trim() !== '' && this.mediaService.isValidVideoUrl(this.videoUrl);
  }

  private initializePartyAnimations(): void {
    if (!this.partyContainer?.nativeElement || !this.animationService.isEnabled()) {
      console.log('Animations disabled or container not available');
      return;
    }

    const container = this.partyContainer.nativeElement;

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      try {
        // Create disco balls
        this.createDiscoBalls(container);

        // Create floating particles
        this.createFloatingParticles(container);

        // Create pulsing background elements
        this.createPulsingElements(container);

        // Create celebration stars
        this.createCelebrationStars(container);

        // Create confetti elements
        this.createConfetti(container);

        // Start the main party animation timeline
        this.startPartyTimeline();
      } catch (error) {
        console.error('Failed to create animations:', error);
      }
    });
  }

  private createDiscoBalls(container: HTMLElement): void {
    const isMobile = window.innerWidth < 768;
    const isLowEnd = window.innerWidth < 480 || navigator.hardwareConcurrency <= 2;
    const ballCount = isLowEnd ? 2 : isMobile ? 3 : 4; // Reduced for better performance
    const ballSizes = [40, 50, 60, 70, 80]; // Different sizes for variety

    console.log(`Creating ${ballCount} disco balls`); // Debug log

    // Create a test ball positioned below the input area
    const testBall = document.createElement('div');
    testBall.className = 'disco-ball';
    testBall.style.width = '80px';
    testBall.style.height = '80px';
    testBall.style.left = '50%';
    testBall.style.top = '400px'; // Position below the input form
    testBall.style.transform = 'translateX(-50%)'; // Center horizontally
    testBall.style.opacity = '1';
    testBall.style.zIndex = '2'; // Below UI elements but above background
    testBall.style.position = 'fixed';
    testBall.style.background = '#FFD700'; // Bright gold for visibility
    testBall.style.border = '3px solid #FF0000'; // Red border for debugging
    container.appendChild(testBall);
    console.log('Test ball created at position below input');

    for (let i = 0; i < ballCount; i++) {
      const ball = document.createElement('div');
      ball.className = 'disco-ball';

      // Random size from the array
      const size = ballSizes[Math.floor(Math.random() * ballSizes.length)];
      ball.style.width = size + 'px';
      ball.style.height = size + 'px';

      // Position balls below the input area (starting from around 350px down)
      const leftPos = Math.random() * (window.innerWidth - size);
      const topPos = 350 + Math.random() * (window.innerHeight - 350 - size); // Start from 350px down
      ball.style.left = leftPos + 'px';
      ball.style.top = topPos + 'px';
      ball.style.opacity = '1'; // Start visible for debugging
      ball.style.zIndex = '2'; // Below UI elements but above background
      ball.style.position = 'fixed'; // Use fixed positioning

      // Add a data attribute for debugging
      ball.setAttribute('data-ball-id', i.toString());

      console.log(`Created disco ball ${i}: ${size}px at (${ball.style.left}, ${ball.style.top})`); // Debug log

      container.appendChild(ball);

      // Enhanced physics-based bouncing animation with realistic easing
      const ballAnimation = anime({
        targets: ball,
        translateY: [
          { value: -100 - Math.random() * 200, duration: 2700, easing: 'easeOutBounce' }, // More realistic bounce
          { value: 50 + Math.random() * 100, duration: 2700, easing: 'easeInQuart' }, // Gravity effect
          { value: -80 - Math.random() * 120, duration: 2430, easing: 'easeOutBounce' },
          { value: 30 + Math.random() * 80, duration: 2430, easing: 'easeInQuart' }
        ],
        translateX: [
          { value: -50 + Math.random() * 100, duration: 2025, easing: 'easeInOutSine' },
          { value: -30 + Math.random() * 60, duration: 2025, easing: 'easeInOutSine' },
          { value: -40 + Math.random() * 80, duration: 2025, easing: 'easeInOutSine' },
          { value: -25 + Math.random() * 50, duration: 2025, easing: 'easeInOutSine' }
        ],
        rotate: [
          { value: 360, duration: 5400, easing: 'linear' }, // Smooth continuous rotation
          { value: 720, duration: 5400, easing: 'linear' }
        ],
        scale: [
          { value: 0.8, duration: 1350, easing: 'easeOutElastic' }, // Elastic scaling for bounce effect
          { value: 1.2, duration: 1350, easing: 'easeInElastic' },
          { value: 0.9, duration: 1350, easing: 'easeOutElastic' },
          { value: 1.1, duration: 1350, easing: 'easeInElastic' }
        ],
        opacity: [
          { value: 1, duration: 0 }, // Start fully visible
          { value: 0.9, duration: 1350 },
          { value: 0.7, duration: 2700 },
          { value: 0.9, duration: 1350 },
          { value: 0.8, duration: 2700 }
        ],
        filter: [
          { value: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3)) brightness(1.1) blur(0px)', duration: 2700 },
          { value: 'drop-shadow(0 8px 16px rgba(115, 147, 179, 0.4)) brightness(1.3) blur(0.5px)', duration: 2700 },
          { value: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3)) brightness(1.1) blur(0px)', duration: 2700 }
        ],
        duration: 10800, // Reduced speed by 35%
        loop: true,
        easing: 'easeInOutQuad',
        delay: Math.random() * 4050,
        update: function(anim: any) {
          // Add dynamic glow effect based on animation progress
          const progress = anim.progress / 100;
          if (progress > 0.3 && progress < 0.7) {
            ball.classList.add('glowing');
          } else {
            ball.classList.remove('glowing');
          }
        }
      });

      this.animations.push(ballAnimation);
    }
  }

  private createFloatingParticles(container: HTMLElement): void {
    // Optimized particle count for better performance
    const isMobile = window.innerWidth < 768;
    const isLowEnd = window.innerWidth < 480 || navigator.hardwareConcurrency <= 2;
    const particleCount = isLowEnd ? 6 : isMobile ? 10 : 20; // Reduced for better performance
    const colors = [
      '#7393B3', '#097969', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', // Original colors
      '#E74C3C', '#9B59B6', '#F39C12', '#27AE60', '#3498DB', '#E67E22', // New complementary colors
      '#1ABC9C', '#34495E', '#F1C40F', '#8E44AD', '#2ECC71', '#E91E63'  // Additional variety
    ];
    const shapes = ['circle', 'square', 'triangle'];
    const sizes = [16, 20, 24, 28]; // Different sizes for variety

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      // Set class based on shape
      particle.className = `party-${shape}`;

      // Apply color and size based on shape
      if (shape === 'triangle') {
        particle.style.borderBottomColor = color;
        particle.style.borderLeftWidth = (size / 2) + 'px';
        particle.style.borderRightWidth = (size / 2) + 'px';
        particle.style.borderBottomWidth = (size * 0.87) + 'px'; // Height for equilateral triangle
      } else {
        particle.style.background = color;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
      }

      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.opacity = '0';

      // Add trail effect to some particles
      if (Math.random() > 0.7) {
        particle.classList.add('particle-trail');
      }

      container.appendChild(particle);

      // Enhanced floating animation with realistic easing and motion blur
      const floatAnimation = anime({
        targets: particle,
        translateY: [
          { value: -50, duration: 2700, easing: 'easeOutSine' },
          { value: 50, duration: 2700, easing: 'easeInSine' }
        ],
        translateX: [
          { value: -30, duration: 2025, easing: 'easeInOutCubic' },
          { value: 30, duration: 2025, easing: 'easeInOutCubic' }
        ],
        scale: [
          { value: 1.2, duration: 1350, easing: 'easeOutBack' },
          { value: 0.8, duration: 1350, easing: 'easeInBack' }
        ],
        opacity: [
          { value: 0.7, duration: 1350 },
          { value: 0.3, duration: 1350 }
        ],
        rotate: 360,
        duration: 5400,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine',
        delay: Math.random() * 2700,
        update: function(anim: any) {
          // Add motion blur based on speed
          const progress = anim.progress / 100;
          const speed = Math.abs(Math.sin(progress * Math.PI * 2));

          if (speed > 0.7) {
            particle.classList.add('motion-blur-heavy');
            particle.classList.remove('motion-blur');
          } else if (speed > 0.4) {
            particle.classList.add('motion-blur');
            particle.classList.remove('motion-blur-heavy');
          } else {
            particle.classList.remove('motion-blur', 'motion-blur-heavy');
          }
        }
      });

      this.animations.push(floatAnimation);
    }
  }

  private createPulsingElements(container: HTMLElement): void {
    // Reduce pulse count on mobile for better performance
    const isMobile = window.innerWidth < 768;
    const pulseCount = isMobile ? 4 : 8;
    const colors = ['rgba(115, 147, 179, 0.1)', 'rgba(9, 121, 105, 0.1)', 'rgba(255, 215, 0, 0.1)'];

    for (let i = 0; i < pulseCount; i++) {
      const pulse = document.createElement('div');
      pulse.className = 'pulse-element';
      pulse.style.background = colors[Math.floor(Math.random() * colors.length)];
      pulse.style.width = '100px';
      pulse.style.height = '100px';
      pulse.style.left = Math.random() * 100 + '%';
      pulse.style.top = Math.random() * 100 + '%';
      pulse.style.opacity = '0';
      container.appendChild(pulse);

      const pulseAnimation = anime({
        targets: pulse,
        scale: [
          { value: 0, duration: 0 },
          { value: 2, duration: 2700 }, // 2000 * 1.35
          { value: 0, duration: 2700 }
        ],
        opacity: [
          { value: 0, duration: 0 },
          { value: 0.6, duration: 1350 }, // 1000 * 1.35
          { value: 0, duration: 1350 }
        ],
        duration: 5400, // 4000 * 1.35
        loop: true,
        easing: 'easeInOutQuad',
        delay: Math.random() * 4050 // 3000 * 1.35
      });

      this.animations.push(pulseAnimation);
    }
  }

  private createCelebrationStars(container: HTMLElement): void {
    // Reduce star count on mobile for better performance
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 6 : 12;
    const starSymbols = ['⭐', '✨', '🌟', '💫', '⚡'];

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'party-star';
      star.textContent = starSymbols[Math.floor(Math.random() * starSymbols.length)];
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.opacity = '0';
      container.appendChild(star);

      const starAnimation = anime({
        targets: star,
        opacity: [
          { value: 0, duration: 0 },
          { value: 1, duration: 675 }, // 500 * 1.35
          { value: 0.3, duration: 1350 }, // 1000 * 1.35
          { value: 1, duration: 675 },
          { value: 0, duration: 675 }
        ],
        scale: [
          { value: 0.5, duration: 675 },
          { value: 1.5, duration: 1350 },
          { value: 1, duration: 1350 },
          { value: 1.2, duration: 675 }
        ],
        rotate: [
          { value: 0, duration: 0 },
          { value: 180, duration: 2025 }, // 1500 * 1.35
          { value: 360, duration: 2025 }
        ],
        duration: 4050, // 3000 * 1.35
        loop: true,
        easing: 'easeInOutBack',
        delay: Math.random() * 5400 // 4000 * 1.35
      });

      this.animations.push(starAnimation);
    }
  }

  private createConfetti(container: HTMLElement): void {
    // Reduce confetti count on mobile for better performance
    const isMobile = window.innerWidth < 768;
    const confettiCount = isMobile ? 10 : 20;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'party-confetti';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = '-10px';
      confetti.style.opacity = '0';
      container.appendChild(confetti);

      const confettiAnimation = anime({
        targets: confetti,
        translateY: window.innerHeight + 100,
        translateX: [
          { value: -100 + Math.random() * 200, duration: 2700, easing: 'easeInOutSine' }
        ],
        rotate: 720,
        opacity: [
          { value: 0.8, duration: 675 },
          { value: 0, duration: 2025 }
        ],
        scale: [
          { value: 1, duration: 1350, easing: 'easeOutBounce' },
          { value: 0.5, duration: 1350, easing: 'easeInQuad' }
        ],
        duration: 4050 + Math.random() * 2700,
        loop: true,
        easing: 'easeInQuad',
        delay: Math.random() * 6750,
        update: function(anim: any) {
          // Add motion blur for falling confetti
          const progress = anim.progress / 100;
          if (progress > 0.2 && progress < 0.8) {
            confetti.classList.add('motion-blur');
          } else {
            confetti.classList.remove('motion-blur');
          }
        }
      });

      this.animations.push(confettiAnimation);
    }
  }

  private startPartyTimeline(): void {
    // Create a main timeline for coordinated effects - Reduced speed by 35%
    const mainTimeline = anime.timeline({
      loop: true,
      duration: 10800, // 8000 * 1.35
      easing: 'easeInOutSine'
    });

    // Add header pulsing effect
    mainTimeline.add({
      targets: '.header h1',
      scale: [1, 1.05, 1],
      textShadow: [
        '0 4px 8px rgba(0, 0, 0, 0.3)',
        '0 8px 16px rgba(115, 147, 179, 0.4)',
        '0 4px 8px rgba(0, 0, 0, 0.3)'
      ],
      duration: 2700 // 2000 * 1.35
    }, 0);

    // Add card subtle animation
    mainTimeline.add({
      targets: '.converter-card',
      boxShadow: [
        '0 25px 50px rgba(0, 0, 0, 0.15)',
        '0 35px 70px rgba(115, 147, 179, 0.25)',
        '0 25px 50px rgba(0, 0, 0, 0.15)'
      ],
      duration: 4050 // 3000 * 1.35
    }, 1350); // 1000 * 1.35

    this.animations.push(mainTimeline);
  }

  private pauseAnimations(): void {
    this.animationService.pauseAll();
  }

  private resumeAnimations(): void {
    this.animationService.resumeAll();
  }

  // Legal compliance methods
  private checkLegalAcceptance(): void {
    try {
      const stored = localStorage.getItem('beatburst_legal_acceptance');
      if (stored) {
        const acceptance: LegalAcceptance = JSON.parse(stored);
        if (acceptance.version === this.LEGAL_VERSION && acceptance.accepted) {
          this.userAcceptedTerms = true;
          this.showLegalNotice = false;
        }
      }
    } catch (error) {
      console.warn('Failed to check legal acceptance:', error);
      // Default to showing legal notice
    }
  }

  acceptTerms(): void {
    try {
      const acceptance: LegalAcceptance = {
        accepted: true,
        timestamp: new Date(),
        version: this.LEGAL_VERSION
      };
      localStorage.setItem('beatburst_legal_acceptance', JSON.stringify(acceptance));
      this.userAcceptedTerms = true;
      this.showLegalNotice = false;
    } catch (error) {
      console.error('Failed to save legal acceptance:', error);
      // Still allow user to proceed but log the error
      this.userAcceptedTerms = true;
      this.showLegalNotice = false;
    }
  }

  rejectTerms(): void {
    // User rejected terms - they cannot use the application
    alert('You must accept the terms to use this application. The application will now close.');
    // In a real app, you might redirect to a different page or close the window
    window.close();
  }
}
