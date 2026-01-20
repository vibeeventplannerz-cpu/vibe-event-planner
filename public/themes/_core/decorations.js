/**
 * Festival Decorations Animation System
 * Lightweight, elegant particle effects for festival themes
 * Performance-optimized with automatic cleanup
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    maxParticles: 15,
    maxRockets: 8,
    particleCleanupDelay: 12000, // Remove from DOM after animation
    spawnInterval: 800 // ms between particle spawns
  };

  // Track active particles to respect limits
  let activeParticles = 0;
  let activeRockets = 0;
  let lastSpawnTime = 0;

  /**
   * Create a particle animation container if it doesn't exist
   */
  function ensureParticleContainer() {
    let container = document.getElementById('particles-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'particles-container';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5;
        overflow: hidden;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Create a falling particle (for Pongal, Diwali falling glow)
   * @param {string} emoji - Emoji character to display
   * @param {string} themeClass - CSS class for styling
   * @param {number} duration - Animation duration in seconds
   */
  function createFallingParticle(emoji, themeClass, duration = 10) {
    if (activeParticles >= CONFIG.maxParticles) return;
    
    const now = Date.now();
    if (now - lastSpawnTime < CONFIG.spawnInterval) return;
    lastSpawnTime = now;

    activeParticles++;
    const container = ensureParticleContainer();
    
    const particle = document.createElement('div');
    const startX = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 30; // Horizontal drift
    const delay = Math.random() * 0.2;
    const size = 0.8 + Math.random() * 0.4; // Size variation
    const randomId = Math.random().toString(36).substr(2, 9);
    
    particle.className = `falling-particle ${themeClass}`;
    particle.innerHTML = emoji;
    
    particle.style.cssText = `
      position: fixed;
      left: ${startX}%;
      top: -50px;
      font-size: ${1.2 * size}rem;
      pointer-events: none;
      filter: drop-shadow(0 0 ${4 * size}px rgba(255, 215, 0, 0.4));
      will-change: transform, opacity;
    `;

    // Use inline animation with safe keyframe names
    const keyframes = `
      @keyframes fall${randomId} {
        0% {
          transform: translateY(0) translateX(0);
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
        100% {
          transform: translateY(100vh) translateX(${drift}px);
          opacity: 0;
        }
      }
    `;

    // Inject keyframes
    if (!document.getElementById('particle-keyframes')) {
      const style = document.createElement('style');
      style.id = 'particle-keyframes';
      document.head.appendChild(style);
    }
    
    try {
      const stylesheet = document.getElementById('particle-keyframes').sheet;
      stylesheet.insertRule(keyframes, stylesheet.cssRules.length);
      particle.style.animation = `fall${randomId} ${duration}s linear ${delay}s forwards`;
    } catch (error) {
      console.warn('[Decorations] Failed to inject keyframe:', error);
      // Fallback: use CSS animation
      particle.style.animation = `none`;
    }

    container.appendChild(particle);

    // Cleanup after animation
    setTimeout(() => {
      particle.remove();
      activeParticles--;
    }, (duration + delay) * 1000 + CONFIG.particleCleanupDelay);
  }

  /**
   * Create a rocket/spark particle (for Diwali horizontal movement)
   * @param {string} emoji - Emoji character
   * @param {string} themeClass - CSS class
   * @param {string} direction - 'left' or 'right'
   * @param {number} duration - Animation duration
   */
  function createRocketParticle(emoji, themeClass, direction = 'left', duration = 8) {
    if (activeRockets >= CONFIG.maxRockets) return;

    activeRockets++;
    const container = ensureParticleContainer();

    const particle = document.createElement('div');
    const startY = Math.random() * 80 + 10; // Random vertical position
    const distance = direction === 'left' ? -120 : 120; // vw travel distance
    const delay = Math.random() * 0.5;
    
    particle.className = `rocket-particle ${themeClass}`;
    particle.innerHTML = emoji;

    particle.style.cssText = `
      position: fixed;
      left: ${direction === 'left' ? 100 : 0}%;
      top: ${startY}%;
      font-size: 1.5rem;
      pointer-events: none;
      filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
      will-change: transform, opacity;
    `;

    // Rocket animation
    const randomId = Math.random().toString(36).substr(2, 9);
    const keyframes = `
      @keyframes rocket${randomId} {
        0% {
          transform: translateX(0) rotate(0deg);
          opacity: 1;
        }
        70% {
          opacity: 1;
        }
        100% {
          transform: translateX(${distance}vw) rotate(${direction === 'left' ? -30 : 30}deg);
          opacity: 0;
        }
      }
    `;

    if (!document.getElementById('rocket-keyframes')) {
      const style = document.createElement('style');
      style.id = 'rocket-keyframes';
      document.head.appendChild(style);
    }
    
    try {
      const stylesheet = document.getElementById('rocket-keyframes').sheet;
      stylesheet.insertRule(keyframes, stylesheet.cssRules.length);
      particle.style.animation = `rocket${randomId} ${duration}s ease-in ${delay}s forwards`;
    } catch (error) {
      console.warn('[Decorations] Failed to inject rocket keyframe:', error);
      particle.style.animation = `none`;
    }

    container.appendChild(particle);

    // Cleanup
    setTimeout(() => {
      particle.remove();
      activeRockets--;
    }, (duration + delay) * 1000 + CONFIG.particleCleanupDelay);
  }

  /**
   * Start Pongal decorations
   */
  function startPongalDecorations() {
    console.log('[Decorations] Starting Pongal theme animations');
    
    const pongalElements = [
      { emoji: '🌾', chance: 0.4 },
      { emoji: '🌻', chance: 0.3 },
      { emoji: '🎋', chance: 0.2 },
      { emoji: '✨', chance: 0.1 }
    ];

    const spawnParticle = () => {
      if (document.documentElement.getAttribute('data-active-theme') !== 'pongal') {
        return; // Stop if theme changed
      }

      const element = pongalElements[Math.floor(Math.random() * pongalElements.length)];
      if (Math.random() < element.chance) {
        createFallingParticle(element.emoji, 'pongal-particle', 11);
      }
      
      // Continue spawning
      setTimeout(spawnParticle, CONFIG.spawnInterval);
    };

    spawnParticle();
  }

  /**
   * Start Diwali decorations (dual system)
   */
  function startDiwaliDecorations() {
    console.log('[Decorations] Starting Diwali theme animations');

    const glowElements = [
      { emoji: '🪔', chance: 0.4 },
      { emoji: '✨', chance: 0.3 },
      { emoji: '💫', chance: 0.2 },
      { emoji: '⭐', chance: 0.1 }
    ];

    const rocketElements = [
      { emoji: '🎆', chance: 0.5 },
      { emoji: '✨', chance: 0.3 },
      { emoji: '💥', chance: 0.2 }
    ];

    // Spawn falling glow particles
    const spawnGlowParticle = () => {
      if (document.documentElement.getAttribute('data-active-theme') !== 'diwali') {
        return;
      }

      const element = glowElements[Math.floor(Math.random() * glowElements.length)];
      if (Math.random() < element.chance) {
        createFallingParticle(element.emoji, 'diwali-glow-particle', 12);
      }

      setTimeout(spawnGlowParticle, CONFIG.spawnInterval * 1.2);
    };

    // Spawn rockets/sparks
    const spawnRocket = () => {
      if (document.documentElement.getAttribute('data-active-theme') !== 'diwali') {
        return;
      }

      const element = rocketElements[Math.floor(Math.random() * rocketElements.length)];
      if (Math.random() < element.chance) {
        const direction = Math.random() > 0.5 ? 'left' : 'right';
        createRocketParticle(element.emoji, 'diwali-rocket-particle', direction, 9);
      }

      setTimeout(spawnRocket, CONFIG.spawnInterval * 1.5);
    };

    spawnGlowParticle();
    spawnRocket();
  }

  /**
   * Start Christmas snowfall
   */
  function startChristmasDecorations() {
    console.log('[Decorations] Starting Christmas theme animations');
    
    const snowflakes = ['❄', '🎄', '⛄', '🎅', '🎁', '✨' , '❄️'];

    const spawnSnowflake = () => {
      if (document.documentElement.getAttribute('data-active-theme') !== 'christmas') {
        return; // Stop if theme changed
      }

      const snowflake = snowflakes[Math.floor(Math.random() * snowflakes.length)];
      // Slower spawn rate for snow
      if (Math.random() < 0.6) {
        createFallingParticle(snowflake, 'christmas-snowflake', 15);
      }
      
      // Continue spawning
      setTimeout(spawnSnowflake, 600); // Slower than Diwali/Pongal
    };

    spawnSnowflake();
  }

  /**
   * Stop all decorations
   */
  function stopDecorations() {
    console.log('[Decorations] Stopping theme animations');
    const container = document.getElementById('particles-container');
    if (container) {
      container.innerHTML = '';
    }
    activeParticles = 0;
    activeRockets = 0;
  }

  /**
   * Initialize decoration system
   */
  function initDecorations() {
    // Listen for theme changes
    window.addEventListener('themeChanged', (e) => {
      stopDecorations();
      
      const theme = e.detail?.theme;
      if (theme === 'pongal') {
        setTimeout(startPongalDecorations, 300);
      } else if (theme === 'diwali') {
        setTimeout(startDiwaliDecorations, 300);
      } else if (theme === 'christmas') {
        setTimeout(startChristmasDecorations, 300);
      }
    });

    // Check current theme on load
    const currentTheme = document.documentElement.getAttribute('data-active-theme');
    if (currentTheme === 'pongal') {
      startPongalDecorations();
    } else if (currentTheme === 'diwali') {
      startDiwaliDecorations();
    } else if (currentTheme === 'christmas') {
      startChristmasDecorations();
    }
  }

  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDecorations);
  } else {
    initDecorations();
  }

  // Expose API for debugging
  window.DecorationSystem = {
    startPongal: startPongalDecorations,
    startDiwali: startDiwaliDecorations,
    stop: stopDecorations,
    getStats: () => ({ activeParticles, activeRockets })
  };

})();
