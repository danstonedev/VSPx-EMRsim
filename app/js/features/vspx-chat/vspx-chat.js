/**
 * VSPx Chat Widget
 * Floating voice-chat panel embedding the VSPx patient simulator.
 *
 * States: fab | expanded | collapsed
 * Persists position/size in sessionStorage. iframe kept alive on collapse,
 * destroyed on close. Full-screen on mobile (<768px).
 */
import { el } from '../../ui/utils.js';

const VSPX_URL = 'https://gray-pond-069cfc21e.3.azurestaticapps.net/';
const STORAGE_KEY = 'vspx_chat_geometry';
const IFRAME_LOAD_TIMEOUT = 8000;
const MIN_W = 320;
const MIN_H = 400;
const DEFAULT_W = 400;
const DEFAULT_H = 560;
const EDGE_PAD = 48; // minimum visible px on each edge

// ─── State Machine ──────────────────────────────────────────────────────────

let state = 'fab'; // 'fab' | 'expanded' | 'collapsed'
let isAnimating = false;

// DOM refs
let root = null; // current mounted element
let iframeEl = null;
let panelBody = null;

// Geometry (tracked in px)
let geo = { x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H, positioned: false };

// ─── Helpers ────────────────────────────────────────────────────────────────

const isMobile = () => window.innerWidth <= 768;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function saveGeo() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(geo));
  } catch {
    /* quota */
  }
}
function loadGeo() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(geo, JSON.parse(raw));
  } catch {
    /* corrupt */
  }
}

function clampToViewport() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!geo.positioned) return;
  geo.x = Math.max(-geo.w + EDGE_PAD, Math.min(geo.x, vw - EDGE_PAD));
  geo.y = Math.max(-geo.h + EDGE_PAD, Math.min(geo.y, vh - EDGE_PAD));
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────

function headsetIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.classList.add('vspx-chat__icon');
  svg.innerHTML =
    '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/>' +
    '<path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z"/>' +
    '<path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z"/>';
  return svg;
}

function gripDotsIcon(cls) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.classList.add(cls || 'vspx-chat__grip');
  svg.setAttribute('fill', 'currentColor');
  svg.innerHTML =
    '<circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>' +
    '<circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>' +
    '<circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>';
  return svg;
}

function svgIcon(paths) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.innerHTML = paths;
  return svg;
}

const iconMinimize = () =>
  svgIcon(
    '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
  );
const iconClose = () =>
  svgIcon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>');
const iconExternal = () =>
  svgIcon(
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  );
const iconBack = () =>
  svgIcon('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>');
const iconResize = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.classList.add('vspx-chat__resize-icon');
  svg.setAttribute('fill', 'currentColor');
  svg.innerHTML =
    '<circle cx="8" cy="8" r="1.2"/><circle cx="4" cy="8" r="1.2"/><circle cx="8" cy="4" r="1.2"/>';
  return svg;
};

// ─── Mounting ───────────────────────────────────────────────────────────────

function unmount() {
  if (root) {
    root.remove();
    root = null;
  }
}

function mount(element) {
  unmount();
  root = element;
  document.body.appendChild(root);
}

// ─── iframe Lifecycle ───────────────────────────────────────────────────────

function createIframe() {
  if (iframeEl) return iframeEl;
  iframeEl = el('iframe', {
    class: 'vspx-chat__iframe',
    title: 'VSPx Patient Voice Chat',
    allow: 'microphone; camera',
    referrerpolicy: 'no-referrer',
  });
  return iframeEl;
}

function destroyIframe() {
  if (iframeEl) {
    iframeEl.remove();
    iframeEl = null;
  }
}

// ─── Build: FAB ─────────────────────────────────────────────────────────────

function buildFab() {
  const btn = el(
    'button',
    {
      class: 'vspx-chat vspx-chat--fab no-print',
      'aria-label': 'Open patient voice chat',
      'aria-expanded': 'false',
      onclick: () => transition('expanded'),
    },
    [headsetIcon()],
  );
  return btn;
}

// ─── Build: Panel ───────────────────────────────────────────────────────────

