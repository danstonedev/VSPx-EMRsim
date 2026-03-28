<script lang="ts">
  import {
    createAssessmentInstance,
    formatAssessmentScoreSummary,
    getAssessmentDefinition,
    listAssessmentDefinitions,
    normalizeStandardizedAssessments,
    type AssessmentDefinition,
    type AssessmentInstance,
  } from '$lib/config/standardizedAssessments';

  interface Props {
    assessments: AssessmentInstance[];
    onchange: (updated: AssessmentInstance[]) => void;
  }

  let { assessments, onchange }: Props = $props();

  const definitions = listAssessmentDefinitions();
  let selectedKey = $state(definitions[0]?.key ?? '');
  let expandedIds = $state<Record<string, boolean>>({});

  const normalizedAssessments = $derived(normalizeStandardizedAssessments(assessments ?? []));

  function isExpanded(id: string): boolean {
    return expandedIds[id] ?? false;
  }

  function toggleExpanded(id: string): void {
    expandedIds = { ...expandedIds, [id]: !isExpanded(id) };
  }

  function commit(nextAssessments: AssessmentInstance[]): void {
    const cloned = [...nextAssessments];
    onchange(normalizeStandardizedAssessments(cloned));
  }

  function addAssessment(): void {
    const created = createAssessmentInstance(selectedKey);
    if (!created) return;

    const next = [...normalizedAssessments, created];
    commit(next);
    expandedIds = { ...expandedIds, [created.id]: true };
  }

  function removeAssessment(id: string): void {
    const next = [...normalizedAssessments].filter((assessment) => assessment.id !== id);
    commit(next);

    if (expandedIds[id]) {
      const nextExpanded = { ...expandedIds };
      delete nextExpanded[id];
      expandedIds = nextExpanded;
    }
  }

  function updateAssessment(
    id: string,
    updater: (assessment: AssessmentInstance) => AssessmentInstance,
  ): void {
    const next = [...normalizedAssessments].map((assessment) =>
      assessment.id === id ? updater(assessment) : assessment,
    );
    commit(next);
  }

  function updateScore(assessmentId: string, itemId: string, score: number): void {
    updateAssessment(assessmentId, (assessment) => {
      const current = assessment.responses[itemId];
      const nextValue: number | '' = current === score ? '' : score;

      return {
        ...assessment,
        responses: {
          ...assessment.responses,
          [itemId]: nextValue,
        },
      };
    });
  }

  function updateNotes(assessmentId: string, notes: string): void {
    updateAssessment(assessmentId, (assessment) => ({ ...assessment, notes }));
  }

  function getScoreValues(definition: AssessmentDefinition): number[] {
    const values: number[] = [];

    for (let score = definition.scoreRange.min; score <= definition.scoreRange.max; score += 1) {
      values.push(score);
    }

    return values;
  }

  function getItemInstructions(definition: AssessmentDefinition, itemId: string): string {
    return definition.itemRubrics[itemId]?.instructions ?? '';
  }

  function getScoreTooltip(
    definition: AssessmentDefinition,
    itemId: string,
    score: number,
  ): string {
    const itemSpecific = definition.itemRubrics[itemId]?.scores?.[score];
    const fallback =
      definition.rubricScale.find((entry) => Number(entry.score) === score)?.description ?? '';
    const description = itemSpecific || fallback;

    return description ? `Score ${score}: ${description}` : `Score ${score}`;
  }

  function getScoreSummary(assessment: AssessmentInstance): string {
    return `${assessment.scores.total}/${assessment.scores.max}`;
  }
</script>

