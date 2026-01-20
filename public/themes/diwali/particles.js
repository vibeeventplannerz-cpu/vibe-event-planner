/**
 * Diwali Particles System
 * Creates beautiful falling particle effects for Diwali theme
 * Lights, fireworks, flowers animations
 */

(function() {
  'use strict';

  // Only initialize if Diwali theme is active
  function initDiwaliParticles() {
    // Check if we're in Diwali theme
    const activeTheme = document.documentElement.getAttribute('data-active-theme');
    if (activeTheme !== 'diwali') return;

    // Create particles container
    const container = document.createElement('div');
    container.className = 'particles-container';
    container.id = 'diwali-particles';
    document.body.appendChild(container);

    // Particle types for Diwali
    const particleTypes = [
      { class: 'lamp', weight: 0.3 },
      { class: 'fireworks', weight: 0.3 },
      { class: 'star', weight: 0.2 },
      { class: 'flower', weight: 0.2 }
    ];

    // Configuration
    const config = {
      maxParticles: 30,
      particleSpeed: 8, // seconds to fall
      spawnRate: 300, // milliseconds between spawns
      minDelay: 0,
      maxDelay: 3000
    };

    let particleCount = 0;

    /**
     * Create a single particle
     */
    function createParticle() {
      if (particleCount >= config.maxParticles) return;

      // Select random particle type based on weight
      const particle = selectWeightedType(particleTypes);

      const el = document.createElement('div');
      el.className = `particle ${particle.class} falling`;

      // Random position across screen width
      const startX = Math.random() * window.innerWidth;
      const startY = -50;

      el.style.left = startX + 'px';
      el.style.top = startY + 'px';

      // Random animation duration (with sway)
      const duration = config.particleSpeed + (Math.random() * 3 - 1.5);
      const delay = Math.random() * (config.maxDelay - config.minDelay) + config.minDelay;

      el.style.setProperty('--duration', duration + 's');
      el.style.setProperty('--delay', (delay / 1000) + 's');

      // Add sway movement
      const swayAmount = (Math.random() - 0.5) * 100;
      el.style.setProperty('--sway-amount', swayAmount + 'px');

      // Add to container
      container.appendChild(el);
      particleCount++;

      // Remove particle after animation completes
      setTimeout(() => {
        el.remove();
        particleCount--;
      }, (duration + delay / 1000) * 1000);
    }

    /**
     * Select a random type based on weight
     */
    function selectWeightedType(types) {
      const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
      let random = Math.random() * totalWeight;

      for (let type of types) {
        random -= type.weight;
        if (random <= 0) return type;
      }

      return types[0];
    }

    /**
     * Spawn particles continuously
     */
    const spawnInterval = setInterval(() => {
      // Create 1-2 particles per spawn
      const count = Math.random() > 0.5 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        createParticle();
      }
    }, config.spawnRate);

    /**
     * Thoranam decoration is now managed by central theme-engine.js
     * No need to create it here - it will be created when theme is applied
     */

    // Initialize particles only (thoranam handled by theme-engine)
    
    // Create initial batch of particles
    for (let i = 0; i < 5; i++) {
      createParticle();
    }

    // Cleanup function
    window.DiwaliParticles = {
      stop: function() {
        clearInterval(spawnInterval);
        const existing = document.getElementById('diwali-particles');
        if (existing) existing.remove();
        // Note: thoranam cleanup is handled by theme-engine.js
      },
      start: function() {
        initDiwaliParticles();
      }
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiwaliParticles);
  } else {
    initDiwaliParticles();
  }
})();