function buildPanel() {
  const mobile = isMobile();

  // Title bar buttons
  const externalBtn = el(
    'button',
    {
      class: 'vspx-chat__btn',
      'aria-label': 'Open in new tab',
      title: 'Open in new tab',
      onclick: (e) => {
        e.stopPropagation();
        window.open(VSPX_URL, '_blank', 'noopener');
      },
    },
    [iconExternal()],
  );

  const collapseBtn = el(
    'button',
    {
      class: 'vspx-chat__btn',
      'aria-label': mobile ? 'Close chat' : 'Minimize chat',
      title: mobile ? 'Close' : 'Minimize',
      onclick: (e) => {
        e.stopPropagation();
        transition(mobile ? 'fab' : 'collapsed');
      },
    },
    [mobile ? iconBack() : iconMinimize()],
  );

  const closeBtn = el(
    'button',
    {
      class: 'vspx-chat__btn vspx-chat__close-btn',
      'aria-label': 'Close chat',
      title: 'Close (Alt+Shift+C)',
      onclick: (e) => {
        e.stopPropagation();
        transition('fab');
      },
    },
    [iconClose()],
  );

  // Title bar
  const titlebar = el(
    'div',
    {
      class: 'vspx-chat__titlebar',
      'aria-roledescription': 'draggable region',
    },
    [
      mobile ? null : gripDotsIcon('vspx-chat__grip'),
      el('span', { class: 'vspx-chat__title' }, 'Patient Chat'),
      externalBtn,
      ...(mobile ? [] : [collapseBtn]),
      closeBtn,
    ].filter(Boolean),
  );

  // Body  (iframe + loading)
  const loadingEl = el('div', { class: 'vspx-chat__loading' }, [
    el('div', { class: 'vspx-chat__spinner' }),
    el('span', {}, 'Connecting to patient…'),
  ]);

  const errorEl = el('div', { class: 'vspx-chat__error', style: 'display:none' }, [
    el('span', { class: 'vspx-chat__error-msg' }, 'Unable to connect to VSPx'),
    el('div', { class: 'vspx-chat__error-actions' }, [
      el(
        'button',
        {
          class: 'vspx-chat__error-btn',
          onclick: () => retryIframe(),
        },
        'Retry',
      ),
      el(
        'a',
        {
          class: 'vspx-chat__error-btn',
          href: VSPX_URL,
          target: '_blank',
          rel: 'noopener',
        },
        'Open in new tab',
      ),
    ]),
  ]);

  panelBody = el('div', { class: 'vspx-chat__body' }, [loadingEl, errorEl]);

  const iframe = createIframe();
  panelBody.appendChild(iframe);

  // Set src and start load timer
  let loadTimer = null;
  const onLoaded = () => {
    clearTimeout(loadTimer);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
  };
  const onError = () => {
    clearTimeout(loadTimer);
    loadingEl.style.display = 'none';
    errorEl.style.display = '';
  };
  iframe.addEventListener('load', onLoaded, { once: true });
  iframe.addEventListener('error', onError, { once: true });
  iframe.src = VSPX_URL;
  loadTimer = setTimeout(() => {
    // If still loading after timeout, show error
    if (loadingEl.style.display !== 'none') onError();
  }, IFRAME_LOAD_TIMEOUT);

  // Resize handles (desktop only)
  const resizeBR = mobile
    ? null
    : el('div', { class: 'vspx-chat__resize vspx-chat__resize--br' }, [iconResize()]);
  const resizeBL = mobile
    ? null
    : el('div', { class: 'vspx-chat__resize vspx-chat__resize--bl' }, [iconResize()]);

  const panel = el(
    'div',
    {
      class: 'vspx-chat vspx-chat--panel no-print',
      role: 'complementary',
      'aria-label': 'Patient voice chat',
    },
    [titlebar, panelBody, resizeBR, resizeBL].filter(Boolean),
  );

  // Apply stored geometry
  if (!mobile && geo.positioned) {
    panel.classList.add('vspx-chat--positioned');
    panel.style.setProperty('--vspx-tx', geo.x + 'px');
    panel.style.setProperty('--vspx-ty', geo.y + 'px');
  }
  if (!mobile) {
    panel.style.setProperty('--vspx-w', geo.w + 'px');
    panel.style.setProperty('--vspx-h', geo.h + 'px');
  }

  // Wire drag (desktop only)
  if (!mobile) initDrag(panel, titlebar);
  // Wire resize (desktop only)
  if (!mobile && resizeBR) initResize(panel, resizeBR, 'br');
  if (!mobile && resizeBL) initResize(panel, resizeBL, 'bl');

  // Store retryIframe as closure
  panel._retryIframe = function () {
    loadingEl.style.display = '';
    errorEl.style.display = 'none';
    destroyIframe();
    const newIframe = createIframe();
    panelBody.appendChild(newIframe);
    newIframe.addEventListener('load', onLoaded, { once: true });
    newIframe.addEventListener('error', onError, { once: true });
    newIframe.src = VSPX_URL;
    loadTimer = setTimeout(() => {
      if (loadingEl.style.display !== 'none') onError();
    }, IFRAME_LOAD_TIMEOUT);
  };

  return panel;
}