<div class="standardized-assessments flex flex-col gap-4">
  <div class="mb-4 flex flex-wrap items-center gap-3">
    <label class="flex min-w-[15rem] flex-1 flex-col gap-1 text-sm font-medium text-neutral-700">
      <span class="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
        Instrument
      </span>
      <select
        class="ct-select sa-instrument-select"
        bind:value={selectedKey}
        aria-describedby="standardized-assessments-help"
      >
        {#each definitions as definition}
          <option value={definition.key}>{definition.name}</option>
        {/each}
      </select>
    </label>

    <button
      type="button"
      class="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
      onclick={addAssessment}
    >
      Add Assessment
    </button>
  </div>

  <p id="standardized-assessments-help" class="text-sm text-neutral-500">
    Open detailed scoring to use fast score chips with inline rubric cues.
  </p>

  {#if normalizedAssessments.length === 0}
    <div
      class="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-500"
    >
      No standardized functional assessments added yet.
    </div>
  {:else}
    <div class="flex flex-col gap-4">
      {#each normalizedAssessments as assessment}
        {@const definition = getAssessmentDefinition(assessment.instrumentKey)}
        {#if definition}
          <article class="rounded-lg border border-neutral-200 bg-white p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h4 class="text-base font-semibold text-neutral-900">{assessment.title}</h4>
                {#if assessment.status === 'complete' && assessment.interpretation}
                  <p class="mt-1 text-sm text-neutral-700">{assessment.interpretation}</p>
                {/if}
              </div>

              <button
                type="button"
                class="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
                onclick={() => removeAssessment(assessment.id)}
                aria-label={`Remove ${assessment.title}`}
              >
                Remove
              </button>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span
                class={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  assessment.status === 'complete'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {assessment.status === 'complete' ? 'Complete' : 'In Progress'}
              </span>

              {#if assessment.scores.completedItems > 0}
                <span
                  class="inline-flex rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800"
                >
                  Score {getScoreSummary(assessment)}
                </span>
              {/if}

              <span
                class="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700"
              >
                {assessment.scores.completedItems}/{assessment.scores.totalItems} items
              </span>
            </div>

            <button
              type="button"
              class="mt-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              onclick={() => toggleExpanded(assessment.id)}
            >
              {isExpanded(assessment.id) ? 'Hide Detailed Scoring' : 'Open Detailed Scoring'}
            </button>

            <div
              class="inline-collapsible"
              class:inline-collapsible--open={isExpanded(assessment.id)}
            >
              <div
                class="mt-4 flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
              >
                <p class="text-sm text-neutral-500">
                  Select a score chip for each item. Hover for rubric cues.
                </p>

                <div class="ct-wrap sa-table-wrap">
                  <table class="ct-table">
                    <thead>
                      <tr>
                        <th class="ct-th ct-th--region sa-item-col">Item</th>
                        <th class="ct-th">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each definition.items as item, index}
                        <tr class="ct-row" class:ct-row--alt={index % 2 === 1}>
                          <td class="ct-td ct-td--label sa-td--item">
                            <div class="flex items-start gap-2">
                              <span class="font-medium text-neutral-800">{item.label}</span>
                              <span
                                class="sa-info-badge"
                                title={getItemInstructions(definition, item.id)}
                                aria-label={`Instructions for ${item.label}`}
                              >
                                i
                              </span>
                            </div>
                          </td>
                          <td class="ct-td">
                            <div
                              class="flex flex-wrap gap-2"
                              role="group"
                              aria-label={`${item.label} score selection`}
                            >
                              {#each getScoreValues(definition) as score}
                                {@const isActive = assessment.responses[item.id] === score}
                                <button
                                  type="button"
                                  class="score-chip"
                                  class:score-chip--active={isActive}
                                  aria-pressed={isActive ? 'true' : 'false'}
                                  aria-label={`${item.label} score ${score}`}
                                  title={getScoreTooltip(definition, item.id, score)}
                                  onclick={() => updateScore(assessment.id, item.id, score)}
                                >
                                  {score}
                                </button>
                              {/each}
                            </div>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>

                <label class="flex flex-col gap-1 text-sm font-medium text-neutral-700">
                  <span>Notes</span>
                  <textarea
                    class="ct-input sa-notes-textarea"
                    value={assessment.notes}
                    oninput={(event) =>
                      updateNotes(assessment.id, (event.target as HTMLTextAreaElement).value)}
                  ></textarea>
                </label>

                <div
                  class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
                >
                  <div class="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                    Live Summary
                  </div>
                  <div class="mt-1 font-medium">
                    {formatAssessmentScoreSummary(assessment) || `0/${assessment.scores.max}`}
                  </div>
                </div>
              </div>
            </div>
          </article>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .inline-collapsible {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    transition: grid-template-rows 0.2s ease;
  }

  .inline-collapsible > * {
    min-height: 0;
  }

  .inline-collapsible--open {
    grid-template-rows: 1fr;
  }

  /* ─── Scoped overrides for shared ct-* classes ─── */

  .sa-table-wrap {
    border-radius: 6px;
    border: 2px solid var(--color-neutral-300, #d4d4d4);
    background: var(--color-surface, #ffffff);
  }

  .sa-item-col {
    width: 40%;
  }

  .sa-td--item {
    vertical-align: top;
  }

  .sa-instrument-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
  }

  .sa-notes-textarea {
    width: 100%;
    min-height: 5rem;
    padding: 0.5rem 0.75rem;
  }

  .sa-info-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--color-neutral-500, #757575);
    flex-shrink: 0;
  }

  /* ─── Score Chips ─── */

  .score-chip {
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-600, #525252);
    font-size: 0.875rem;
    font-weight: 700;
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      color 0.12s ease;
  }

  .score-chip:hover {
    background: #f5f5f5;
  }

  .score-chip--active {
    border-color: var(--color-brand-green, #009a44);
    background: var(--color-brand-green, #009a44);
    color: white;
  }
</style>
