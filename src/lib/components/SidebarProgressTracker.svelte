<!--
  SidebarProgressTracker — discipline-aware note progress tracker for the unified v2 editor shell.
  Supports PT SOAP and Dietetics ADIME section maps.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import { dieteticsNoteDraft, noteDraft } from '$lib/stores/noteSession';
  import { ptDisciplineConfig } from '$lib/config/ptDisciplineConfig';
  import { dieteticsDisciplineConfig } from '$lib/config/dieteticsDisciplineConfig';
  import { type DisciplineProgressConfig, type ProgressStatus } from '$lib/config/progressUtils';
  import { buildProgressSummary, type ProgressDraftData } from '$lib/services/progressTracker';

  interface Props {
    activeSection: string;
    activeSubsection?: string | null;
    suppressSubsectionMotion?: boolean;
    mode?: string;
    draft?: ProgressDraftData;
    onSelectSection?: (sectionId: string) => void;
    onSelectSubsection?: (sectionId: string, subId: string) => void;
  }

  let {
    activeSection,
    activeSubsection = null,
    suppressSubsectionMotion = false,
    mode = 'pt',
    draft,
    onSelectSection,
    onSelectSubsection,
  }: Props = $props();

  const fallbackDraft = $derived(
    (mode === 'dietetics' ? $dieteticsNoteDraft : $noteDraft) as unknown as ProgressDraftData,
  );
  const currentDraft = $derived(draft ?? fallbackDraft);
  const config = $derived<DisciplineProgressConfig>(
    mode === 'dietetics' ? dieteticsDisciplineConfig : ptDisciplineConfig,
  );
  const progressSummary = $derived(buildProgressSummary(config, currentDraft));

  let isMounted = $state(false);
  let expandedSections = $state<Record<string, boolean>>({});

  onMount(() => {
    isMounted = true;
  });

  $effect(() => {
    if (activeSection && expandedSections[activeSection] === undefined) {
      expandedSections = { ...expandedSections, [activeSection]: true };
    }
  });

  function toggleExpand(sectionId: string) {
    expandedSections = { ...expandedSections, [sectionId]: !expandedSections[sectionId] };
  }

  function handleSectionClick(sectionId: string, isExpanded: boolean) {
    onSelectSection?.(sectionId);
    if (!isExpanded || activeSection === sectionId) {
      toggleExpand(sectionId);
    }
  }

  function statusClass(status: ProgressStatus): string {
    return `status-pill--${status}`;
  }

  function statusLabel(status: ProgressStatus): string {
    if (status === 'complete') return 'Complete';
    if (status === 'partial') return 'In progress';
    return 'Not started';
  }

  const navLabel = $derived(
    mode === 'dietetics' ? 'Dietetics section navigation' : 'Physical therapy section navigation',
  );
</script>

<div
  class="sidebar-progress"
  class:sidebar-progress--ready={isMounted}
  class:sidebar-progress--suppress-subsection-motion={suppressSubsectionMotion}
  aria-busy={!isMounted}
