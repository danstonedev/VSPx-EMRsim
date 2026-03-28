<!--
  ChartDetailPanel — sliding detail panel shown beside the chart rail.
-->
<script lang="ts">
  import { activeChartTab, isPanelOpen, panelWidth, closePanel } from '$lib/stores/ui';

  const tabLabels: Record<string, string> = {
    'current-note': 'Note Guide',
    'patient-summary': 'Chart Summary',
    'my-notes': 'Note History',
    'case-file': 'Shared Case File',
  };

  let { children } = $props();

  function startResize(event: PointerEvent) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = $panelWidth;

    function onMove(moveEvent: PointerEvent) {
      const newWidth = Math.min(560, Math.max(300, startWidth + moveEvent.clientX - startX));
      panelWidth.set(newWidth);
    }

    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cleanup);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', cleanup);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') closePanel();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $isPanelOpen && $activeChartTab}
  <aside
    class="chart-detail-panel"
    style="width: {$panelWidth}px"
    aria-label={tabLabels[$activeChartTab] ?? 'Detail panel'}
  >
    <div class="chart-detail__header">
      <div class="chart-detail__eyebrow">Workspace Panel</div>
      <div class="chart-detail__heading-row">
        <span class="chart-detail__title">{tabLabels[$activeChartTab] ?? ''}</span>
        <button
          class="chart-detail__close"
          onclick={closePanel}
          aria-label="Close panel"
          type="button"
        >
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>
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
    align-self: stretch;
    flex-shrink: 0;
    height: 100%;
    min-height: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(247, 248, 249, 0.98));
    color: var(--color-neutral-800, #262626);
    overflow: hidden;
    border-right: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow:
      0 22px 46px rgba(15, 23, 42, 0.12),
      0 6px 18px rgba(15, 23, 42, 0.06);
    position: relative;
  }

  .chart-detail__header {
    padding: 0.9rem 1.125rem 1rem;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
    position: sticky;
    top: 0;
    z-index: 1;
    backdrop-filter: blur(8px);
  }

  .chart-detail__eyebrow {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-neutral-500, #737373);
    margin-bottom: 0.35rem;
  }

  .chart-detail__heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .chart-detail__title {
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.01em;
  }

  .chart-detail__close {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    color: var(--color-neutral-500, #737373);
    padding: 0;
    border-radius: 999px;
    line-height: 1;
    transition:
      background 0.16s ease,
      color 0.16s ease,
      border-color 0.16s ease;
  }

  .chart-detail__close:hover {
    background: rgba(15, 23, 42, 0.06);
    color: var(--color-neutral-800, #262626);
    border-color: rgba(15, 23, 42, 0.14);
  }

  .chart-detail__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 1.125rem;
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
