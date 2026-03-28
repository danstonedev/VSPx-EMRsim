<!--
  SidebarProgressTracker — discipline-aware note progress tracker for the unified v2 editor shell.
  Supports PT SOAP and Dietetics ADIME section maps.
-->
<script lang="ts">
  import { noteDraft } from '$lib/stores/noteSession';
  import { ptDisciplineConfig } from '$lib/config/ptDisciplineConfig';
  import { dieteticsDisciplineConfig } from '$lib/config/dieteticsDisciplineConfig';
  import {
    genericProgressCheck,
    hasAnyContent,
    type DisciplineProgressConfig,
    type ProgressStatus,
  } from '$lib/config/progressUtils';

  interface Props {
    activeSection: string;
    mode?: 'pt' | 'dietetics';
    draft?: Record<string, Record<string, unknown>>;
    onSelectSection?: (sectionId: string) => void;
    onSelectSubsection?: (sectionId: string, subId: string) => void;
  }

  let { activeSection, mode = 'pt', draft, onSelectSection, onSelectSubsection }: Props = $props();

  const fallbackDraft = $derived($noteDraft as unknown as Record<string, Record<string, unknown>>);
  const currentDraft = $derived(draft ?? fallbackDraft);
  const config = $derived<DisciplineProgressConfig>(
    mode === 'dietetics' ? dieteticsDisciplineConfig : ptDisciplineConfig,
  );

  let expandedSections = $state<Record<string, boolean>>({});

  $effect(() => {
    if (activeSection && !expandedSections[activeSection]) {
      expandedSections = { ...expandedSections, [activeSection]: true };
    }
  });

  function toggleExpand(sectionId: string) {
    expandedSections = { ...expandedSections, [sectionId]: !expandedSections[sectionId] };
  }

  function getSectionData(sectionId: string): Record<string, unknown> | undefined {
    const sectionKey = config.sectionKeyMap?.[sectionId] ?? sectionId;
    return currentDraft[sectionKey];
  }

  function getSubsectionStatus(subId: string, sectionId: string): ProgressStatus {
    const sectionData = getSectionData(sectionId);
    const resolver = config.dataResolvers[subId];
    const subData = resolver ? resolver(sectionData) : sectionData?.[subId];
    const requirement = config.requirements[subId];

    if (subData === undefined || subData === null) return 'empty';
    if (requirement) {
      return requirement(subData, sectionData)
        ? 'complete'
        : hasAnyContent(subData)
          ? 'partial'
          : 'empty';
    }
    return genericProgressCheck(subData);
  }

  function getSectionStatus(sectionId: string): ProgressStatus {
    const subIds = config.subsections[sectionId] ?? [];
    if (subIds.length === 0) return 'empty';

    const statuses = subIds.map((subId) => getSubsectionStatus(subId, sectionId));
    if (statuses.every((status) => status === 'complete')) return 'complete';
    if (statuses.every((status) => status === 'empty')) return 'empty';
    return 'partial';
  }

  function statusClass(status: ProgressStatus): string {
    return `progress-dot--${status}`;
  }

  function statusLabel(status: ProgressStatus): string {
    if (status === 'complete') return 'Complete';
    if (status === 'partial') return 'In progress';
    return 'Not started';
  }

  const completionPct = $derived.by(() => {
    let total = 0;
    let complete = 0;
    for (const section of config.sections) {
      const subsectionIds = config.subsections[section.id] ?? [];
      for (const subId of subsectionIds) {
        total += 1;
        const status = getSubsectionStatus(subId, section.id);
        if (status === 'complete') complete += 1;
        else if (status === 'partial') complete += 0.5;
      }
    }
    return total > 0 ? Math.round((complete / total) * 100) : 0;
  });

  const trackerTitle = $derived(mode === 'dietetics' ? 'ADIME Progress' : 'Note Progress');
  const navLabel = $derived(
    mode === 'dietetics' ? 'Dietetics section navigation' : 'Physical therapy section navigation',
  );
</script>

