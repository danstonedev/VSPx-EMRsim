/**
 * VSPx Chat Widget
 * Floating voice-chat panel embedding the VSPx patient simulator.
 *
 * States: idle | expanded
 * Trigger button lives in #patient-header-actions (top-right of patient info bar).
 * Active state highlights the full button while call session is alive.
 * Panel is draggable/resizable. iframe kept alive on minimize.
 */
import { el } from '../../ui/utils.js';
import { getCase, updateCase } from '../../core/store.js';

const DEFAULT_VSPX_URL = 'https://gray-pond-069cfc21e.3.azurestaticapps.net/';
const STORAGE_KEY = 'vspx_chat_geometry';
const IFRAME_LOAD_TIMEOUT = 8000;
const MIN_W = 320;
const MIN_H = 400;
const DEFAULT_W = 400;
const DEFAULT_H = 560;
const EDGE_PAD = 48;
const ACCESS_CACHE_PREFIX = 'vspx_access_ok_';

// ─── State ──────────────────────────────────────────────────────────────────

let state = 'idle'; // 'idle' | 'expanded'
let isAnimating = false;
let hasActiveConversation = false;
let root = null;
let iframeEl = null;
let panelBody = null;
let headerBtn = null;
let geo = { x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H, positioned: false };
let currentCaseId = null;
let canUseVspx = false;
let isFacultyCase = false;
let isFacultyEditorView = false;
let eligibilityCheckId = 0;
let currentVspxUrl = DEFAULT_VSPX_URL;

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

function ensurePositioned(panel) {
  if (geo.positioned) return;
  const rect = panel.getBoundingClientRect();
  geo.x = rect.left;
  geo.y = rect.top;
  geo.positioned = true;
  panel.classList.add('vspx-chat--positioned');
}

function getCurrentCaseIdFromHash() {
  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return null;
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  return params.get('case') || params.get('c') || null;
}

function isInstructorEditorRoute() {
  return (window.location.hash || '').startsWith('#/instructor/editor');
}

function isFacultyAuthoredCase(caseWrapper) {
  if (!caseWrapper || typeof caseWrapper !== 'object') return false;
  if (caseWrapper.caseObj?.meta?.vspxFacultyCase === true) return true;
  const facultyAuthored =
    caseWrapper.isFacultyCase === true ||
    Boolean(caseWrapper.createdBy || caseWrapper.createdByName);
  return facultyAuthored;
}

function isVspxEnabledForCase(caseWrapper) {
  return caseWrapper?.caseObj?.meta?.vspxEnabled === true;
}

function normalizeUrl(url) {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
}

function resolveVspxUrl(caseWrapper) {
  const configured = caseWrapper?.caseObj?.meta?.vspxUrl;
  const raw = typeof configured === 'string' ? configured.trim() : '';
  return normalizeUrl(raw) || DEFAULT_VSPX_URL;
}

function getAccessCacheKey(caseId) {
  return ACCESS_CACHE_PREFIX + caseId;
}

function hasVerifiedAccessCode(caseId) {
  if (!caseId) return false;
  try {
    return sessionStorage.getItem(getAccessCacheKey(caseId)) === '1';
  } catch {
    return false;
  }
}

function setVerifiedAccessCode(caseId, isVerified) {
  if (!caseId) return;
  try {
    if (isVerified) {
      sessionStorage.setItem(getAccessCacheKey(caseId), '1');
    } else {
      sessionStorage.removeItem(getAccessCacheKey(caseId));
    }
  } catch {
    /* storage unavailable */
  }
}

async function verifyFacultyAccessCode(caseId) {
  // Pre-flight: check if the verification API is available
  let apiAvailable = false;
  try {
    const ping = await fetch('/api/verify-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '' }),
    });
    const pingData = await ping.json().catch(() => null);
    if (!pingData) {
      // Response wasn't JSON — API proxy returned HTML error page
    } else if (ping.ok && pingData.valid && pingData.role === 'faculty') {
      // No codes configured — everyone is faculty
      setVerifiedAccessCode(caseId, true);
      return true;
    } else {
      // Got a proper JSON error (400/401) — API is live and enforcing codes
      apiAvailable = true;
    }
  } catch {
    // Network error — API unreachable
  }

  if (!apiAvailable) {
    // Local dev or API offline — skip access gate
    setVerifiedAccessCode(caseId, true);
    return true;
  }

  // API is live and requires a code — prompt the user
  const code = window.prompt('Enter faculty access code to open VSPx call tools:');
  if (!code) return false;

  try {
    const res = await fetch('/api/verify-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.valid && data.role === 'faculty') {
      setVerifiedAccessCode(caseId, true);
      return true;
    }
  } catch {
    setVerifiedAccessCode(caseId, true);
    return true;
  }

  alert('Invalid faculty access code.');
  return false;
}

