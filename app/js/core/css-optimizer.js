import tablesLazyUrl from '../../css/components/tables-lazy.css?url';
import formsLazyUrl from '../../css/components/forms-lazy.css?url';
import buttonsUrl from '../../css/buttons.css?url';
import sidebarUrl from '../../css/sidebar.css?url';
import mobilePatchUrl from '../../css/mobile-patch-v2.css?url';
import homeUrl from '../../css/home.css?url';

/**
 * CSS Optimization Utilities
 * - Handles critical CSS inlining
 * - Manages lazy loading of non-critical CSS
 * - Provides CSS code splitting for better performance
 */

/**
 * Dynamically loads CSS file asynchronously
 * @param {string} href - CSS file path
 * @param {string} media - Media query (optional)
 * @param {boolean} critical - Whether this is critical CSS
 * @returns {Promise<void>}
 */
export function loadCSS(href, media = 'all', critical = false) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = critical ? 'all' : 'print'; // Load as print initially to avoid blocking

    link.onload = () => {
      if (!critical) {
        // Switch to 'all' after load to apply styles
        setTimeout(() => {
          link.media = media;
        }, 0);
      }
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to load CSS: ${href}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Loads component-specific CSS only when needed
 * @param {string} component - Component name (e.g., 'soap', 'tables', 'forms')
 * @returns {Promise<void>}
 */
export async function loadComponentCSS(component) {
  const cssMap = {
    soap: [tablesLazyUrl],
    forms: [formsLazyUrl, buttonsUrl],
    navigation: [sidebarUrl],
    editor: [tablesLazyUrl, formsLazyUrl, buttonsUrl],
    mobile: [mobilePatchUrl],
    homev2: [homeUrl],
  };

  const cssFiles = cssMap[component];
  if (!cssFiles) {
    console.warn(`No CSS mapping found for component: ${component}`);
    return;
  }

  // Load multiple CSS files in parallel
  const loadPromises = cssFiles.map((file) => loadCSS(file));

  try {
    await Promise.all(loadPromises);
    // CSS component loaded successfully
  } catch (error) {
    console.error(`Failed to load CSS for component ${component}:`, error);
  }
}

/**
 * Preloads CSS for better performance, but only if not already loaded
 * @param {string[]} cssFiles - Array of CSS file paths
 */
export function preloadCSS(cssFiles) {
  cssFiles.forEach((href) => {
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) return;

    // Use prefetch (lower priority, no warning if unused quickly). Browsers will fetch when idle.
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'style';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Loads CSS based on route to implement CSS code splitting
 * @param {string} route - Current route (e.g., 'student', 'instructor', 'editor')
 */
export async function loadRouteCSS(route) {
  const routeCSSMap = {
    student: ['forms'],
    instructor: ['forms', 'navigation'],
    editor: ['editor', 'soap'],
    home: ['navigation', 'homev2'],
  };

  const components = routeCSSMap[route] || [];

  // Load component CSS in parallel
  const loadPromises = components.map((component) => loadComponentCSS(component));

  try {
    await Promise.all(loadPromises);
  } catch (error) {
    console.error(`Failed to load route CSS for ${route}:`, error);
  }
}

/**
 * Optimizes CSS loading strategy based on user interaction
 */
export class CSSOptimizer {
  constructor() {
    this.loadedComponents = new Set();
    this.preloadedRoutes = new Set();
  }

  /**
   * Loads CSS for a component if not already loaded
   * @param {string} component - Component name
   */
  async loadComponent(component) {
    if (this.loadedComponents.has(component)) {
      return; // Already loaded
    }

    await loadComponentCSS(component);
    this.loadedComponents.add(component);
  }

  /**
   * Preloads CSS for likely next routes
   * @param {string[]} routes - Routes to preload
   */
  preloadRoutes(routes) {
    routes.forEach((route) => {
      if (!this.preloadedRoutes.has(route)) {
        // Just preload the CSS files, don't apply them yet
        const routeCSSMap = {
          student: [formsLazyUrl, buttonsUrl],
          instructor: [formsLazyUrl, buttonsUrl, sidebarUrl],
          editor: [tablesLazyUrl, formsLazyUrl, buttonsUrl],
          home: [homeUrl],
        };

        const cssFiles = routeCSSMap[route] || [];
        if (cssFiles.length > 0) {
          preloadCSS(cssFiles);
          this.preloadedRoutes.add(route);
        }
      }
    });
  }
}

// Global CSS optimizer instance
export const cssOptimizer = new CSSOptimizer();
