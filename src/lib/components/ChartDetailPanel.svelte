<!--
  ChartDetailPanel — sliding detail panel shown beside the chart rail.
-->
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { getChartTabLabelMap } from '$lib/config/chartTabs';
  import {
    activeChartTab,
    isPanelOpen,
    panelWidth,
    closePanel,
    CHART_PANEL_WIDTH_DEFAULT,
    CHART_PANEL_WIDTH_MAX,
    CHART_PANEL_WIDTH_MIN,
    CHART_PANEL_WIDTH_STORAGE_KEY,
    clampPanelWidth,
  } from '$lib/stores/ui';

  const tabLabels = getChartTabLabelMap(1);

  let { children } = $props();
  let persistedWidthLoaded = false;
  let detachResizeListeners: (() => void) | null = null;

  const activeLabel = $derived.by(() =>
    $activeChartTab ? (tabLabels[$activeChartTab] ?? 'Detail panel') : 'Detail panel',
  );

  onMount(() => {
    if (persistedWidthLoaded) return;

    try {
      const raw = window.localStorage.getItem(CHART_PANEL_WIDTH_STORAGE_KEY);
      const parsed = Number.parseInt(raw ?? '', 10);
      const nextWidth = Number.isFinite(parsed)
        ? clampPanelWidth(parsed)
        : CHART_PANEL_WIDTH_DEFAULT;
      panelWidth.set(nextWidth);
    } catch {
      panelWidth.set(CHART_PANEL_WIDTH_DEFAULT);
    }

    persistedWidthLoaded = true;
  });

  onDestroy(() => {
    detachResizeListeners?.();
  });

  function persistPanelWidth(width: number) {
    try {
      window.localStorage.setItem(CHART_PANEL_WIDTH_STORAGE_KEY, String(clampPanelWidth(width)));
    } catch {
      // Best effort only; panel remains functional without persisted width.
    }
  }

  function startResize(event: PointerEvent) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = clampPanelWidth($panelWidth || CHART_PANEL_WIDTH_DEFAULT);

    function onMove(moveEvent: PointerEvent) {
      const newWidth = Math.min(
        CHART_PANEL_WIDTH_MAX,
        Math.max(CHART_PANEL_WIDTH_MIN, startWidth + moveEvent.clientX - startX),
      );
      panelWidth.set(newWidth);
    }

    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cleanup);
      detachResizeListeners = null;
      persistPanelWidth($panelWidth);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', cleanup);
    detachResizeListeners = cleanup;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') closePanel();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $isPanelOpen && $activeChartTab}
  <div
    class="chart-detail-panel"
    role="tabpanel"
    aria-labelledby={`chart-tab-${$activeChartTab}`}
    style="width: {$panelWidth}px"
    aria-label={activeLabel}
  >
    <div class="chart-detail__header">
      <h2 class="chart-detail__title">{activeLabel}</h2>
      <button
        type="button"
        class="chart-detail__close"
        aria-label={`Close ${activeLabel}`}
        onclick={closePanel}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>

    <div class="chart-detail__body">
      {@render children()}
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="chart-detail__resize-handle" onpointerdown={startResize}></div>
  </div>
{/if}

<style>
  .chart-detail-panel {
    display: flex;
    flex-direction: column;
    align-self: stretch;
    flex-shrink: 0;
    height: 100%;
    min-height: 0;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-brand-gray, var(--und-gray, #aeaeae)) 18%, white) 0%,
      color-mix(in srgb, var(--color-brand-gray, var(--und-gray, #aeaeae)) 28%, white) 100%
    );
    color: var(--color-neutral-800, #262626);
    overflow: hidden;
    border-right: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow:
      0 22px 46px rgba(15, 23, 42, 0.12),
      0 6px 18px rgba(15, 23, 42, 0.06);
    position: relative;
  }

  .chart-detail__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.85rem 1rem 0.8rem;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-brand-gray, var(--und-gray, #aeaeae)) 42%, white) 0%,
      color-mix(in srgb, var(--color-brand-gray, var(--und-gray, #aeaeae)) 58%, white) 100%
    );
    border-bottom: 1px solid color-mix(in srgb, var(--color-brand-gray, #aeaeae) 34%, white);
  }

  .chart-detail__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-neutral-900, #1a1a1a);
  }

  .chart-detail__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.9rem;
    height: 1.9rem;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.46);
    color: var(--color-neutral-700, #525252);
    cursor: pointer;
    transition:
      background 0.14s ease,
      color 0.14s ease;
  }

  .chart-detail__close:hover {
    background: rgba(255, 255, 255, 0.72);
    color: var(--color-neutral-900, #1a1a1a);
  }

  .chart-detail__close:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--color-brand-green, #009a44) 62%, white);
    outline-offset: 2px;
  }

  .chart-detail__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 1.125rem;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-brand-gray, var(--und-gray, #aeaeae)) 34%, white) 0%,
      color-mix(in srgb, var(--color-brand-gray, var(--und-gray, #aeaeae)) 52%, white) 100%
    );
  }

  .chart-detail__resize-handle {
    position: absolute;
    top: 0;
    right: -6px;
    width: 12px;
    height: 100%;
    cursor: col-resize;
    z-index: 2;
    background: transparent;
    transition: background 0.15s ease;
    touch-action: none;
  }

  .chart-detail__resize-handle:hover {
    background: linear-gradient(
      180deg,
      rgba(0, 154, 68, 0),
      rgba(0, 154, 68, 0.22),
      rgba(0, 154, 68, 0)
    );
  }
</style>
