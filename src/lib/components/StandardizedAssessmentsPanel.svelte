<script lang="ts">
  import {
    createAssessmentInstance,
    formatAssessmentScoreSummary,
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

  const definitions = listAssessmentDefinitions().filter((definition) =>
    definition.disciplines.includes('pt'),
  );
  const definitionOrder = new Map(definitions.map((definition, index) => [definition.key, index]));

  let expandedKeys = $state<Record<string, boolean>>({});

  const normalizedAssessments = $derived(normalizeStandardizedAssessments(assessments ?? []));
  const assessmentsByKey = $derived.by(() => {
    const entries = new Map<string, AssessmentInstance>();

    for (const assessment of normalizedAssessments) {
      entries.set(assessment.instrumentKey, assessment);
    }

    return entries;
  });

  function isExpanded(key: string): boolean {
    return expandedKeys[key] ?? false;
  }

  function toggleExpanded(key: string): void {
    expandedKeys = { ...expandedKeys, [key]: !isExpanded(key) };
  }

  function getAssessment(key: string): AssessmentInstance | null {
    return assessmentsByKey.get(key) ?? null;
  }

  function commit(nextAssessments: AssessmentInstance[]): void {
    const dedupedByKey = new Map<string, AssessmentInstance>();

    for (const assessment of normalizeStandardizedAssessments(nextAssessments)) {
      dedupedByKey.set(assessment.instrumentKey, assessment);
    }

    const ordered = [...dedupedByKey.values()].sort((a, b) => {
      const aIndex = definitionOrder.get(a.instrumentKey) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = definitionOrder.get(b.instrumentKey) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });

    onchange(ordered);
  }

  function upsertAssessment(
    key: string,
    updater: (assessment: AssessmentInstance) => AssessmentInstance,
  ): void {
    const current = getAssessment(key) ?? createAssessmentInstance(key);
    if (!current) return;

    const next = normalizedAssessments.filter((assessment) => assessment.instrumentKey !== key);
    commit([...next, updater(current)]);
  }

  function resetAssessment(key: string): void {
    const next = normalizedAssessments.filter((assessment) => assessment.instrumentKey !== key);
    commit(next);
  }

  function updateScore(instrumentKey: string, itemId: string, score: number): void {
    upsertAssessment(instrumentKey, (assessment) => {
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

  function updateNumericValue(instrumentKey: string, itemId: string, raw: string): void {
    if (!getAssessment(instrumentKey) && raw.trim() === '') return;

    upsertAssessment(instrumentKey, (assessment) => {
      const n = raw === '' ? '' : parseFloat(raw);
      const value: number | '' = typeof n === 'number' && Number.isFinite(n) ? n : '';

      return {
        ...assessment,
        responses: {
          ...assessment.responses,
          [itemId]: value,
        },
      };
    });
  }

  function updateNotes(instrumentKey: string, notes: string): void {
    if (!getAssessment(instrumentKey) && notes.trim() === '') return;

    upsertAssessment(instrumentKey, (assessment) => ({ ...assessment, notes }));
  }

  function isNumericType(definition: AssessmentDefinition): boolean {
    return definition.measurementType === 'timed' || definition.measurementType === 'distance';
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

  function getStatusLabel(assessment: AssessmentInstance | null): string {
    if (!assessment) return 'Not started';
    return assessment.status === 'complete' ? 'Complete' : 'In progress';
  }

  function getStatusTone(assessment: AssessmentInstance | null): string {
    if (!assessment) return 'sa-status--idle';
    return assessment.status === 'complete' ? 'sa-status--complete' : 'sa-status--progress';
  }

  function getMetricLabel(
    definition: AssessmentDefinition,
    assessment: AssessmentInstance,
  ): string {
    if (assessment.status === 'complete') {
      return formatAssessmentScoreSummary(assessment) || getScoreSummary(assessment);
    }

    if (assessment.scores.completedItems > 0) {
      return `Score ${getScoreSummary(assessment)}`;
    }

    if (assessment.notes.trim()) {
      return 'Notes added';
    }

    return '';
  }
</script>

<div class="standardized-assessments">
  <div class="sa-list" role="list" aria-label="Standardized functional assessment instruments">
    {#each definitions as definition}
      {@const assessment = getAssessment(definition.key)}
      {@const metricLabel = assessment ? getMetricLabel(definition, assessment) : ''}
      <article class="sa-card" role="listitem" data-instrument={definition.key}>
        <div class="sa-card__header">
          <button
            type="button"
            class="sa-card__toggle"
            onclick={() => toggleExpanded(definition.key)}
            aria-expanded={isExpanded(definition.key)}
            aria-controls={`assessment-details-${definition.key}`}
          >
            <div class="sa-card__identity">
              <span class="sa-card__title">{definition.name}</span>
              <span class="sa-card__subtitle">{definition.instructions}</span>
            </div>

            <div class="sa-card__summary">
              <span class={`sa-status ${getStatusTone(assessment)}`}
                >{getStatusLabel(assessment)}</span
              >

              {#if assessment}
                {#if metricLabel}
                  <span class="sa-summary-pill">{metricLabel}</span>
                {/if}

                <span class="sa-summary-pill sa-summary-pill--muted">
                  {assessment.scores.completedItems}/{assessment.scores.totalItems} items
                </span>
              {/if}

              <span
                class="sa-chevron"
                class:sa-chevron--open={isExpanded(definition.key)}
                aria-hidden="true"
              >
                ▾
              </span>
            </div>
          </button>

          {#if assessment}
            <button
              type="button"
              class="sa-reset"
              onclick={() => resetAssessment(definition.key)}
              aria-label={`Reset ${definition.name}`}
            >
              Reset
            </button>
          {/if}
        </div>

        <div
          id={`assessment-details-${definition.key}`}
          class="inline-collapsible"
          class:inline-collapsible--open={isExpanded(definition.key)}
        >
          <div class="sa-card__body" class:sa-card__body--open={isExpanded(definition.key)}>
            <div class="sa-body__lead">
              <p class="sa-body__help">
                {#if isNumericType(definition)}
                  Enter measured values for each item to save this instrument to the note.
                {:else}
                  Select a score chip for each item. Hover for rubric cues.
                {/if}
              </p>

              {#if assessment}
                <div class="sa-live-summary">
                  <div class="sa-live-summary__label">Live Summary</div>
                  <div class="sa-live-summary__value">
                    {formatAssessmentScoreSummary(assessment) || `0/${assessment.scores.max}`}
                  </div>
                </div>
              {/if}
            </div>

            <div class="sa-table-wrap">
              <table class="sa-table">
                <thead>
                  <tr class="sa-table__row sa-table__row--head">
                    <th class="sa-th sa-th--item sa-item-col" scope="col">Item</th>
                    <th class="sa-th sa-th--score" scope="col">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {#each definition.items as item, index}
                    <tr class="sa-table__row" class:sa-table__row--alt={index % 2 === 1}>
                      <td class="sa-td sa-td--item">
                        <div class="sa-item-wrap">
                          <span class="sa-item-label">{item.label}</span>
                          <span
                            class="sa-info-badge"
                            title={getItemInstructions(definition, item.id)}
                            aria-label={`Instructions for ${item.label}`}
                          >
                            i
                          </span>
                        </div>
                      </td>
                      <td class="sa-td sa-td--score">
                        {#if isNumericType(definition)}
                          <div class="sa-numeric-input">
                            <input
                              type="text"
                              inputmode="decimal"
                              class="ct-input sa-numeric-field"
                              value={assessment?.responses[item.id] === ''
                                ? ''
                                : String(assessment?.responses[item.id] ?? '')}
                              placeholder={definition.unit ?? ''}
                              aria-label={item.label}
                              onblur={(e) =>
                                updateNumericValue(
                                  definition.key,
                                  item.id,
                                  (e.target as HTMLInputElement).value,
                                )}
                            />
                            {#if definition.unit}
                              <span class="sa-unit">{definition.unit}</span>
                            {/if}
                          </div>
                        {:else}
                          <div
                            class="sa-score-group"
                            role="group"
                            aria-label={`${item.label} score selection`}
                          >
                            {#each getScoreValues(definition) as score}
                              {@const isActive = assessment?.responses[item.id] === score}
                              <button
                                type="button"
                                class="score-chip"
                                class:score-chip--active={isActive}
                                aria-pressed={isActive ? 'true' : 'false'}
                                aria-label={`${item.label} score ${score}`}
                                title={getScoreTooltip(definition, item.id, score)}
                                onclick={() => updateScore(definition.key, item.id, score)}
                              >
                                {score}
                              </button>
                            {/each}
                          </div>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <label class="sa-notes-field">
              <span class="sa-notes-label">Notes</span>
              <textarea
                class="ct-input sa-notes-textarea"
                value={assessment?.notes ?? ''}
                oninput={(event) =>
                  updateNotes(definition.key, (event.target as HTMLTextAreaElement).value)}
              ></textarea>
            </label>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .standardized-assessments {
    display: flex;
    flex-direction: column;
  }

  .sa-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sa-card {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
    overflow: hidden;
  }

  .sa-card__header {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    padding: 0.25rem;
  }

  .sa-card__toggle {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.875rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    padding: 0.625rem 0.75rem;
    text-align: left;
    transition: background 0.12s ease;
  }

  .sa-card__toggle:hover {
    background: rgba(255, 255, 255, 0.82);
  }

  .sa-card__identity {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1875rem;
  }

  .sa-card__title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-neutral-800, #1f2937);
  }

  .sa-card__subtitle {
    font-size: 0.75rem;
    line-height: 1.35;
    color: var(--color-neutral-500, #757575);
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .sa-card__summary {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.375rem;
    flex-shrink: 0;
  }

  .sa-status,
  .sa-summary-pill {
    display: inline-flex;
    align-items: center;
    min-height: 1.5rem;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    border: 1px solid transparent;
    font-size: 0.6875rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .sa-status--idle {
    background: var(--color-surface, #ffffff);
    border-color: var(--color-neutral-300, #d4d4d4);
    color: var(--color-neutral-500, #757575);
  }

  .sa-status--progress {
    background: rgba(217, 119, 6, 0.08);
    border-color: rgba(217, 119, 6, 0.18);
    color: #92400e;
  }

  .sa-status--complete {
    background: rgba(0, 154, 68, 0.08);
    border-color: rgba(0, 154, 68, 0.16);
    color: #166534;
  }

  .sa-summary-pill {
    background: var(--color-surface, #ffffff);
    border-color: var(--color-neutral-300, #d4d4d4);
    color: var(--color-neutral-700, #424242);
  }

  .sa-summary-pill--muted {
    color: var(--color-neutral-500, #757575);
  }

  .sa-chevron {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #757575);
    transition: transform 0.18s ease;
  }

  .sa-chevron--open {
    transform: rotate(180deg);
  }

  .sa-reset {
    align-self: center;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      color 0.12s ease;
  }

  .sa-reset:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-neutral-400, #a3a3a3);
    color: var(--color-neutral-800, #1f2937);
  }

  .inline-collapsible {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    transition: grid-template-rows 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .inline-collapsible > * {
    min-height: 0;
  }

  .inline-collapsible--open {
    grid-template-rows: 1fr;
  }

  .sa-card__body {
    margin: 0;
    padding: 0.625rem 0.75rem 0.75rem;
    border-top: 1px solid var(--color-neutral-200, #e0e0e0);
    background: rgba(255, 255, 255, 0.7);
    opacity: 0;
    transform: translateY(-0.35rem);
    transform-origin: top center;
    transition:
      opacity 0.18s ease,
      transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: opacity, transform;
  }

  .sa-card__body--open {
    opacity: 1;
    transform: translateY(0);
  }

  .sa-body__lead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.625rem;
    margin-bottom: 0.625rem;
    flex-wrap: wrap;
  }

  .sa-body__help {
    margin: 0;
    max-width: 42rem;
    font-size: 0.75rem;
    line-height: 1.45;
    color: var(--color-neutral-500, #757575);
  }

  .sa-live-summary {
    min-width: 10rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
    padding: 0.5rem 0.625rem;
  }

  .sa-live-summary__label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-500, #757575);
  }

  .sa-live-summary__value {
    margin-top: 0.125rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-neutral-800, #1f2937);
  }

  .sa-table-wrap {
    margin-bottom: 0.625rem;
    overflow-x: auto;
    border-radius: 6px;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    background: var(--color-surface, #ffffff);
  }

  .sa-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.78125rem;
  }

  .sa-table__row--head {
    background: var(--color-neutral-50, #fafafa);
  }

  .sa-th {
    padding: 0.5rem 0.75rem;
    text-align: left;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-neutral-500, #757575);
    background: var(--color-neutral-50, #fafafa);
    border-bottom: 1px solid var(--color-neutral-200, #e0e0e0);
  }

  .sa-th--item {
    border-right: 1px solid var(--color-neutral-200, #e0e0e0);
  }

  .sa-th--score {
    text-align: center;
  }

  .sa-td {
    padding: 0.625rem 0.75rem;
    vertical-align: top;
    border-bottom: 1px solid var(--color-neutral-200, #e0e0e0);
    background: var(--color-surface, #ffffff);
  }

  .sa-table tbody tr:last-child .sa-td {
    border-bottom: none;
  }

  .sa-table__row--alt .sa-td {
    background: #fcfcfc;
  }

  .sa-item-col {
    width: 40%;
  }

  .sa-td--item {
    width: 40%;
    border-right: 1px solid var(--color-neutral-200, #e0e0e0);
  }

  .sa-td--score {
    vertical-align: middle;
  }

  .sa-item-wrap {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .sa-item-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-neutral-800, #1f2937);
  }

  .sa-score-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .sa-notes-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sa-notes-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
  }

  .sa-notes-textarea {
    width: 100%;
  }

  .sa-info-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 999px;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    background: var(--color-surface, #ffffff);
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--color-neutral-500, #757575);
    flex-shrink: 0;
  }

  .sa-numeric-input {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .sa-numeric-field {
    width: 6rem;
    text-align: center;
    font-weight: 600;
  }

  .sa-unit {
    font-size: 0.6875rem;
    color: var(--color-neutral-500, #757575);
    font-weight: 500;
  }

  .score-chip {
    width: 1.875rem;
    height: 1.875rem;
    border-radius: 4px;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-600, #525252);
    font-size: 0.75rem;
    font-weight: 600;
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

  @media (max-width: 900px) {
    .sa-card__header {
      flex-direction: column;
      gap: 0.25rem;
    }

    .sa-card__toggle {
      flex-direction: column;
      align-items: stretch;
    }

    .sa-card__summary {
      justify-content: flex-start;
    }

    .sa-reset {
      align-self: flex-start;
      margin-left: 0.5rem;
      margin-top: -0.1rem;
    }
  }
</style>