async function refreshEligibility() {
  const requestId = ++eligibilityCheckId;
  isFacultyEditorView = isInstructorEditorRoute();
  const caseId = getCurrentCaseIdFromHash();
  currentCaseId = caseId;

  if (!caseId) {
    canUseVspx = false;
    isFacultyCase = false;
    currentVspxUrl = DEFAULT_VSPX_URL;
    return;
  }

  let faculty = false;
  let enabled = false;
  let caseWrapper = null;
  try {
    caseWrapper = await getCase(caseId);
    faculty = isFacultyAuthoredCase(caseWrapper);
    enabled = isVspxEnabledForCase(caseWrapper);
    currentVspxUrl = resolveVspxUrl(caseWrapper);
  } catch {
    faculty = false;
    enabled = false;
    currentVspxUrl = DEFAULT_VSPX_URL;
  }

  if (requestId !== eligibilityCheckId) return;
  isFacultyCase = faculty;
  canUseVspx = faculty && enabled;

  if (!canUseVspx) {
    setVerifiedAccessCode(caseId, false);
  }
}

function promptVspxSettings(caseWrapper) {
  const currentUrl = resolveVspxUrl(caseWrapper);
  const urlInput = window.prompt(
    `Enter the VSPx patient URL for this case:\n(current: ${currentUrl})`,
    currentUrl,
  );
  if (urlInput === null) return null;

  const enable = window.confirm(
    'Enable VSPx call portal for this case?\nOK = Enable, Cancel = Disable',
  );
  let nextUrl = String(urlInput || '').trim();
  if (nextUrl) nextUrl = normalizeUrl(nextUrl);

  const nextCaseObj = { ...(caseWrapper.caseObj || {}) };
  nextCaseObj.meta = { ...(nextCaseObj.meta || {}) };
  nextCaseObj.meta.vspxFacultyCase = true;
  nextCaseObj.meta.vspxEnabled = enable;
  nextCaseObj.meta.vspxUrl = nextUrl;
  return { nextCaseObj, enable };
}

async function configureVspxForCase() {
  if (!currentCaseId) return;

  let caseWrapper;
  try {
    caseWrapper = await getCase(currentCaseId);
  } catch {
    alert('Unable to load this case for VSPx setup.');
    return;
  }

  if (!isFacultyEditorView) {
    alert('VSPx setup is only available on faculty-created cases.');
    return;
  }

  const settings = promptVspxSettings(caseWrapper);
  if (!settings) return;

  try {
    await updateCase(currentCaseId, settings.nextCaseObj);
  } catch (err) {
    console.error('[VSPx] Failed to save VSPx settings:', err);
    alert('Failed to save VSPx settings. Please try again.');
    return;
  }

  alert(`VSPx ${settings.enable ? 'enabled' : 'disabled'} for this case.`);
  await injectTrigger();
  if (!canUseVspx && state === 'expanded') {
    closePanel();
  }
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────

function svgNS(viewBox, cls, html) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', viewBox);
  if (cls) svg.classList.add(cls);
  svg.innerHTML = html;
  return svg;
}

const micIcon = () =>
  svgNS(
    '0 0 24 24',
    'vspx-chat__icon',
    '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>' +
      '<path d="M19 10v2a7 7 0 0 1-14 0v-2"/>' +
      '<line x1="12" y1="19" x2="12" y2="23"/>' +
      '<line x1="8" y1="23" x2="16" y2="23"/>',
  );

function gripDotsIcon(cls) {
  const svg = svgNS(
    '0 0 16 16',
    cls,
    '<circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>' +
      '<circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>' +
      '<circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>',
  );
  svg.setAttribute('fill', 'currentColor');
  return svg;
}

const icon24 = (paths) => svgNS('0 0 24 24', null, paths);
const iconMinimize = () =>
  icon24(
    '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
  );
const iconClose = () =>
  icon24('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>');
const iconExternal = () =>
  icon24(
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  );
const iconBack = () =>
  icon24('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>');

function iconResize() {
  const svg = svgNS(
    '0 0 10 10',
    'vspx-chat__resize-icon',
    '<circle cx="8" cy="8" r="1.2"/><circle cx="4" cy="8" r="1.2"/><circle cx="8" cy="4" r="1.2"/>',
  );
  svg.setAttribute('fill', 'currentColor');
  return svg;
}

