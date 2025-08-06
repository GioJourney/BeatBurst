export const ANIMATION_COLORS = {
  PARTICLES: [
    '#7393B3', '#097969', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', // Original colors
    '#E74C3C', '#9B59B6', '#F39C12', '#27AE60', '#3498DB', '#E67E22', // New complementary colors
    '#1ABC9C', '#34495E', '#F1C40F', '#8E44AD', '#2ECC71', '#E91E63'  // Additional variety
  ],
  PULSE: [
    'rgba(115, 147, 179, 0.1)', 
    'rgba(9, 121, 105, 0.1)', 
    'rgba(255, 215, 0, 0.1)'
  ],
  CONFETTI: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8'
  ]
};

export const ANIMATION_SHAPES = ['circle', 'square', 'triangle'];

export const ANIMATION_SIZES = {
  PARTICLES: [16, 20, 24, 28],
  BALLS: [40, 50, 60, 70, 80],
  PULSE: [100]
};

export const ANIMATION_DURATIONS = {
  // All durations reduced by 35% for more relaxed effect
  FLOAT: 5400,
  PULSE: 5400,
  STAR: 4050,
  CONFETTI: 4050,
  BALL: 10800,
  TIMELINE: 10800
};

export const ANIMATION_DELAYS = {
  FLOAT: 2700,
  PULSE: 4050,
  STAR: 5400,
  CONFETTI: 6750,
  BALL: 4050,
  TIMELINE: 1350
};

export const STAR_SYMBOLS = ['⭐', '✨', '🌟', '💫', '⚡'];

export const EASING_FUNCTIONS = {
  BOUNCE: 'easeOutBounce',
  ELASTIC: 'easeOutElastic',
  BACK: 'easeOutBack',
  SINE: 'easeInOutSine',
  QUAD: 'easeInOutQuad',
  CUBIC: 'easeInOutCubic',
  LINEAR: 'linear'
};
