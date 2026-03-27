<!--
  ChartDetailPanel — Sliding detail panel shown beside the chart rail.
  Ported from app/js/features/navigation/ChartDetailPanel.js
-->
<script lang="ts">
  import { activeChartTab, isPanelOpen, panelWidth, closePanel } from '$lib/stores/ui';

  const tabLabels: Record<string, string> = {
    'current-note': 'Current Note',
    'patient-summary': 'Patient Summary',
    'my-notes': 'My Notes',
    'case-file': 'Case File',
  };

  let { children } = $props();

  let resizing = $state(false);

  function startResize(e: PointerEvent) {
    e.preventDefault();
    resizing = true;
    const startX = e.clientX;
    const startWidth = $panelWidth;
    const railWidth = 82;

    function onMove(ev: PointerEvent) {
      const newWidth = Math.min(560, Math.max(280, startWidth + ev.clientX - startX));
      if (newWidth < 240) {
        closePanel();
        cleanup();
        return;
      }
      panelWidth.set(newWidth);
    }

    function cleanup() {
      resizing = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cleanup);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', cleanup);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closePanel();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $isPanelOpen && $activeChartTab}
  <aside
    class="chart-detail-panel"
    class:chart-detail-panel--open={$isPanelOpen}
    style="width: {$panelWidth}px"
    aria-label={tabLabels[$activeChartTab] ?? 'Detail panel'}
  >
    <div class="chart-detail__header">
      <span class="chart-detail__title">{tabLabels[$activeChartTab] ?? ''}</span>
      <button
        class="chart-detail__close"
        onclick={closePanel}
        aria-label="Close panel"
        type="button"
      >
        ✕
      </button>
    </div>

    <div class="chart-detail__body">
      {@render children()}
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="chart-detail__resize-handle" onpointerdown={startResize}></div>
  </aside>
{/if}

<style>
  .chart-detail-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-neutral-100, #f5f5f5);
    color: var(--color-neutral-800, #262626);
    overflow: hidden;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .chart-detail__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-neutral-200, #e5e5e5);
    background: var(--color-neutral-50, #fafafa);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .chart-detail__title {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .chart-detail__close {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1rem;
    color: var(--color-neutral-500, #737373);
    padding: 0.25rem;
    border-radius: 4px;
    line-height: 1;
  }

  .chart-detail__close:hover {
    background: var(--color-neutral-200, #e5e5e5);
    color: var(--color-neutral-800, #262626);
  }

  .chart-detail__body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
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
    background: var(--color-brand-600, #16a34a);
  }
</style>