// ─── Header Trigger ─────────────────────────────────────────────────────────

function buildHeaderButton() {
  const text = hasActiveConversation ? 'In Call' : 'Call Patient';
  const label = el('span', { class: 'vspx-chat-trigger__label' }, text);
  const classes =
    'vspx-chat-trigger no-print' + (hasActiveConversation ? ' vspx-chat-trigger--active' : '');
  const btn = el(
    'button',
    {
      class: classes,
      'aria-label': 'Call patient voice chat',
      title: 'Call Patient (Alt+Shift+C)',
      onclick: () => {
        void openPanel();
      },
    },
    [micIcon(), label],
  );
  return btn;
}

function buildConfigButton() {
  return el(
    'button',
    {
      class: 'vspx-chat-config-btn no-print',
      type: 'button',
      'aria-label': 'Configure VSPx for this case',
      title: 'Configure VSPx for this case',
      onclick: () => {
        void configureVspxForCase();
      },
    },
    'VSPx Setup',
  );
}

function updateHeaderState() {
  if (!headerBtn) return;
  const label = headerBtn.querySelector('.vspx-chat-trigger__label');
  if (hasActiveConversation) {
    headerBtn.classList.add('vspx-chat-trigger--active');
    if (label) label.textContent = 'In Call';
  } else {
    headerBtn.classList.remove('vspx-chat-trigger--active');
    if (label) label.textContent = 'Call Patient';
  }
}

function removeHeaderButton(host, selector) {
  const button = host?.querySelector(selector);
  if (button) button.remove();
}

function clearHostButtons(host, header) {
  removeHeaderButton(host, '.vspx-chat-trigger');
  if (header && host !== header) {
    removeHeaderButton(header, '.vspx-chat-trigger');
  }
}

function ensureConfigButton(host) {
  if (!host.querySelector('.vspx-chat-config-btn')) {
    host.appendChild(buildConfigButton());
  }
}

function ensureCallButton(host) {
  if (host.querySelector('.vspx-chat-trigger')) return;
  headerBtn = buildHeaderButton();
  host.appendChild(headerBtn);
}

async function injectTrigger() {
  await refreshEligibility();
  const header = document.getElementById('patient-sticky-header');
  const actions = document.getElementById('patient-header-actions');
  const host = actions || header;
  if (!host) {
    headerBtn = null;
    return;
  }

  if (!isFacultyEditorView) {
    removeHeaderButton(host, '.vspx-chat-config-btn');
    if (header && host !== header) {
      removeHeaderButton(header, '.vspx-chat-config-btn');
    }
    if (!canUseVspx) {
      clearHostButtons(host, header);
      headerBtn = null;
      return;
    }

    ensureCallButton(host);
    return;
  }

  ensureConfigButton(host);

  if (!canUseVspx) {
    clearHostButtons(host, header);
    headerBtn = null;
    if (!isFacultyCase) return;
  }

  if (!canUseVspx) return;
  ensureCallButton(host);
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
  if (!iframeEl) return;
  iframeEl.remove();
  iframeEl = null;
}

// ─── Build: Panel ───────────────────────────────────────────────────────────

function buildTitlebar(mobile) {
  const externalBtn = el(
    'button',
    {
      class: 'vspx-chat__btn',
      'aria-label': 'Open in new tab',
      title: 'Open in new tab',
      onclick: (e) => {
        e.stopPropagation();
        window.open(currentVspxUrl, '_blank', 'noopener');
      },
    },
    [iconExternal()],
  );

  const minimizeBtn = el(
    'button',
    {
      class: 'vspx-chat__btn',
      'aria-label': mobile ? 'Close chat' : 'Minimize chat',
      title: mobile ? 'Close' : 'Minimize',
      onclick: (e) => {
        e.stopPropagation();
        if (mobile) closePanel();
        else minimizePanel();
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
        closePanel();
      },
    },
    [iconClose()],
  );

  const children = [
    mobile ? null : gripDotsIcon('vspx-chat__grip'),
    el('span', { class: 'vspx-chat__title' }, 'Patient Chat'),
    externalBtn,
    minimizeBtn,
    closeBtn,
  ].filter(Boolean);

  return el(
    'div',
    { class: 'vspx-chat__titlebar', 'aria-roledescription': 'draggable region' },
    children,
  );
}

