/**
 * ChartDetailPanel – resizable sliding panel for Hybrid Two-Panel layout.
 *
 * Hosts one tab's content at a time. The panel opens when a tab is selected
 * and closes when the same tab is toggled again or when the user clicks
 * the close button.  Content is lazily mounted via a `render` callback
 * passed from the parent orchestrator.
 */

import { el } from '../../ui/utils.js';

/**
 * @param {Object} opts
 * @param {(tabId:string, container:HTMLElement)=>void} opts.renderContent
 *        Called when a tab becomes active. Append/replace content inside `container`.
 * @param {()=>void} [opts.onClose]  – Called when the panel is dismissed.
 * @returns {HTMLElement & {
 *   show: (tabId:string, label:string)=>void,
 *   hide: ()=>void,
 *   isOpen: ()=>boolean,
 *   currentTab: ()=>string|null,
 * }}
 */
export function createChartDetailPanel({ renderContent, onClose }) {
  const PANEL_WIDTH_STORAGE_KEY = 'chart-detail-panel-width-v1';
  const DEFAULT_W = 360;
  const MIN_W = 280;
  const MAX_W = 560;
  const COLLAPSE_W = 180;
  const COLLAPSE_THRESHOLD = 240;
  let currentTabId = null;
  let lastExpandedWidth = readStoredWidth();

  const closeBtn = el(
    'button',
    {
      class: 'chart-detail__close',
      'aria-label': 'Close panel',
      title: 'Close panel',
    },
    ['\u00D7'],
  ); // ×

  const headerLabel = el('span', { class: 'chart-detail__title' });
  const header = el('div', { class: 'chart-detail__header' }, [headerLabel, closeBtn]);
  const body = el('div', { class: 'chart-detail__body' });

  /* ---- Resize handle on right edge ---- */
  const resizeHandle = el('div', {
    class: 'chart-detail__resize-handle',
    'aria-hidden': 'true',
    title: 'Drag to resize or collapse',
  });

  const panel = el(
    'aside',
    {
      class: 'chart-detail-panel',
      role: 'tabpanel',
      'aria-hidden': 'true',
    },
    [header, body, resizeHandle],
  );

  closeBtn.addEventListener('click', () => hide());

  applyPanelWidth(lastExpandedWidth, { persist: false });

  /* ---- Drag-to-resize logic ---- */
  function clampWidth(width, min = MIN_W) {
    return Math.min(MAX_W, Math.max(min, Math.round(width)));
  }

  function readStoredWidth() {
    try {
      const raw = window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
      const parsed = Number.parseInt(raw || '', 10);
      return Number.isFinite(parsed) ? clampWidth(parsed) : DEFAULT_W;
    } catch {
      return DEFAULT_W;
    }
  }

  function persistPanelWidth(width) {
    try {
      window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(width));
    } catch {
      /* best effort */
    }
  }

  function applyPanelWidth(width, { persist = true } = {}) {
    const normalized = clampWidth(width);
    document.documentElement.style.setProperty('--panel-w', `${normalized}px`);
    if (persist) {
      lastExpandedWidth = normalized;
      persistPanelWidth(normalized);
    }
  }

  function onPointerDown(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panel.offsetWidth || lastExpandedWidth;
    let pendingWidth = startW;

    function onPointerMove(ev) {
      const delta = ev.clientX - startX;
      pendingWidth = clampWidth(startW + delta, COLLAPSE_W);
      document.documentElement.style.setProperty('--panel-w', `${pendingWidth}px`);
    }

    function onPointerUp() {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.body.classList.remove('chart-panel-resizing');

      if (pendingWidth <= COLLAPSE_THRESHOLD) {
        hide();
        applyPanelWidth(lastExpandedWidth, { persist: false });
        return;
      }

      applyPanelWidth(pendingWidth);
    }

    document.body.classList.add('chart-panel-resizing');
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  resizeHandle.addEventListener('pointerdown', onPointerDown);

  /** Keyboard: Escape closes panel */
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      hide();
    }
  });

  function show(tabId, label) {
    // Toggle off if clicking the already-active tab
    if (currentTabId === tabId && panel.classList.contains('chart-detail-panel--open')) {
      hide();
      return;
    }

    currentTabId = tabId;
    applyPanelWidth(lastExpandedWidth, { persist: false });
    headerLabel.textContent = label;
    panel.setAttribute('aria-hidden', 'false');
    panel.setAttribute('id', `panel-${tabId}`);
    panel.classList.add('chart-detail-panel--open');

    // Let the caller mount content into the body region
    body.replaceChildren();
    renderContent(tabId, body);
  }

  function hide() {
    panel.classList.remove('chart-detail-panel--open');
    panel.setAttribute('aria-hidden', 'true');
    currentTabId = null;
    if (onClose) onClose();
  }

  // Attach public API directly on the element
  panel.show = show;
  panel.hide = hide;
  panel.isOpen = () => panel.classList.contains('chart-detail-panel--open');
  panel.currentTab = () => currentTabId;

  return panel;
}
