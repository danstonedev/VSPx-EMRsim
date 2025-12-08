import { storage } from './adapters/storageAdapter.js';
import { cssOptimizer, loadRouteCSS } from './css-optimizer.js';

// Track per-view cleanup returned by renderers to avoid stacked listeners/memory leaks
let currentCleanup = null;
let __firstRenderDone = false; // track first successful route paint
// Track which route modules have been dynamically loaded (avoid TDZ by defining early)
const __loadedRouteModules = new Set();
// Track which routes we've proactively prefetched (hover/focus/idle)
const __prefetchedRoutes = new Set();
let __prefetchHandlersInstalled = false;
let __renderSeq = 0; // guard against out-of-order async renders

// Idle scheduler helper (falls back to timeout)
const scheduleIdle = (cb, timeout = 1200) => {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(cb, { timeout });
  }
  return window.setTimeout(cb, Math.min(timeout, 1200));
};

function isDebugEnabled() {
  try {
    const h = String(window.location.hash || '');
    const q = h.split('?')[1] || '';
    return (
      /(?:^|&)debug=1(?:&|$)/.test(q) || /[?&]debug=1(?:&|$)/.test(window.location.search || '')
    );
  } catch {
    return false;
  }
}

async function loadCssForPathAndPreload(path, debug) {
  const routeType = getRouteType(path);
  try {
    if (debug && performance && performance.mark) performance.mark('router:css:start');
    await loadRouteCSS(routeType);
    if (debug && performance && performance.measure)
      performance.measure('router:css:load', 'router:css:start');

    // Only preload CSS for the most likely immediate next route
    const preloadMap = {
      home: [],
      student: ['editor'],
      instructor: ['editor'],
      editor: [],
    };
    const routesToPreload = preloadMap[routeType] || [];
    if (routesToPreload.length > 0) {
      setTimeout(() => {
        cssOptimizer.preloadRoutes(routesToPreload);
      }, 3000);
    }
  } catch (error) {
    console.error('Failed to load route CSS:', error);
  }
  return routeType;
}

function safeCleanup() {
  try {
    if (typeof currentCleanup === 'function') currentCleanup();
  } catch {}
}

function postRenderPerfAndPrefetch(routeType, path, debug) {
  if (debug && performance && performance.measure)
    performance.measure('router:render', 'router:render:start');
  try {
    scheduleIdle(() => idlePrefetchLikelyNext(routeType), 1500);
  } catch {}
  if (debug) {
    try {
      const measures = performance
        .getEntriesByType('measure')
        .filter((m) => m.name.startsWith('router:'));
      if (measures.length)
        console.warn(
          '[router][perf]',
          measures.map((m) => `${m.name}=${m.duration.toFixed(1)}ms`).join(' '),
        );
    } catch {}
  }
}

// --- Accessibility & UX helpers ---

function ensureAnnouncer() {
  let el = document.getElementById('route-announcer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'route-announcer';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    // Visually hidden but available to screen readers
    el.style.position = 'absolute';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.padding = '0';
    el.style.margin = '-1px';
    el.style.overflow = 'hidden';
    el.style.clip = 'rect(0 0 0 0)';
    el.style.whiteSpace = 'nowrap';
    el.style.border = '0';
    document.body.appendChild(el);
  }
  return el;
}

function updateDocumentTitle(title) {
  try {
    const base = 'UND-PT EMR-Sim';
    document.title = title ? `${base} — ${title}` : base;
  } catch {}
}

function derivePageTitle(path, wrapper) {
  try {
    const h1 = wrapper && wrapper.querySelector ? wrapper.querySelector('h1') : null;
    if (h1 && h1.textContent) return h1.textContent.trim();
  } catch {}
  const type = getRouteType(path);
  const map = {
    home: 'Home',
    student: 'Student Cases',
    instructor: 'Faculty Cases',
    editor: 'Case Editor',
    default: 'Page',
  };
  if (path && path.startsWith('#/preview')) return 'Preview';
  if (path && path.startsWith('#/404')) return 'Not Found';
  return map[type] || 'Page';
}

