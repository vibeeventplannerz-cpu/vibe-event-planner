/**
 * Festival Theme Engine - HYBRID APPROACH
 * 
 * FAST LOADING: Load from localStorage (instant! ⚡)
 * REAL-TIME SYNC: Listen to Firebase for admin updates (instant push! 📡)
 * 
 * How it works:
 * 1. Page loads → Get theme from localStorage (fast!) → Apply immediately ✅
 * 2. Meanwhile → Listen to Firebase (background) 
 * 3. Admin changes theme → Firebase updates → Push to all users → Update localStorage ✅
 * 4. User sees instant update + instant load on next page visit
 */

(function() {
  'use strict';

  // Configuration
  const FIREBASE_THEME_PATH = 'active-theme';
  const LOCALSTORAGE_KEY = 'vibe-active-theme';
  const DEFAULT_THEME = 'default';
  const SUPPORTED_THEMES = [
    'default',
    'newyear',
    'pongal',
    'republic-day',
    'independence-day',
    'ayudha-pujai',
    'diwali',
    'christmas'
  ];

  // Global theme state
  let currentTheme = DEFAULT_THEME;
  let currentMode = 'light';
  let themeLoaded = false;
  let firebaseListener = null;

  /**
   * Load theme from localStorage (FAST!)
   */
  function loadThemeFromStorage() {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        return {
          theme: config.theme || DEFAULT_THEME,
          mode: config.mode || 'light'
        };
      }
    } catch (e) {
      console.warn('[ThemeEngine] Error loading from localStorage:', e);
    }
    return { theme: DEFAULT_THEME, mode: 'light' };
  }

  /**
   * Save theme to localStorage
   */
  function saveThemeToStorage(theme, mode) {
    try {
      const config = {
        theme: theme,
        mode: mode,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(config));
      console.log('[ThemeEngine] 💾 Saved to localStorage:', theme);
    } catch (e) {
      console.warn('[ThemeEngine] Error saving to localStorage:', e);
    }
  }

  /**
   * Initialize theme engine - HYBRID APPROACH
   * 
   * Phase 1: Load from localStorage immediately (instant!)
   * Phase 2: Setup Firebase listener (background)
   * Phase 3: When Firebase updates → Update all users + their localStorage
   */
  async function initThemeEngine() {
    try {
      console.log('[ThemeEngine] 🚀 Initializing hybrid approach...');

      // PHASE 1: Load from localStorage immediately (⚡ FAST!)
      console.log('[ThemeEngine] ⚡ Phase 1: Load from localStorage...');
      const storedTheme = loadThemeFromStorage();
      currentTheme = storedTheme.theme;
      currentMode = storedTheme.mode;
      
      console.log(`[ThemeEngine] 📦 Loaded from localStorage: ${currentTheme}`);
      applyTheme(currentTheme, currentMode);
      themeLoaded = true;

      // PHASE 2: Setup Firebase listener (📡 real-time updates)
      if (!window.firebaseDB) {
        console.warn('[ThemeEngine] Firebase not initialized, using localStorage only');
        setupGlobalAPI();
        return;
      }

      console.log('[ThemeEngine] 📡 Phase 2: Setup Firebase listener...');
      const db = window.firebaseDB;
      const ref = db.ref(FIREBASE_THEME_PATH);

      // Listen to Firebase updates
      firebaseListener = ref.on('value', (snapshot) => {
        if (snapshot.exists()) {
          const config = snapshot.val();
          console.log('[ThemeEngine] 🔥 Got Firebase update:', config);

          // PHASE 3: Update when Firebase changes
          if (config.theme && config.theme !== currentTheme) {
            currentTheme = config.theme;
            currentMode = config.mode || 'light';

            console.log(`[ThemeEngine] 🎨 Admin updated theme to: ${currentTheme}`);
            
            // Apply theme instantly to current page
            applyTheme(currentTheme, currentMode);
            
            // Save to localStorage for fast next load
            saveThemeToStorage(currentTheme, currentMode);

            // Log admin info
            if (config.changedBy) {
              console.log(`[ThemeEngine] 👤 Changed by: ${config.changedBy}`);
            }
            if (config.timestamp) {
              console.log(`[ThemeEngine] ⏰ At: ${config.timestamp}`);
            }

            // Dispatch custom event (other scripts can listen)
            window.dispatchEvent(new CustomEvent('themeChanged', {
              detail: { theme: currentTheme, mode: currentMode, source: 'firebase' }
            }));
          }
        }
      });

      setupGlobalAPI();
      console.log('[ThemeEngine] ✓ Hybrid approach initialized');
      console.log('[ThemeEngine] ✓ Fast localStorage + Real-time Firebase sync active');

    } catch (error) {
      console.warn('[ThemeEngine] Initialization error:', error);
      setupGlobalAPI();
      applyTheme(currentTheme, currentMode);
      themeLoaded = true;
    }
  }

  /**
   * Setup global API for theme management
   */
  function setupGlobalAPI() {
    window.ThemeAPI = {
      getCurrentTheme: () => currentTheme,
      getCurrentMode: () => currentMode,
      isThemeLoaded: () => themeLoaded,
      getActiveFestival: () => currentTheme !== DEFAULT_THEME ? currentTheme : null
    };
  }

  /**
   * Public API for theme management
   */
  window.ThemeEngine = {
    /**
     * Change active theme (admin use)
     * This will be called by admin.html after saving to Firebase
     */
    setTheme: async function(themeName, mode = 'light') {
      if (!SUPPORTED_THEMES.includes(themeName)) {
        console.error(`[ThemeEngine] Invalid theme: ${themeName}`);
        return false;
      }

      currentTheme = themeName;
      currentMode = mode;

      // Apply immediately to this page
      applyTheme(themeName, mode);

      return true;
    },

    /**
     * Get current theme info
     */
    getThemeInfo: function() {
      return {
        theme: currentTheme,
        mode: currentMode,
        isDefault: currentTheme === DEFAULT_THEME
      };
    },

    /**
     * List all supported themes
     */
    getSupportedThemes: function() {
      return SUPPORTED_THEMES;
    }
  };

  /**
   * Apply theme by loading CSS and scripts
   */
  function applyTheme(themeName, mode = 'light') {
    // Validate theme
    if (!SUPPORTED_THEMES.includes(themeName)) {
      console.warn(`Unsupported theme: ${themeName}, falling back to default`);
      themeName = DEFAULT_THEME;
    }

    console.log(`[ThemeEngine] Applying theme: ${themeName} (${mode} mode)`);

    // Store theme info in document FIRST for CSS queries
    document.documentElement.setAttribute('data-active-theme', themeName);
    document.documentElement.setAttribute('data-theme-mode', mode);

    // Remove any existing theme stylesheets (except core and default)
    const existingThemeLinks = document.querySelectorAll('link[data-theme-stylesheet]');
    existingThemeLinks.forEach(link => {
      if (!link.getAttribute('data-theme-name').includes('_core')) {
        link.remove();
      }
    });

    // Load core stylesheets if not already loaded
    loadCoreStylesheets();

    // Load theme-specific stylesheet
    if (themeName !== DEFAULT_THEME) {
      console.log(`[ThemeEngine] Loading stylesheet for ${themeName}`);
      loadThemeStylesheet(themeName, mode);
    } else {
      console.log(`[ThemeEngine] Using default theme (no custom stylesheet)`);
    }

    // Load theme-specific scripts
    loadThemeScripts(themeName);
    
    // Load thoranam decoration for Pongal and Diwali
    loadThoranam(themeName);
    
    console.log(`[ThemeEngine] Theme ${themeName} applied successfully`);
  }

  /**
   * Load thoranam decoration (All festivals - CSS will show/hide based on theme)
   * Only shown on calendar, admin, and events pages (not on index page)
   */
  function loadThoranam(themeName) {
    // Remove old thoranam
    const oldThoranam = document.getElementById('thoranam-container');
    if (oldThoranam) {
      oldThoranam.remove();
    }

    // List of festivals that have thoranam decorations
    const thoranamThemes = ['pongal', 'diwali', 'christmas', 'newyear', 'republic-day', 'independence-day', 'ayudha-pujai'];
    
    if (!thoranamThemes.includes(themeName)) {
      console.log(`[ThemeEngine] No thoranam for theme: ${themeName}`);
      return;
    }

    // Only show thoranam on specific pages (calendar, admin, events - not index)
    const currentPage = window.location.pathname;
    const allowedPages = ['calendar', 'admin', 'events'];
    const shouldShowThoranam = allowedPages.some(page => currentPage.includes(page));
    
    if (!shouldShowThoranam) {
      console.log(`[ThemeEngine] Thoranam not shown on this page: ${currentPage}`);
      return;
    }

    console.log(`[ThemeEngine] Loading thoranam for ${themeName}`);

    // Create container with background-image (no need to fetch SVG)
    // CSS will apply the correct background-image based on data-active-theme attribute
    const container = document.createElement('div');
    container.id = 'thoranam-container';
    container.className = 'thoranam-container';
    
    // Insert at top of body
    document.body.insertBefore(container, document.body.firstChild);
    console.log(`[ThemeEngine] Thoranam container created for ${themeName}`);
  }

  /**
   * Load core stylesheets (only once)
   */
  function loadCoreStylesheets() {
    // Check if core is already loaded
    const coreLink = document.querySelector('link[data-theme-name="core-particles"]');
    if (coreLink) {
      console.log('[ThemeEngine] Core stylesheets already loaded');
      return;
    }

    console.log('[ThemeEngine] Loading core stylesheets...');
    // Load base and particles CSS
    const baseLink = createStylesheetLink('/themes/_core/base.css', 'core-base');
    const particlesLink = createStylesheetLink('/themes/_core/particles.css', 'core-particles');
    const thoranamLink = createStylesheetLink('/themes/_core/thoranam.css', 'core-thoranam');
    const overridesLink = createStylesheetLink('/themes/_core/theme-overrides.css', 'core-overrides');
    const decorationsLink = createStylesheetLink('/themes/_core/decorations.css', 'core-decorations');

    document.head.appendChild(baseLink);
    document.head.appendChild(particlesLink);
    document.head.appendChild(thoranamLink);
    document.head.appendChild(overridesLink);
    document.head.appendChild(decorationsLink);
    
    // Load decorations script
    const decorationsScript = document.createElement('script');
    decorationsScript.src = '/themes/_core/decorations.js';
    decorationsScript.async = false;
    decorationsScript.setAttribute('data-theme-script', 'decorations');
    document.head.appendChild(decorationsScript);
    
    console.log('[ThemeEngine] Core stylesheets and scripts loaded');
  }

  /**
   * Load theme-specific stylesheet
   */
  function loadThemeStylesheet(themeName, mode = 'light') {
    // For diwali, load mode-specific CSS
    if (themeName === 'diwali') {
      const filename = mode === 'dark' ? 'dark.css' : 'light.css';
      const link = createStylesheetLink(`/themes/diwali/${filename}`, `theme-${themeName}-${mode}`);
      console.log(`[ThemeEngine] Loading /themes/diwali/${filename}`);
      document.head.appendChild(link);
    } else {
      const link = createStylesheetLink(`/themes/${themeName}/theme.css`, `theme-${themeName}`);
      console.log(`[ThemeEngine] Loading /themes/${themeName}/theme.css`);
      document.head.appendChild(link);
    }
  }

  /**
   * Load theme-specific scripts
   */
  function loadThemeScripts(themeName) {
    // Only diwali has a special particles script for now
    if (themeName === 'diwali') {
      const script = document.createElement('script');
      script.src = '/themes/diwali/particles.js';
      script.async = true;
      script.setAttribute('data-theme-script', 'diwali');
      script.onerror = () => console.warn('Failed to load diwali particles script');
      document.head.appendChild(script);
    }
  }

  /**
   * Helper: Create stylesheet link
   */
  function createStylesheetLink(href, themeName) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href + '?v=' + Date.now(); // Cache busting
    link.setAttribute('data-theme-stylesheet', 'true');
    link.setAttribute('data-theme-name', themeName);
    
    // Log when stylesheet loads or fails
    link.addEventListener('load', () => {
      console.log(`[ThemeEngine] ✓ Stylesheet loaded: ${href}`);
    });
    link.addEventListener('error', () => {
      console.error(`[ThemeEngine] ✗ Failed to load stylesheet: ${href}`);
    });
    
    return link;
  }

  /**
   * Public API for theme management
   */
  window.ThemeEngine = {
    /**
     * Change active theme (admin use)
     * This will be called by admin.html after saving to Firebase
     */
    setTheme: async function(themeName, mode = 'light') {
      if (!SUPPORTED_THEMES.includes(themeName)) {
        console.error(`[ThemeEngine] Invalid theme: ${themeName}`);
        return false;
      }

      currentTheme = themeName;
      currentMode = mode;

      // Apply immediately to this page
      applyTheme(themeName, mode);

      return true;
    },

    /**
     * Get current theme info
     */
    getThemeInfo: function() {
      return {
        theme: currentTheme,
        mode: currentMode,
        isDefault: currentTheme === DEFAULT_THEME
      };
    },

    /**
     * List all supported themes
     */
    getSupportedThemes: function() {
      return SUPPORTED_THEMES;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeEngine);
  } else {
    initThemeEngine();
  }

})();