function wireIframeLoad(iframe, onLoaded, onError) {
  iframe.addEventListener('load', onLoaded, { once: true });
  iframe.addEventListener('error', onError, { once: true });
  console.warn('[VSPx] Loading iframe URL:', currentVspxUrl);
  iframe.src = currentVspxUrl;

  const timer = setTimeout(() => {
    const loading = panelBody?.querySelector('.vspx-chat__loading');
    if (loading && loading.style.display !== 'none') onError();
  }, IFRAME_LOAD_TIMEOUT);

  iframe.addEventListener('load', () => clearTimeout(timer), { once: true });
  iframe.addEventListener('error', () => clearTimeout(timer), { once: true });
}

function buildIframeBody() {
  const loadingEl = el('div', { class: 'vspx-chat__loading' }, [
    el('div', { class: 'vspx-chat__spinner' }),
    el('span', {}, 'Connecting to patient…'),
  ]);

  const errorEl = el('div', { class: 'vspx-chat__error', style: 'display:none' }, [
    el('span', { class: 'vspx-chat__error-msg' }, 'Unable to connect to VSPx'),
    el('div', { class: 'vspx-chat__error-actions' }, [
      el('button', { class: 'vspx-chat__error-btn', onclick: () => retryIframe() }, 'Retry'),
      el(
        'a',
        { class: 'vspx-chat__error-btn', href: currentVspxUrl, target: '_blank', rel: 'noopener' },
        'Open in new tab',
      ),
    ]),
  ]);

  panelBody = el('div', { class: 'vspx-chat__body' }, [loadingEl, errorEl]);
  const iframe = createIframe();
  panelBody.appendChild(iframe);

  const onLoaded = () => {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    hasActiveConversation = true;
    updateHeaderState();
  };
  const onError = () => {
    loadingEl.style.display = 'none';
    errorEl.style.display = '';
  };
  wireIframeLoad(iframe, onLoaded, onError);

  return { body: panelBody, loadingEl, errorEl, onLoaded, onError };
}

function applyPanelGeometry(panel, mobile) {
  if (!mobile && geo.positioned) {
    panel.classList.add('vspx-chat--positioned');
    panel.style.setProperty('--vspx-tx', geo.x + 'px');
    panel.style.setProperty('--vspx-ty', geo.y + 'px');
  }
  if (!mobile) {
    panel.style.setProperty('--vspx-w', geo.w + 'px');
    panel.style.setProperty('--vspx-h', geo.h + 'px');
  }
}

function wirePanelInteractions(panel, titlebar, resizeBR, resizeBL, mobile) {
  if (mobile) return;
  initDrag(panel, titlebar);
  if (resizeBR) initResize(panel, resizeBR, 'br');
  if (resizeBL) initResize(panel, resizeBL, 'bl');
}

function buildPanel() {
  const mobile = isMobile();
  const titlebar = buildTitlebar(mobile);
  const { body, loadingEl, errorEl, onLoaded, onError } = buildIframeBody();

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
    [titlebar, body, resizeBR, resizeBL].filter(Boolean),
  );

  applyPanelGeometry(panel, mobile);
  wirePanelInteractions(panel, titlebar, resizeBR, resizeBL, mobile);

  panel._retryIframe = () => {
    loadingEl.style.display = '';
    errorEl.style.display = 'none';
    destroyIframe();
    const newIframe = createIframe();
    body.appendChild(newIframe);
    wireIframeLoad(newIframe, onLoaded, onError);
  };

  return panel;
}

function retryIframe() {
  if (root && root._retryIframe) root._retryIframe();
}

// ─── Panel Actions ──────────────────────────────────────────────────────────

function animateEntry(panel) {
  if (reducedMotion()) {
    isAnimating = false;
    return;
  }
  panel.classList.add('vspx-chat--enter');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.classList.remove('vspx-chat--enter');
      panel.classList.add('vspx-chat--enter-active');
      const done = () => {
        panel.classList.remove('vspx-chat--enter-active');
        isAnimating = false;
      };
      panel.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 350);
    });
  });
}

function animateExit(element, callback) {
  if (reducedMotion()) {
    element.remove();
    callback();
    return;
  }
  element.classList.add('vspx-chat--exit');
  requestAnimationFrame(() => {
    element.classList.add('vspx-chat--exit-active');
    const cleanup = () => {
      element.remove();
      callback();
    };
    element.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 300);
  });
}

