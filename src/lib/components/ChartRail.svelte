<!--
  ChartRail — Vertical icon-tab navigation column.
  Ported from app/js/features/navigation/ChartRail.js
-->
<script lang="ts">
  import { activeChartTab, toggleTab, type ChartTab } from '$lib/stores/ui';

  interface Tab {
    id: ChartTab;
    label: string;
    icon: string;
  }

  const tabs: Tab[] = [
    { id: 'current-note', label: 'Current Note', icon: 'note_add' },
    { id: 'patient-summary', label: 'Patient', icon: 'person' },
    { id: 'my-notes', label: 'My Notes', icon: 'library_books' },
    { id: 'case-file', label: 'Case File', icon: 'folder' },
  ];

  function handleKeydown(e: KeyboardEvent, idx: number) {
    let next = idx;
    if (e.key === 'ArrowDown') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowUp') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;

    e.preventDefault();
    const buttons = (e.currentTarget as HTMLElement)
      .closest('.chart-rail')
      ?.querySelectorAll<HTMLButtonElement>('.chart-rail__tab');
    buttons?.[next]?.focus();
  }
</script>

<div class="chart-rail" role="tablist" aria-orientation="vertical" aria-label="Chart sections">
  {#each tabs as tab, i}
    <button
      class="chart-rail__tab"
      class:chart-rail__tab--active={$activeChartTab === tab.id}
      role="tab"
      aria-selected={$activeChartTab === tab.id}
      tabindex={$activeChartTab === tab.id || (i === 0 && !$activeChartTab) ? 0 : -1}
      onclick={() => toggleTab(tab.id)}
      onkeydown={(e) => handleKeydown(e, i)}
    >
      <span class="chart-rail__icon material-symbols" aria-hidden="true">{tab.icon}</span>
      <span class="chart-rail__label">{tab.label}</span>
    </button>
  {/each}
</div>

<style>
  .chart-rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: var(--rail-w, 82px);
    min-width: var(--rail-w, 82px);
    height: 100%;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.08) 100%),
      var(--color-brand-600, #16a34a);
    padding: 8px 0 12px;
    overflow-y: auto;
    overflow-x: hidden;
    box-shadow:
      inset -1px 0 0 rgba(255, 255, 255, 0.14),
      10px 0 24px rgba(0, 0, 0, 0.08);
  }

  .chart-rail__tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 70px;
    min-height: 66px;
    margin: 3px 0;
    padding: 8px 4px;
    border: none;
    border-radius: 14px;
    background: transparent;
    color: rgba(255, 255, 255, 0.76);
    cursor: pointer;
    transition:
      background 160ms ease,
      color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
    opacity: 0.96;
  }

  .chart-rail__tab:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.1),
      0 8px 18px rgba(0, 0, 0, 0.1);
  }

  .chart-rail__tab:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.92);
    outline-offset: -2px;
  }

  .chart-rail__tab--active {
    background: linear-gradient(180deg, rgba(71, 71, 71, 0.98) 0%, rgba(58, 58, 58, 0.96) 100%);
    color: #fff;
    opacity: 1;
    box-shadow:
      0 12px 24px rgba(0, 0, 0, 0.24),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .chart-rail__icon {
    font-size: 24px;
    line-height: 1;
  }

  .chart-rail__label {
    max-width: 60px;
    font-size: 10.5px;
    line-height: 1.1;
    font-weight: 600;
    letter-spacing: 0.01em;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
