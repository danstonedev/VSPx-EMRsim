// create.js - lightweight creation of the chart navigation sidebar
// Thin wrapper that currently delegates to the monolith implementation.
// This allows us to lazily load only the creation code and progressively
// inline smaller helpers here without pulling the entire monolith eagerly.

/**
 * Creates the chart navigation sidebar
 * @param {Object} config - Navigation configuration
 * @returns {HTMLElement} Sidebar element
 */
export function createChartNavigation(config) {
  // Defer-load the monolith synchronously via dynamic import promise.
  // Note: We intentionally avoid top-level imports to keep this file light.
  // The dynamic import is awaited inline to keep the same sync API for callers.
  let sidebar;
  // Using then/catch for compatibility without making this function async.
  // Callers expect a return value immediately (HTMLElement), so we must block
  // on the import resolution; to preserve behavior, we perform a synchronous
  // XHR-like trick is not acceptable. Instead, we require callers to treat
  // this as an immediate creation. Therefore, we load synchronously by
  // leveraging the fact that modules are already cached when called from
  // progress flow. As a safe fallback, we throw if not available.
  const mod = window.__navMonolithCache;
  if (mod && typeof mod.createChartNavigation === 'function') {
    sidebar = mod.createChartNavigation(config);
  } else {
    // Forcefully require the module via dynamic import and block using deopt
    // In practice, Vite/Rollup will pre-resolve this chunk and the promise
    // will be fulfilled immediately after microtask; we can’t synchronously
    // return prior to resolution. To keep semantics, we fallback to a minimal
    // placeholder and upgrade in next microtask.
    const placeholder = document.createElement('div');
    placeholder.className = 'chart-navigation';
    // Critical inline positioning to prevent CSS @import race condition
    placeholder.style.cssText =
      'position:fixed;left:0;top:var(--topbar-h,72px);min-height:40px;opacity:0.001;';
    // Hydrate after import resolves
    import('./ChartNavigation.js').then((m) => {
      window.__navMonolithCache = m;
      try {
        const real = m.createChartNavigation(config);
        if (real && real !== placeholder && placeholder.isConnected) {
          placeholder.replaceWith(real);
        }
      } catch (e) {
        console.error('Failed to create chart navigation from monolith:', e);
      }
    });
    return placeholder;
  }
  return sidebar;
}
