<!--
  VspxChatWidget — Floating draggable/resizable iframe panel embedding the VSPx
  patient simulator. Preserves WebRTC call state across minimize/expand cycles.

  States: idle (hidden) → expanded (visible panel)
  Ported from app/js/features/vspx-chat/vspx-chat.js
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    hasVerifiedAccessCode,
    verifyFacultyAccessCode,
    loadGeometry,
    saveGeometry,
    VSPX_DEFAULTS,
    type VspxGeometry,
  } from '$lib/services/vspxAccess';

  interface Props {
    vspxUrl: string;
    caseId: string;
    onActiveChange?: (active: boolean) => void;
  }

  let { vspxUrl, caseId, onActiveChange }: Props = $props();

  // ─── State ───
  let widgetState = $state<'idle' | 'expanded'>('idle');
  let isAnimating = $state(false);
  let hasActiveConversation = $state(false);
  let iframeLoading = $state(true);
  let iframeError = $state(false);

  // ─── Geometry ───
  let geo = $state<VspxGeometry>(loadGeometry());
  let positioned = $state(geo.positioned);

  // ─── DOM refs ───
  let panelEl = $state<HTMLDivElement | null>(null);
  let iframeEl: HTMLIFrameElement | null = null;
  let iframeContainerEl = $state<HTMLDivElement | null>(null);
  let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // ─── Drag state ───
  let isDragging = $state(false);
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOrigX = 0;
  let dragOrigY = 0;

  // ─── Resize state ───
  let isResizing = $state(false);
  let resizeCorner: 'br' | 'bl' = 'br';
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeOrigW = 0;
  let resizeOrigH = 0;
  let resizeOrigGeoX = 0;

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
  const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Geometry helpers ───

  function clampToViewport(): void {
    if (!positioned) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    geo.x = Math.max(-geo.w + VSPX_DEFAULTS.edgePad, Math.min(geo.x, vw - VSPX_DEFAULTS.edgePad));
    geo.y = Math.max(-geo.h + VSPX_DEFAULTS.edgePad, Math.min(geo.y, vh - VSPX_DEFAULTS.edgePad));
  }

  function ensurePositioned(): void {
    if (positioned || !panelEl) return;
    const rect = panelEl.getBoundingClientRect();
    geo.x = rect.left;
    geo.y = rect.top;
    positioned = true;
  }

  function persistGeo(): void {
    saveGeometry({ ...geo, positioned });
  }

  // ─── iframe lifecycle ───

  function createIframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.className = 'vspx-chat__iframe';
    iframe.title = 'VSPx Patient Voice Chat';
    iframe.allow = 'microphone; camera';
    iframe.referrerPolicy = 'no-referrer';
    return iframe;
  }

  function destroyIframe(): void {
    if (loadTimeoutId) {
      clearTimeout(loadTimeoutId);
      loadTimeoutId = null;
    }
    if (iframeEl) {
      iframeEl.remove();
      iframeEl = null;
    }
  }

  function wireIframeLoad(iframe: HTMLIFrameElement): void {
    iframeLoading = true;
    iframeError = false;

    const onLoaded = () => {
      iframeLoading = false;
      iframeError = false;
      hasActiveConversation = true;
      onActiveChange?.(true);
    };

    const onError = () => {
      iframeLoading = false;
      iframeError = true;
    };

    iframe.addEventListener('load', onLoaded, { once: true });
    iframe.addEventListener('error', onError, { once: true });
    iframe.src = vspxUrl;

    loadTimeoutId = setTimeout(() => {
      if (iframeLoading) onError();
    }, VSPX_DEFAULTS.iframeLoadTimeout);

    iframe.addEventListener(
      'load',
      () => {
        if (loadTimeoutId) clearTimeout(loadTimeoutId);
      },
      { once: true },
    );
  }

  function retryIframe(): void {
    if (!iframeContainerEl) return;
    destroyIframe();
    iframeEl = createIframe();
    iframeContainerEl.appendChild(iframeEl);
    wireIframeLoad(iframeEl);
  }

  // ─── Panel actions ───

  export async function open(): Promise<void> {
    if (isAnimating || widgetState === 'expanded') return;

    // Access check
    if (!hasActiveConversation && !hasVerifiedAccessCode(caseId)) {
      const verified = await verifyFacultyAccessCode(caseId);
      if (!verified) return;
    }

    isAnimating = true;
    widgetState = 'expanded';

    // After DOM update, set up iframe
    await tick();

    if (iframeContainerEl) {
      if (hasActiveConversation && iframeEl) {
        // Reattach surviving iframe (preserves WebRTC)
        iframeContainerEl.appendChild(iframeEl);
        iframeLoading = false;
        iframeError = false;
      } else {
        destroyIframe();
        iframeEl = createIframe();
        iframeContainerEl.appendChild(iframeEl);
        wireIframeLoad(iframeEl);
      }
    }

    // Entry animation
    if (panelEl && !reducedMotion()) {
      panelEl.classList.add('vspx-chat--enter');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panelEl?.classList.remove('vspx-chat--enter');
          panelEl?.classList.add('vspx-chat--enter-active');
          const done = () => {
            panelEl?.classList.remove('vspx-chat--enter-active');
            isAnimating = false;
          };
          panelEl?.addEventListener('transitionend', done, { once: true });
          setTimeout(done, 350);
        });
      });
    } else {
      isAnimating = false;
    }
  }

  function minimize(): void {
    if (isAnimating || widgetState !== 'expanded') return;
    isAnimating = true;

    // Detach iframe but keep reference alive (preserves WebRTC)
    if (iframeEl) iframeEl.remove();
    hasActiveConversation = Boolean(iframeEl);
    onActiveChange?.(hasActiveConversation);

    animateExit(() => {
      widgetState = 'idle';
      isAnimating = false;
    });
  }

  function close(): void {
    if (isAnimating || widgetState !== 'expanded') return;
    isAnimating = true;

    destroyIframe();
    hasActiveConversation = false;
    onActiveChange?.(false);

    animateExit(() => {
      widgetState = 'idle';
      isAnimating = false;
    });
  }

  function animateExit(callback: () => void): void {
    if (!panelEl || reducedMotion()) {
      callback();
      return;
    }
    const el = panelEl;
    el.classList.add('vspx-chat--exit');
    requestAnimationFrame(() => {
      el.classList.add('vspx-chat--exit-active');
      const cleanup = () => {
        callback();
      };
      el.addEventListener('transitionend', cleanup, { once: true });
      setTimeout(cleanup, 300);
    });
  }

  // ─── Drag handlers ───

  function onTitlebarPointerDown(e: PointerEvent): void {
    if (isMobile()) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    isDragging = true;

    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);

    ensurePositioned();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOrigX = geo.x;
    dragOrigY = geo.y;
  }

  function onTitlebarPointerMove(e: PointerEvent): void {
    if (!isDragging) return;
    geo.x = dragOrigX + (e.clientX - dragStartX);
    geo.y = dragOrigY + (e.clientY - dragStartY);
  }

  function onTitlebarPointerUp(): void {
    if (!isDragging) return;
    isDragging = false;
    clampToViewport();
    persistGeo();
  }

  // ─── Resize handlers ───

  function onResizePointerDown(e: PointerEvent, corner: 'br' | 'bl'): void {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    resizeCorner = corner;

    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);

    ensurePositioned();
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeOrigW = geo.w;
    resizeOrigH = geo.h;
    resizeOrigGeoX = geo.x;
  }

  function onResizePointerMove(e: PointerEvent): void {
    if (!isResizing) return;
    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.85;

    if (resizeCorner === 'br') {
      geo.w = Math.max(VSPX_DEFAULTS.minW, Math.min(maxW, resizeOrigW + dx));
    } else {
      const newW = Math.max(VSPX_DEFAULTS.minW, Math.min(maxW, resizeOrigW - dx));
      geo.x = resizeOrigGeoX + (resizeOrigW - newW);
      geo.w = newW;
    }
    geo.h = Math.max(VSPX_DEFAULTS.minH, Math.min(maxH, resizeOrigH + dy));
  }

  function onResizePointerUp(): void {
    if (!isResizing) return;
    isResizing = false;
    persistGeo();
  }

  // ─── Keyboard handler ───

  function onGlobalKeydown(e: KeyboardEvent): void {
    if (e.altKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      if (widgetState === 'expanded') minimize();
      else void open();
      return;
    }
    if (e.key === 'Escape' && widgetState === 'expanded') {
      if (!panelEl || !panelEl.contains(document.activeElement)) return;
      if (isMobile()) close();
      else minimize();
    }
  }

  // ─── Window resize (debounced) ───

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  function onWindowResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!positioned || widgetState !== 'expanded') return;
      clampToViewport();
    }, 150);
  }

  // ─── Svelte tick import ───
  import { tick } from 'svelte';

  // ─── Lifecycle ───

  onMount(() => {
    document.addEventListener('keydown', onGlobalKeydown);
    window.addEventListener('resize', onWindowResize);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', onGlobalKeydown);
    window.removeEventListener('resize', onWindowResize);
    if (resizeTimer) clearTimeout(resizeTimer);
    destroyIframe();
  });

  // ─── Derived styles ───

  const panelStyle = $derived.by(() => {
    if (isMobile()) return '';
    const parts: string[] = [];
    parts.push(`--vspx-w: ${geo.w}px`);
    parts.push(`--vspx-h: ${geo.h}px`);
    if (positioned) {
      parts.push(`--vspx-tx: ${geo.x}px`);
      parts.push(`--vspx-ty: ${geo.y}px`);
    }
    return parts.join('; ');
  });

  const mobile = $derived(typeof window !== 'undefined' && window.innerWidth <= 768);