>
  <nav class="sidebar-progress__sections" aria-label={navLabel}>
    {#each progressSummary.sections as section}
      {@const isExpanded = expandedSections[section.id] ?? false}
      {@const isActive = activeSection === section.id}

      <section
        class={`section-group section-group--${section.status}`}
        class:section-group--active={isActive}
      >
        <button
          class="section-btn"
          class:section-btn--active={isActive}
          type="button"
          aria-expanded={isExpanded}
          onclick={() => handleSectionClick(section.id, isExpanded)}
        >
          <span class="section-btn__label">{section.label}</span>
          <span
            class="section-btn__chevron"
            class:section-btn__chevron--open={isExpanded}
            aria-hidden="true"
          >
            ▸
          </span>
        </button>

        {#if isExpanded && section.subsections.length > 0}
          <div
            class="subsection-list-wrap"
            in:slide={{ duration: 180, easing: cubicOut }}
            out:slide={{ duration: 140, easing: cubicOut }}
          >
            <ul class="subsection-list" role="list">
              {#each section.subsections as subsection}
                {@const isActiveSubsection = isActive && activeSubsection === subsection.id}
                <li>
                  <button
                    class="subsection-btn"
                    class:subsection-btn--active={isActiveSubsection}
                    type="button"
                    aria-current={isActiveSubsection ? 'step' : undefined}
                    onclick={() => onSelectSubsection?.(section.id, subsection.id)}
                  >
                    <span class="subsection-btn__label">{subsection.label}</span>
                    <span
                      class="status-pill {statusClass(subsection.status)}"
                      aria-hidden="true"
                      title={statusLabel(subsection.status)}
                    ></span>
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </section>
    {/each}
  </nav>
</div>

<style>
  .sidebar-progress {
    display: flex;
    flex-direction: column;
    opacity: 0;
    transition: opacity 0.14s ease;
  }

  .sidebar-progress--ready {
    opacity: 1;
  }

  .sidebar-progress__sections {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .section-group {
    position: relative;
    border: none;
    border-radius: 8px;
    overflow: hidden;
    background: transparent;
    box-shadow: none;
    transition:
      background 0.16s ease,
      border-color 0.16s ease,
      box-shadow 0.16s ease;
  }

  .section-group::before {
    content: none;
  }

  .section-group--active {
    background: transparent;
    box-shadow: none;
  }

  .section-btn {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.65rem 0.75rem;
    border: none;
    border-radius: 8px;
    background: linear-gradient(90deg, rgba(0, 122, 53, 0.5) 0%, rgba(0, 154, 68, 0.5) 100%);
    cursor: pointer;
    color: rgba(255, 255, 255, 0.9);
    text-align: left;
    transition:
      background 0.12s ease,
      color 0.12s ease,
      box-shadow 0.12s ease;
  }

  .section-btn:not(.section-btn--active):hover {
    background: linear-gradient(90deg, rgba(0, 122, 53, 0.75) 0%, rgba(0, 154, 68, 0.75) 100%);
    box-shadow: none;
  }

  .section-btn--active {
    background: linear-gradient(
      90deg,
      var(--color-brand-green-dark, #007a35) 0%,
      var(--color-brand-green, #009a44) 100%
    );
    color: #ffffff;
    box-shadow: none;
  }

  .section-btn__label {
    flex: 1;
    min-width: 0;
    font-size: 0.95rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: currentColor;
  }

  .section-btn__chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 999px;
    background: color-mix(in srgb, currentColor 12%, transparent);
    font-size: 0;
    line-height: 0;
    color: currentColor;
    transition: transform 0.16s ease;
    overflow: hidden;
  }

  .section-btn__chevron::before {
    content: '';
    width: 0.4rem;
    height: 0.4rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg) translate(-8%, -8%);
  }

  .section-btn__chevron--open {
    transform: rotate(90deg);
  }

  .subsection-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.15rem 0.9rem 0.65rem;
    background: transparent;
    border-top: none;
    margin: 0;
    list-style: none;
  }

  .subsection-list-wrap {
    overflow: hidden;
    background: transparent;
  }

  .subsection-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.55rem;
    width: 100%;
    padding: 0.45rem 0.5rem 0.45rem 0.65rem;
    border: none;
    border-radius: 6px;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, color-mix(in srgb, var(--color-brand-gray, #aeaeae) 70%, white) 86%, white)
        0%,
      color-mix(in srgb, var(--color-brand-gray, #aeaeae) 54%, white) 100%
    );
    cursor: pointer;
    font-size: 0.8125rem;
    color: var(--color-neutral-800, #424242);
    text-align: left;
    transition:
      background 0.12s ease,
      color 0.12s ease,
      box-shadow 0.12s ease;
  }

  .subsection-btn:not(.subsection-btn--active):hover {
    background: linear-gradient(
      90deg,
      color-mix(in srgb, color-mix(in srgb, var(--color-brand-gray, #aeaeae) 76%, white) 92%, white)
        0%,
      color-mix(in srgb, var(--color-brand-gray, #aeaeae) 64%, white) 100%
    );
    box-shadow: none;
  }

  .subsection-btn--active {
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--color-brand-gray, #aeaeae) 84%, #999999) 0%,
      var(--color-brand-gray, #aeaeae) 100%
    );
    color: var(--color-neutral-900, #1a1a1a);
    box-shadow: 0 1px 2px rgba(66, 66, 66, 0.06);
  }

  .sidebar-progress--suppress-subsection-motion .subsection-btn {
    transition: none;
  }

  .subsection-btn__label {
    flex: 1;
    min-width: 0;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: currentColor;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 0.9rem;
    flex-shrink: 0;
    border-radius: 999px;
    border: none;
  }

  .status-pill--complete {
    background: color-mix(in srgb, var(--color-brand-green, #009a44) 78%, white);
  }

  .status-pill--partial {
    background: color-mix(in srgb, var(--color-brand-orange, #ff671f) 86%, white);
  }

  .status-pill--empty {
    background: color-mix(in srgb, var(--color-neutral-600, #616161) 16%, transparent);
  }
</style>