let _currentRetry = null;
function retryIframe() {
  if (root && root._retryIframe) root._retryIframe();
}

// ─── Build: Pill ────────────────────────────────────────────────────────────

function buildPill() {
  const closeBtn = el(
    'button',
    {
      class: 'vspx-chat__btn',
      'aria-label': 'Close chat',
      title: 'Close',
      onclick: (e) => {
        e.stopPropagation();
        transition('fab');
      },
    },
    [iconClose()],
  );

  const pill = el(
    'div',
    {
      class: 'vspx-chat vspx-chat--pill no-print',
      role: 'complementary',
      'aria-label': 'Patient voice chat (minimized)',
      tabindex: '0',
      onclick: () => transition('expanded'),
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          transition('expanded');
        }
      },
    },
    [
      gripDotsIcon('vspx-chat__pill-grip'),
      el('span', { class: 'vspx-chat__pill-label' }, 'Patient Chat'),
      closeBtn,
    ],
  );

  return pill;
}

// ─── Transitions ────────────────────────────────────────────────────────────

function transition(to) {
  if (isAnimating || to === state) return;

  const from = state;
  isAnimating = true;

  // Leaving expanded → keep iframe alive or destroy
  if (from === 'expanded' && to === 'collapsed') {
    // Keep iframe alive: hide panel body off-screen-ish
    // We'll rebuild pill but keep the iframe element detached
    // Then on re-expand we re-attach it
    if (iframeEl) iframeEl.remove(); // detach from current panel (stays in memory)
  }
  if (from === 'expanded' && to === 'fab') {
    destroyIframe();
  }
  if (from === 'collapsed' && to === 'fab') {
    destroyIframe();
  }

  const prevRoot = root;

  // Build new element
  let newEl;
  if (to === 'fab') {
    newEl = buildFab();
  } else if (to === 'expanded') {
    // If we have a surviving iframe, re-attach it after build
    const survivingIframe = iframeEl;
    if (from === 'collapsed' && survivingIframe) {
      // Temporarily null so buildPanel creates fresh body
      iframeEl = null;
    }
    newEl = buildPanel();
    // Re-attach surviving iframe
    if (from === 'collapsed' && survivingIframe && panelBody) {
      // Remove the freshly created iframe and use the surviving one
      destroyIframe();
      iframeEl = survivingIframe;
      panelBody.appendChild(iframeEl);
      // Hide loading overlay since iframe is already loaded
      const loading = panelBody.querySelector('.vspx-chat__loading');
      if (loading) loading.style.display = 'none';
    }
  } else if (to === 'collapsed') {
    newEl = buildPill();
  }

  state = to;

  const skip = reducedMotion();

  // Animate out old
  if (prevRoot && !skip) {
    if (from === 'expanded') {
      prevRoot.classList.add('vspx-chat--exit');
      requestAnimationFrame(() => {
        prevRoot.classList.add('vspx-chat--exit-active');
        const cleanup = () => prevRoot.remove();
        prevRoot.addEventListener('transitionend', cleanup, { once: true });
        setTimeout(cleanup, 300);
      });
    } else {
      prevRoot.remove();
    }
  } else if (prevRoot) {
    prevRoot.remove();
  }

  // Mount & animate in new
  root = newEl;
  document.body.appendChild(newEl);

  if (!skip && to === 'expanded') {
    newEl.classList.add('vspx-chat--enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newEl.classList.remove('vspx-chat--enter');
        newEl.classList.add('vspx-chat--enter-active');
        const done = () => {
          newEl.classList.remove('vspx-chat--enter-active');
          isAnimating = false;
        };
        newEl.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 350);
      });
    });
  } else if (!skip && to === 'collapsed') {
    newEl.classList.add('vspx-chat--pill-enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newEl.classList.remove('vspx-chat--pill-enter');
        newEl.classList.add('vspx-chat--pill-enter-active');
        const done = () => {
          newEl.classList.remove('vspx-chat--pill-enter-active');
          isAnimating = false;
        };
        newEl.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 330);
      });
    });
  } else {
    isAnimating = false;
  }

  // Focus management
  requestAnimationFrame(() => {
    if (to === 'expanded') {
      const closeBtn = newEl.querySelector('.vspx-chat__close-btn');
      if (closeBtn) closeBtn.focus();
    } else if (to === 'fab' || to === 'collapsed') {
      if (newEl) newEl.focus();
    }
  });
}