</script>

{#if widgetState === 'expanded'}
  <div
    bind:this={panelEl}
    class="vspx-chat vspx-chat--panel"
    class:vspx-chat--positioned={positioned && !mobile}
    class:vspx-chat--dragging={isDragging}
    class:vspx-chat--resizing={isResizing}
    role="complementary"
    aria-label="Patient voice chat"
    style={panelStyle}
  >
    <!-- Title bar -->
    <div
      class="vspx-chat__titlebar"
      aria-roledescription="draggable region"
      onpointerdown={onTitlebarPointerDown}
      onpointermove={onTitlebarPointerMove}
      onpointerup={onTitlebarPointerUp}
      onpointercancel={onTitlebarPointerUp}
    >
      {#if !mobile}
        <svg class="vspx-chat__grip" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="4" r="1.5" /><circle cx="11" cy="4" r="1.5" />
          <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="12" r="1.5" /><circle cx="11" cy="12" r="1.5" />
        </svg>
      {/if}

      <span class="vspx-chat__title">Patient Chat</span>

      <button
        class="vspx-chat__btn"
        type="button"
        aria-label="Open in new tab"
        title="Open in new tab"
        onclick={(e) => {
          e.stopPropagation();
          window.open(vspxUrl, '_blank', 'noopener');
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </button>

      <button
        class="vspx-chat__btn"
        type="button"
        aria-label={mobile ? 'Close chat' : 'Minimize chat'}
        title={mobile ? 'Close' : 'Minimize'}
        onclick={(e) => {
          e.stopPropagation();
          if (mobile) close();
          else minimize();
        }}
      >
        {#if mobile}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
            />
          </svg>
        {/if}
      </button>

      <button
        class="vspx-chat__btn"
        type="button"
        aria-label="Close chat"
        title="Close (Alt+Shift+C)"
        onclick={(e) => {
          e.stopPropagation();
          close();
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- iframe body -->
    <div class="vspx-chat__body" bind:this={iframeContainerEl}>
      {#if iframeLoading}
        <div class="vspx-chat__loading">
          <div class="vspx-chat__spinner"></div>
          <span>Connecting to patient&hellip;</span>
        </div>
      {/if}

      {#if iframeError}
        <div class="vspx-chat__error">
          <span class="vspx-chat__error-msg">Unable to connect to VSPx</span>
          <div class="vspx-chat__error-actions">
            <button class="vspx-chat__error-btn" type="button" onclick={retryIframe}>Retry</button>
            <a class="vspx-chat__error-btn" href={vspxUrl} target="_blank" rel="noopener">
              Open in new tab
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- Resize handles (desktop only) -->
    {#if !mobile}
      <div
        class="vspx-chat__resize vspx-chat__resize--br"
        onpointerdown={(e) => onResizePointerDown(e, 'br')}
        onpointermove={onResizePointerMove}
        onpointerup={onResizePointerUp}
        onpointercancel={onResizePointerUp}
      >
        <svg
          class="vspx-chat__resize-icon"
          viewBox="0 0 10 10"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="1.2" /><circle cx="4" cy="8" r="1.2" /><circle
            cx="8"
            cy="4"
            r="1.2"
          />
        </svg>
      </div>
      <div
        class="vspx-chat__resize vspx-chat__resize--bl"
        onpointerdown={(e) => onResizePointerDown(e, 'bl')}
        onpointermove={onResizePointerMove}
        onpointerup={onResizePointerUp}
        onpointercancel={onResizePointerUp}
      >
        <svg
          class="vspx-chat__resize-icon"
          viewBox="0 0 10 10"
          fill="currentColor"
          aria-hidden="true"
          style="transform: scaleX(-1)"
        >
          <circle cx="8" cy="8" r="1.2" /><circle cx="4" cy="8" r="1.2" /><circle
            cx="8"
            cy="4"
            r="1.2"
          />
        </svg>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* ─── Container ─── */
  .vspx-chat {
    position: fixed;
    z-index: 1150;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }

  /* ─── Expanded Panel ─── */
  .vspx-chat--panel {
    right: 24px;
    bottom: 24px;
    width: var(--vspx-w, 400px);
    height: var(--vspx-h, 560px);
    min-width: 320px;
    min-height: 400px;
    max-width: 90vw;
    max-height: 85vh;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #d1d5db;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: bottom right;
  }

  /* Dragged position via custom properties */
  .vspx-chat--positioned {
    right: auto;
    bottom: auto;
    left: 0;
    top: 0;
    transform: translate(var(--vspx-tx, 0px), var(--vspx-ty, 0px));
  }

  /* ─── Title Bar ─── */
  .vspx-chat__titlebar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px 0 12px;
    height: 44px;
    min-height: 44px;
    background: #fff;
    border-bottom: 1px solid #d1d5db;
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
  }

  .vspx-chat__titlebar:active {
    cursor: grabbing;
  }

  .vspx-chat__grip {
    width: 16px;
    height: 16px;
    opacity: 0.35;
    flex-shrink: 0;
  }

  .vspx-chat__title {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 600;
    color: #000;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Title bar buttons */
  .vspx-chat__btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    opacity: 0.6;
    flex-shrink: 0;
    padding: 0;
    transition:
      opacity 120ms ease,
      background 120ms ease;
  }

  .vspx-chat__btn:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }

  .vspx-chat__btn:focus-visible {
    outline: 2px solid #16a34a;
    outline-offset: -2px;
    opacity: 1;
  }

  .vspx-chat__btn svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* ─── iframe Area ─── */
  .vspx-chat__body {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: #fff;
  }

  :global(.vspx-chat__iframe) {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }

  /* Pointer guard during drag/resize */
  .vspx-chat--dragging :global(.vspx-chat__iframe),
  .vspx-chat--resizing :global(.vspx-chat__iframe) {
    pointer-events: none;
  }

  /* ─── Loading / Error ─── */
  .vspx-chat__loading,
  .vspx-chat__error {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    text-align: center;
    color: #000;
    background: #fff;
  }

  .vspx-chat__spinner {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid #d1d5db;
    border-top-color: #16a34a;
    animation: vspx-spin 0.8s linear infinite;
  }

  @keyframes vspx-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .vspx-chat__error-msg {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .vspx-chat__error-actions {
    display: flex;
    gap: 8px;
  }

  .vspx-chat__error-btn {
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    background: #fff;
    color: #000;
    font-size: 0.8125rem;
    cursor: pointer;
    text-decoration: none;
    transition: background 120ms ease;
  }

  .vspx-chat__error-btn:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  /* ─── Resize Handles ─── */
  .vspx-chat__resize {
    position: absolute;
    width: 20px;
    height: 20px;
    z-index: 2;
  }

  .vspx-chat__resize--br {
    bottom: 0;
    right: 0;
    cursor: nwse-resize;
  }

  .vspx-chat__resize--bl {
    bottom: 0;
    left: 0;
    cursor: nesw-resize;
  }

  .vspx-chat__resize-icon {
    position: absolute;
    bottom: 4px;
    width: 10px;
    height: 10px;
    opacity: 0.25;
    transition: opacity 120ms ease;
  }

  .vspx-chat__resize--br .vspx-chat__resize-icon {
    right: 4px;
  }

  .vspx-chat__resize--bl .vspx-chat__resize-icon {
    left: 4px;
  }

  .vspx-chat__resize:hover .vspx-chat__resize-icon {
    opacity: 0.5;
  }

  /* ─── Entry/Exit Animations ─── */
  .vspx-chat--enter {
    opacity: 0;
    transform: scale(0.3);
  }

  .vspx-chat--enter-active {
    opacity: 1;
    transform: scale(1) translate(var(--vspx-tx, 0px), var(--vspx-ty, 0px));
    transition:
      opacity 300ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .vspx-chat--exit {
    opacity: 1;
  }

  .vspx-chat--exit-active {
    opacity: 0;
    transform: scale(0.3);
    transition:
      opacity 250ms cubic-bezier(0.55, 0, 1, 0.45),
      transform 250ms cubic-bezier(0.55, 0, 1, 0.45);
  }

  /* ─── Responsive — fullscreen on mobile ─── */
  @media (max-width: 768px) {
    .vspx-chat--panel {
      inset: 0;
      width: 100% !important;
      height: 100% !important;
      max-width: 100vw;
      max-height: 100vh;
      border-radius: 0;
      border: none;
      transform-origin: bottom right;
    }

    .vspx-chat__titlebar {
      cursor: default;
    }

    .vspx-chat__grip {
      display: none;
    }

    .vspx-chat__resize {
      display: none;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .vspx-chat--panel {
      --vspx-w: 360px;
      --vspx-h: 480px;
    }
  }

  /* ─── Reduced Motion ─── */
  @media (prefers-reduced-motion: reduce) {
    .vspx-chat--enter,
    .vspx-chat--enter-active,
    .vspx-chat--exit,
    .vspx-chat--exit-active {
      transition: none !important;
      transform: none !important;
      opacity: 1 !important;
    }
  }

  /* ─── Print ─── */
  @media print {
    .vspx-chat {
      display: none !important;
    }
  }
</style>