<div class="sidebar-progress">
  <div class="sidebar-progress__header">
    <span class="sidebar-progress__title">{trackerTitle}</span>
    <span class="sidebar-progress__pct">{completionPct}%</span>
  </div>

  <div class="sidebar-progress__bar">
    <div class="sidebar-progress__fill" style="width: {completionPct}%"></div>
  </div>

  <nav class="sidebar-progress__sections" aria-label={navLabel}>
    {#each config.sections as section}
      {@const status = getSectionStatus(section.id)}
      {@const isExpanded = expandedSections[section.id] ?? false}
      {@const isActive = activeSection === section.id}
      {@const subsectionIds = config.subsections[section.id] ?? []}

      <div class="section-group" class:section-group--active={isActive}>
        <button
          class="section-btn"
          class:section-btn--active={isActive}
          type="button"
          aria-expanded={isExpanded}
          onclick={() => {
            onSelectSection?.(section.id);
            if (!isExpanded) toggleExpand(section.id);
          }}
        >
          <span class="progress-dot {statusClass(status)}" aria-label={statusLabel(status)}></span>
          <span class="section-btn__label">{section.label}</span>
          <span
            class="section-btn__chevron"
            class:section-btn__chevron--open={isExpanded}
            aria-hidden="true"
          >
            ▸
          </span>
        </button>

        {#if isExpanded && subsectionIds.length > 0}
          <ul class="subsection-list" role="list">
            {#each subsectionIds as subId}
              {@const subStatus = getSubsectionStatus(subId, section.id)}
              <li>
                <button
                  class="subsection-btn"
                  type="button"
                  onclick={() => onSelectSubsection?.(section.id, subId)}
                >
                  <span
                    class="progress-dot progress-dot--sm {statusClass(subStatus)}"
                    aria-label={statusLabel(subStatus)}
                  ></span>
                  <span class="subsection-btn__label">
                    {config.subsectionLabels[subId] ?? subId}
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </nav>
</div>

<style>
  .sidebar-progress {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sidebar-progress__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sidebar-progress__title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--color-neutral-700, #525252);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .sidebar-progress__pct {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--color-brand-green, #009a44);
  }

  .sidebar-progress__bar {
    height: 5px;
    border-radius: 999px;
    background: var(--color-neutral-200, #e0e0e0);
    overflow: hidden;
  }

  .sidebar-progress__fill {
    height: 100%;
    background: linear-gradient(90deg, #009a44, #11b35a);
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .sidebar-progress__sections {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .section-group {
    border-radius: 10px;
    overflow: hidden;
  }

  .section-group--active {
    background: var(--color-neutral-100, #f5f5f5);
  }

  .section-btn {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: none;
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-neutral-700, #525252);
    text-align: left;
    transition: background 0.12s;
  }

  .section-btn:hover {
    background: var(--color-neutral-200, #e0e0e0);
  }

  .section-btn--active {
    color: var(--color-neutral-900, #1a1a1a);
  }

  .section-btn__label {
    flex: 1;
  }

  .section-btn__chevron {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #9e9e9e);
    transition: transform 0.15s ease;
    transform: rotate(0deg);
    line-height: 1;
  }

  .section-btn__chevron--open {
    transform: rotate(90deg);
  }

  .progress-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid var(--color-neutral-300, #d4d4d4);
    background: transparent;
    transition:
      background 0.2s,
      border-color 0.2s;
  }

  .progress-dot--sm {
    width: 10px;
    height: 10px;
  }

  .progress-dot--partial {
    border-color: var(--color-brand-orange, #ff671f);
    background: var(--color-brand-orange, #ff671f);
  }

  .progress-dot--complete {
    border-color: var(--color-brand-green, #009a44);
    background: var(--color-brand-green, #009a44);
  }

  .progress-dot--empty {
    border-color: var(--color-neutral-300, #d4d4d4);
    background: transparent;
  }

  .subsection-list {
    list-style: none;
    margin: 0;
    padding: 0 0 0.375rem 1.4rem;
  }

  .subsection-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.42rem 0.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.82rem;
    color: var(--color-neutral-600, #616161);
    text-align: left;
    border-radius: 6px;
    transition: background 0.12s;
  }

  .subsection-btn:hover {
    background: var(--color-neutral-200, #e0e0e0);
  }

  .subsection-btn__label {
    line-height: 1.3;
  }
</style>