// ─── Drag System ────────────────────────────────────────────────────────────

function initDrag(panel, handle) {
  let dragging = false;
  let startX, startY, origTx, origTy;

  handle.addEventListener('pointerdown', (e) => {
    // Ignore if clicking a button
    if (e.target.closest('button')) return;
    e.preventDefault();
    dragging = true;
    panel.classList.add('vspx-chat--dragging');
    handle.setPointerCapture(e.pointerId);

    // If not yet user-positioned, compute current position from CSS
    if (!geo.positioned) {
      const rect = panel.getBoundingClientRect();
      geo.x = rect.left;
      geo.y = rect.top;
      geo.positioned = true;
      panel.classList.add('vspx-chat--positioned');
    }

    startX = e.clientX;
    startY = e.clientY;
    origTx = geo.x;
    origTy = geo.y;
  });

  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    geo.x = origTx + dx;
    geo.y = origTy + dy;

    panel.style.setProperty('--vspx-tx', geo.x + 'px');
    panel.style.setProperty('--vspx-ty', geo.y + 'px');
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove('vspx-chat--dragging');
    clampToViewport();
    panel.style.setProperty('--vspx-tx', geo.x + 'px');
    panel.style.setProperty('--vspx-ty', geo.y + 'px');
    saveGeo();
  };

  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);
}

// ─── Resize System ──────────────────────────────────────────────────────────

function initResize(panel, handle, corner) {
  let resizing = false;
  let startX, startY, origW, origH, origGeoX;

  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizing = true;
    panel.classList.add('vspx-chat--resizing');
    handle.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startY = e.clientY;
    origW = geo.w;
    origH = geo.h;
    origGeoX = geo.x;

    // Ensure panel is in positioned mode
    if (!geo.positioned) {
      const rect = panel.getBoundingClientRect();
      geo.x = rect.left;
      geo.y = rect.top;
      geo.positioned = true;
      panel.classList.add('vspx-chat--positioned');
    }
  });

  handle.addEventListener('pointermove', (e) => {
    if (!resizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.85;

    if (corner === 'br') {
      geo.w = Math.max(MIN_W, Math.min(maxW, origW + dx));
      geo.h = Math.max(MIN_H, Math.min(maxH, origH + dy));
    } else if (corner === 'bl') {
      const newW = Math.max(MIN_W, Math.min(maxW, origW - dx));
      geo.h = Math.max(MIN_H, Math.min(maxH, origH + dy));
      // Adjust X to keep right edge stable
      geo.x = origGeoX + (origW - newW);
      geo.w = newW;
      panel.style.setProperty('--vspx-tx', geo.x + 'px');
    }

    panel.style.setProperty('--vspx-w', geo.w + 'px');
    panel.style.setProperty('--vspx-h', geo.h + 'px');
  });

  const endResize = () => {
    if (!resizing) return;
    resizing = false;
    panel.classList.remove('vspx-chat--resizing');
    saveGeo();
  };

  handle.addEventListener('pointerup', endResize);
  handle.addEventListener('pointercancel', endResize);
}

// ─── Keyboard Shortcut ──────────────────────────────────────────────────────

function onGlobalKeydown(e) {
  // Alt+Shift+C toggle
  if (e.altKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    if (state === 'fab') transition('expanded');
    else if (state === 'expanded') transition('collapsed');
    else if (state === 'collapsed') transition('expanded');
    return;
  }
  // Escape closes
  if (e.key === 'Escape' && state !== 'fab') {
    // Only if focus is within our widget
    if (root && root.contains(document.activeElement)) {
      e.preventDefault();
      if (state === 'expanded') transition(isMobile() ? 'fab' : 'collapsed');
      else transition('fab');
    }
  }
}

// ─── Window Resize Handler (debounced) ──────────────────────────────────────

let resizeTimer = null;
function onWindowResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (geo.positioned) {
      clampToViewport();
      if (root && state === 'expanded') {
        root.style.setProperty('--vspx-tx', geo.x + 'px');
        root.style.setProperty('--vspx-ty', geo.y + 'px');
      }
    }
  }, 150);
}

// ─── Init ───────────────────────────────────────────────────────────────────

function init() {
  loadGeo();
  mount(buildFab());
  document.addEventListener('keydown', onGlobalKeydown);
  window.addEventListener('resize', onWindowResize);
}

// Self-bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