function applyPostRenderA11y(wrapper, path) {
  try {
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  } catch {}
  try {
    // Announce new page and update title
    const title = derivePageTitle(path, wrapper);
    updateDocumentTitle(title);
    const announcer = ensureAnnouncer();
    announcer.textContent = `${title} loaded`;
  } catch {}
  try {
    // Focus main heading if present; otherwise focus wrapper for keyboard users
    const h1 = wrapper && wrapper.querySelector ? wrapper.querySelector('h1') : null;
    if (h1) {
      if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    } else if (wrapper) {
      if (!wrapper.hasAttribute('tabindex')) wrapper.setAttribute('tabindex', '-1');
      wrapper.focus({ preventScroll: true });
    }
  } catch {}
}

/**
 * Determines the route type for CSS loading based on path
 * @param {string} path - The current route path
 * @returns {string} Route type for CSS optimization
 */
function getRouteType(path) {
  if (path.includes('/student/')) return 'student';
  if (path.includes('/instructor/')) return 'instructor';
  if (path.includes('/editor/') || path.includes('/case/')) return 'editor';
  if (path === '#/' || path.includes('/home')) return 'home';
  return 'default';
}

// Basic route transition utility
function applyRouteTransition(appEl, mode = 'fade') {
  // Skip animations if user prefers reduced motion; clear and render immediately
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce)
    return {
      before: (cb) => {
        try {
          appEl.replaceChildren();
        } catch {}
        cb();
      },
      after: () => {},
    };

  const enterClassBase = mode === 'slide' ? 'route-slide' : 'route-fade';

  // No exit transitions: remove previous content immediately
  const before = (prepareNew) => {
    const current = appEl.firstElementChild;
    if (current && current.parentElement === appEl) {
      try {
        appEl.removeChild(current);
      } catch {}
    }
    prepareNew();
  };

  // Keep enter transition for the new view (optional visual polish)
  const after = (newEl) => {
    if (!newEl) return;
    newEl.classList.add(`${enterClassBase}-enter`);
    requestAnimationFrame(() => {
      newEl.classList.add(`${enterClassBase}-enter-active`);
      newEl.addEventListener(
        'transitionend',
        () => {
          newEl.classList.remove(`${enterClassBase}-enter`, `${enterClassBase}-enter-active`);
        },
        { once: true },
      );
    });
  };

  return { before, after };
}
// Router with proper initialization order and parameter handling

const routes = {};

export function route(path, render) {
  routes[path] = render;
}

export { routes };

export function navigate(hash) {
  window.location.hash = hash;
}