async function ensureVspxOpenAccess() {
  if (!canUseVspx) {
    alert('VSPx call tools are only available for faculty-created cases.');
    return false;
  }

  if (hasActiveConversation || hasVerifiedAccessCode(currentCaseId)) {
    return true;
  }

  const verified = await verifyFacultyAccessCode(currentCaseId);
  return verified;
}

async function openPanel() {
  if (isAnimating || state === 'expanded') return;
  const hasAccess = await ensureVspxOpenAccess();
  if (!hasAccess) return;

  isAnimating = true;
  state = 'expanded';

  // Preserve surviving iframe from a previous minimize
  const surviving = hasActiveConversation && iframeEl;
  const savedIframe = surviving ? iframeEl : null;
  if (surviving) iframeEl = null;

  const panel = buildPanel();

  // Reattach surviving iframe instead of the fresh one
  if (savedIframe && panelBody) {
    destroyIframe();
    iframeEl = savedIframe;
    panelBody.appendChild(iframeEl);
    const loading = panelBody.querySelector('.vspx-chat__loading');
    if (loading) loading.style.display = 'none';
  }

  root = panel;
  document.body.appendChild(panel);
  animateEntry(panel);

  requestAnimationFrame(() => {
    const btn = panel.querySelector('.vspx-chat__close-btn');
    if (btn) btn.focus();
  });
}

function minimizePanel() {
  if (isAnimating || state !== 'expanded') return;
  isAnimating = true;

  // Detach iframe but keep reference alive (preserves WebRTC)
  if (iframeEl) iframeEl.remove();
  hasActiveConversation = Boolean(iframeEl);

  const prev = root;
  root = null;
  state = 'idle';
  updateHeaderState();

  animateExit(prev, () => {
    isAnimating = false;
  });
  requestAnimationFrame(() => {
    if (headerBtn) headerBtn.focus();
  });
}

function closePanel() {
  if (isAnimating || state !== 'expanded') return;
  isAnimating = true;

  destroyIframe();
  hasActiveConversation = false;

  const prev = root;
  root = null;
  state = 'idle';
  updateHeaderState();

  animateExit(prev, () => {
    isAnimating = false;
  });
  requestAnimationFrame(() => {
    if (headerBtn) headerBtn.focus();
  });
}

// ─── Drag System ────────────────────────────────────────────────────────────

function initDrag(panel, handle) {
  let dragging = false;
  let startX, startY, origTx, origTy;

  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    dragging = true;
    panel.classList.add('vspx-chat--dragging');
    handle.setPointerCapture(e.pointerId);

    ensurePositioned(panel);
    startX = e.clientX;
    startY = e.clientY;
    origTx = geo.x;
    origTy = geo.y;
  });

  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    geo.x = origTx + (e.clientX - startX);
    geo.y = origTy + (e.clientY - startY);
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
    ensurePositioned(panel);
  });

  handle.addEventListener('pointermove', (e) => {
    if (!resizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.85;

    if (corner === 'br') {
      geo.w = Math.max(MIN_W, Math.min(maxW, origW + dx));
    } else {
      const newW = Math.max(MIN_W, Math.min(maxW, origW - dx));
      geo.x = origGeoX + (origW - newW);
      geo.w = newW;
      panel.style.setProperty('--vspx-tx', geo.x + 'px');
    }
    geo.h = Math.max(MIN_H, Math.min(maxH, origH + dy));
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

// ─── Keyboard ───────────────────────────────────────────────────────────────

function onGlobalKeydown(e) {
  if (e.altKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    if (state === 'expanded') minimizePanel();
    else void openPanel();
    return;
  }
  if (e.key === 'Escape' && state === 'expanded') {
    if (!root || !root.contains(document.activeElement)) return;
    if (isMobile()) closePanel();
    else minimizePanel();
  }
}

// ─── Window Resize (debounced) ──────────────────────────────────────────────

let resizeTimer = null;
function onWindowResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!geo.positioned || state !== 'expanded' || !root) return;
    clampToViewport();
    root.style.setProperty('--vspx-tx', geo.x + 'px');
    root.style.setProperty('--vspx-ty', geo.y + 'px');
  }, 150);
}

// ─── Header Observer ────────────────────────────────────────────────────────

function observePatientHeader() {
  void injectTrigger();
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      void injectTrigger();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ─── Init ───────────────────────────────────────────────────────────────────

function init() {
  loadGeo();
  observePatientHeader();
  document.addEventListener('keydown', onGlobalKeydown);
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('hashchange', async () => {
    await injectTrigger();
    if (!canUseVspx && state === 'expanded') {
      closePanel();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
