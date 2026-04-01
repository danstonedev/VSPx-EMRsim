<!--
  ChartRail — Vertical icon-tab navigation column.
  Ported from app/js/features/navigation/ChartRail.js
-->
<script lang="ts">
  import { activeChartTab, toggleTab, type ChartTab } from '$lib/stores/ui';
  import { getChartTabs } from '$lib/config/chartTabs';

  const tabs = getChartTabs(1).map((tab) => ({
    id: tab.id as ChartTab,
    label: tab.label,
    icon: tab.materialIcon,
  }));

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
      id={`chart-tab-${tab.id}`}
      role="tab"
      aria-selected={$activeChartTab === tab.id}
      tabindex={$activeChartTab === tab.id || (i === 0 && !$activeChartTab) ? 0 : -1}
      onclick={() => toggleTab(tab.id)}
      onkeydown={(e) => handleKeydown(e, i)}
    >
      <span class="chart-rail__icon material-symbols-outlined" aria-hidden="true">{tab.icon}</span>
      <span class="chart-rail__label">{tab.label}</span>
    </button>
  {/each}
</div>

<style>
  .chart-rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    align-self: stretch;
    flex-shrink: 0;
    width: var(--rail-w, 104px);
    min-width: var(--rail-w, 104px);
    height: 100%;
    background:
      radial-gradient(circle at top, rgba(255, 255, 255, 0.12), transparent 32%),
      linear-gradient(180deg, #0f9c4a 0%, #0a7b39 58%, #075629 100%);
    padding: 14px 10px 18px;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    box-shadow:
      inset -1px 0 0 rgba(255, 255, 255, 0.14),
      16px 0 28px rgba(0, 0, 0, 0.12);
  }

  .chart-rail__tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 88px;
    margin: 0;
    padding: 12px 10px;
    border: none;
    border-radius: 18px;
    background: transparent;
    color: rgba(255, 255, 255, 0.82);
    cursor: pointer;
    transition:
      background 160ms ease,
      color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
    opacity: 0.98;
  }

  .chart-rail__tab:not(.chart-rail__tab--active):hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.08),
      0 10px 20px rgba(0, 0, 0, 0.12);
  }

  .chart-rail__tab:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.92);
    outline-offset: -2px;
  }

  .chart-rail__tab--active {
    background: linear-gradient(180deg, rgba(38, 38, 38, 0.98) 0%, rgba(22, 22, 22, 0.97) 100%);
    color: #fff;
    opacity: 1;
    box-shadow:
      0 14px 26px rgba(0, 0, 0, 0.24),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .chart-rail__icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.14);
    font-size: 24px;
    line-height: 1;
  }

  .chart-rail__tab--active .chart-rail__icon {
    background: rgba(255, 255, 255, 0.1);
  }

  .chart-rail__label {
    max-width: 100%;
    font-size: 12px;
    line-height: 1.18;
    font-weight: 700;
    letter-spacing: 0.015em;
    text-align: center;
    display: -webkit-box;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (max-width: 920px) {
    .chart-rail {
      width: var(--rail-w, 88px);
      min-width: var(--rail-w, 88px);
      padding-inline: 8px;
    }

    .chart-rail__tab {
      min-height: 78px;
      padding-inline: 8px;
    }

    .chart-rail__label {
      font-size: 11px;
    }
  }
</style>