// Update navigation active states
function updateNavigation(currentPath) {
  const navLinks = document.querySelectorAll('.topnav a');
  navLinks.forEach((link) => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
    const href = link.getAttribute('href');
    if (
      href === currentPath ||
      (currentPath.startsWith('#/student') && href === '#/student/cases') ||
      (currentPath.startsWith('#/instructor') && href === '#/instructor/cases') ||
      (currentPath === '#/' && href === '#/')
    ) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

export function startRouter() {
  const app = document.getElementById('app');

  // Install global predictive prefetch handlers once
  if (!__prefetchHandlersInstalled) {
    __prefetchHandlersInstalled = true;
    setupPredictivePrefetch();
  }

  async function render() {
    const seq = ++__renderSeq;
    const { hash, path, query } = getNormalizedHash();
    const debug = isDebugEnabled();
    if (debug && performance && performance.mark) performance.mark('router:render:start');

    // Ensure the route module for this path is loaded and registered before resolving
    await ensureRouteModuleLoaded(path);

    const { renderer, params } = resolveRendererAndParams(path);
    if (!renderer) return;

    // Load route-specific CSS and schedule preload
    const routeType = await loadCssForPathAndPreload(path, debug);

    // Teardown previous view before rendering the next one
    safeCleanup();

    persistLastRoute(hash, path);
    updateNavigation(hash);
    setBodyRouteKey(path);

    const { before, after } = applyRouteTransition(app, 'fade');
    const newWrapper = buildRouteWrapper(app, before);
    const maybeCleanup = await renderer(newWrapper, new URLSearchParams(query || ''), params);
    currentCleanup = typeof maybeCleanup === 'function' ? maybeCleanup : null;
    // Guard against out-of-order renders
    if (seq !== __renderSeq) return;
    after(newWrapper);
    applyPostRenderA11y(newWrapper, path);
    postRenderPerfAndPrefetch(routeType, path, debug);
    if (!__firstRenderDone) {
      __firstRenderDone = true;
      window.dispatchEvent(new Event('app-ready'));
    }
  }
  window.addEventListener('hashchange', render);
  render();
}

function getNormalizedHash() {
  let hash = (window.location.hash || '#/').replace(/\/$/, '');
  if (hash === '#') hash = '#/';
  const [path, query] = hash.split('?');
  return { hash, path, query };
}

function resolveRendererAndParams(path) {
  let renderer = routes[path];
  let params = {};
  if (!renderer) {
    for (const [routePath, routeRenderer] of Object.entries(routes)) {
      const match = matchRoute(routePath, path);
      if (match) {
        renderer = routeRenderer;
        params = match;
        break;
      }
    }
  }
  if (!renderer) renderer = routes['#/404'];
  return { renderer, params };
}

function persistLastRoute(hash, path) {
  try {
    if (path && path !== '#/' && path !== '#/404') storage.setItem('pt_emr_last_route', hash);
  } catch {}
}

function setBodyRouteKey(path) {
  try {
    const routeKey = path && path !== '#/' ? path.slice(2).replace(/\//g, '-') : 'home';
    document.body.setAttribute('data-route', routeKey);
  } catch {}
}

function buildRouteWrapper(app, before) {
  let newWrapper = null;
  before(() => {
    newWrapper = document.createElement('div');
    newWrapper.className = 'route-transition-container';
    app.appendChild(newWrapper);
  });
  return newWrapper;
}

// Disable CSS transitions during window resize/rotation to avoid janky animations
let resizeTimer = null;
let isResizing = false;

function setResizingState(on) {
  const root = document.documentElement;
  if (on && !isResizing) {
    isResizing = true;
    root.classList.add('is-resizing');
    // Temporarily disable will-change on sidebar for better performance during resize
    const sidebar = document.querySelector('.chart-navigation');
    if (sidebar) sidebar.style.willChange = 'auto';
  } else if (!on && isResizing) {
    isResizing = false;
    root.classList.remove('is-resizing');
    // Re-enable will-change after resize completes
    const sidebar = document.querySelector('.chart-navigation');
    if (sidebar && window.matchMedia('(max-width: 900px)').matches) {
      sidebar.style.willChange = 'transform';
    }
  }
}

function handleResize() {
  setResizingState(true);
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => setResizingState(false), 200); // Increased from 180ms
}
window.addEventListener('resize', handleResize, { passive: true });
window.addEventListener('orientationchange', handleResize, { passive: true });

// Helper function to match parameterized routes
function matchRoute(routePath, actualPath) {
  const routeSegments = routePath.split('/');
  const pathSegments = actualPath.split('/');

  if (routeSegments.length !== pathSegments.length) return null;

  const params = {};
  for (let i = 0; i < routeSegments.length; i++) {
    if (routeSegments[i].startsWith(':')) {
      // This is a parameter
      const paramName = routeSegments[i].slice(1);
      params[paramName] = pathSegments[i];
    } else if (routeSegments[i] !== pathSegments[i]) {
      // Segments don't match
      return null;
    }
  }

  return params;
}

// Initialization function that loads all modules and starts the router
async function initializeApp() {
  // Initialize user menu (auth UI)
  try {
    const { initUserMenu } = await import('../ui/UserMenu.js');
    initUserMenu();
  } catch (e) {
    console.warn('Failed to initialize user menu:', e);
  }

  // Start the router; route modules will be loaded on demand
  startRouter();
}

// Initialize the app when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// --- Lazy route module loader ---

async function ensureRouteModuleLoaded(path) {
  try {
    const p = path || '#/';
    // Normalize without query (already normalized earlier)
    if (__loadedRouteModules.has(p)) return;

    const matchers = [
      {
        test: (t) => t.startsWith('#/styleguide'),
        key: 'styleguide',
        load: () => import('../views/styleguide.js'),
      },
      {
        test: (t) => t === '#/' || t.startsWith('#/home'),
        key: 'home',
        load: () => import('../views/home.js'),
      },
      {
        test: (t) => t.startsWith('#/student/editor'),
        key: 'student-editor',
        load: () => import('../views/case_editor.js'),
      },
      {
        test: (t) => t.startsWith('#/instructor/editor'),
        key: 'instructor-editor',
        load: () => import('../views/case_editor.js'),
      },
      {
        test: (t) => t.startsWith('#/student/cases'),
        key: 'student-cases',
        load: () => import('../views/student/cases.js'),
      },
      {
        test: (t) => t.startsWith('#/student/drafts'),
        key: 'student-drafts',
        load: () => import('../views/student/drafts.js'),
      },
      {
        test: (t) => t.startsWith('#/instructor/cases'),
        key: 'instructor-cases',
        load: () => import('../views/instructor/cases.js'),
      },
      {
        test: (t) => t.startsWith('#/admin/users'),
        key: 'admin-users',
        load: () => import('../views/admin/users.js'),
      },
      {
        test: (t) => t.startsWith('#/preview'),
        key: 'preview',
        load: () => import('../views/preview.js'),
      },
      {
        test: (t) => t.startsWith('#/404'),
        key: 'notfound',
        load: () => import('../views/notfound.js'),
      },
    ];
    const found = matchers.find((m) => m.test(p)) || {
      key: 'fallback-notfound',
      load: () => import('../views/notfound.js'),
    };
    if (__loadedRouteModules.has(found.key)) return;
    await found.load();
    __loadedRouteModules.add(found.key);
    __loadedRouteModules.add(p);
  } catch (e) {
    console.warn('Failed to load route module for', path, e);
  }
}

// --- Predictive Prefetch Helpers ---

function setupPredictivePrefetch() {
  const handler = (ev) => {
    try {
      const a = ev.target && (ev.target.closest ? ev.target.closest('a[href^="#/"]') : null);
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || typeof href !== 'string') return;
      // Strip any query/hash after the route path
      const path = href.split('?')[0];
      // Skip if current route
      const currentPath = getNormalizedHash().path;
      if (path === currentPath) return;
      prefetchRoute(path);
    } catch {}
  };
  // Prefetch when the user shows intent (hover) or navigates with keyboard (focus)
  document.addEventListener('mouseover', handler, { passive: true });
  document.addEventListener('focusin', handler, { passive: true });
}

function prefetchRoute(path) {
  try {
    if (!path) return;
    if (__loadedRouteModules.has(path) || __prefetchedRoutes.has(path)) return;
    __prefetchedRoutes.add(path);
    const routeType = getRouteType(path);
    // Prefetch CSS opportunistically
    if (routeType && routeType !== 'default') {
      scheduleIdle(() => cssOptimizer.preloadRoutes([routeType]), 1000);
    }
    // Prefetch module at idle
    scheduleIdle(() => ensureRouteModuleLoaded(path), 1200);
  } catch {}
}

function idlePrefetchLikelyNext(routeType) {
  try {
    // Predict likely next route path for module prefetch
    const map = {
      home: [],
      student: ['#/student/editor'],
      instructor: ['#/instructor/editor'],
      editor: [],
      default: [],
    };
    const nextPaths = map[routeType] || [];
    nextPaths.forEach((p) => prefetchRoute(p));
  } catch {}
}
