<!--
  AssessmentSection — ICF classification, PT diagnosis, clinical reasoning, prognosis.
  Structured impairments, tissue irritability, MSD picker, prognostic checklists.
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';
  import type { AssessmentData, ImpairmentEntry } from '$lib/types/sections';
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import { useNoteTemplate, isSubsectionVisible } from '$lib/config/templates';
  import GroupedToggleBoard from './GroupedToggleBoard.svelte';
  import SearchableSelect from './SearchableSelect.svelte';
  import {
    BODY_REGIONS,
    IMPAIRMENT_TYPES,
    SEVERITY_LEVELS,
    TISSUE_IRRITABILITY_OPTIONS,
    HEALING_STAGE_OPTIONS,
    MOVEMENT_SYSTEM_DIAGNOSES,
    scoreMSD,
    POSITIVE_PROGNOSTIC_FACTORS,
    NEGATIVE_PROGNOSTIC_FACTORS,
  } from '$lib/config/assessmentOptions';

  const noteTemplate = useNoteTemplate();

  const POSITIVE_FACTOR_GROUPS = [
    {
      id: 'baseline',
      label: 'Baseline Health',
      helper: 'The patient starts recovery with favorable health or tissue status.',
      items: ['Good general health', 'Young age', 'Acute condition'].map((factor) => ({
        value: factor,
        label: factor,
      })),
    },
    {
      id: 'recovery-context',
      label: 'Recovery Context',
      helper: 'The problem is easier to dose, explain, or monitor over time.',
      items: ['Clear mechanism of injury', 'Prior rehabilitation success'].map((factor) => ({
        value: factor,
        label: factor,
      })),
    },
    {
      id: 'engagement',
      label: 'Engagement and Support',
      helper: 'The patient is likely to participate consistently in care.',
      items: ['Motivated patient', 'Strong social support'].map((factor) => ({
        value: factor,
        label: factor,
      })),
    },
  ];

  const NEGATIVE_FACTOR_GROUPS = [
    {
      id: 'medical-complexity',
      label: 'Medical Complexity',
      helper: 'Health status may slow healing or increase treatment uncertainty.',
      items: [
        'Multiple comorbidities',
        'Chronic condition',
        'Complex pain presentation',
        'Advanced age',
      ].map((factor) => ({ value: factor, label: factor })),
    },
    {
      id: 'adherence-psychosocial',
      label: 'Psychosocial and Adherence Barriers',
      helper: 'Engagement, coping, or follow-through may limit progress.',
      items: ['Psychosocial barriers', 'Poor adherence history'].map((factor) => ({
        value: factor,
        label: factor,
      })),
    },
    {
      id: 'environmental',
      label: 'Environmental and Case Factors',
      helper: 'Outside context may make recovery harder to sustain.',
      items: ['Limited social support', "Workers' comp / litigation"].map((factor) => ({
        value: factor,
        label: factor,
      })),
    },
  ];

  const section = $derived($noteDraft.assessment);

  function field(key: keyof AssessmentData): string {
    const v = section[key];
    return typeof v === 'string' ? v : '';
  }

  function onInput(key: keyof AssessmentData, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    updateField('assessment', key, target.value);
  }

  // ─── Collapsible state ───

  let openSubs = $state<Record<string, boolean>>({
    impairments: true,
    icf: true,
    diagnosis: true,
    prognosis: true,
    reasoning: true,
  });

  function toggle(id: string) {
    openSubs = { ...openSubs, [id]: !openSubs[id] };
  }

  // ─── ID generation ───

  function genId(): string {
    return `imp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  // ─── Structured Impairments ───

  const impairmentEntries = $derived.by((): ImpairmentEntry[] => {
    const arr = section.impairmentEntries;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    // Legacy migration: convert narrative text to a single notes-only entry
    const legacy = section.primaryImpairments;
    if (typeof legacy === 'string' && legacy.trim()) {
      return [{ id: 'migrated', bodyRegion: '', impairmentType: '', severity: '', notes: legacy }];
    }
    return [];
  });

  function updateImpairments(entries: ImpairmentEntry[]) {
    updateField('assessment', 'impairmentEntries', [...entries]);
    // Clear legacy field on first structured write
    if (section.primaryImpairments && entries.length > 0 && entries[0].id !== 'migrated') {
      updateField('assessment', 'primaryImpairments', '');
    }
  }

  function addImpairment() {
    updateImpairments([
      ...impairmentEntries,
      { id: genId(), bodyRegion: '', impairmentType: '', severity: '', notes: '' },
    ]);
  }

  function removeImpairment(id: string) {
    updateImpairments(impairmentEntries.filter((e) => e.id !== id));
  }

  function updateImpField(id: string, key: keyof ImpairmentEntry, value: string) {
    updateImpairments(impairmentEntries.map((e) => (e.id === id ? { ...e, [key]: value } : e)));
  }

  // ─── Movement System Diagnosis ───

  const msd = $derived(section.movementSystemDiagnosis ?? '');

  function onMsdSelect(value: string) {
    updateField('assessment', 'movementSystemDiagnosis', value);
  }

  // ─── Prognostic Factor Checklists ───

  const positiveFactors = $derived.by((): string[] => {
    const pf = section.positivePrognosticFactors;
    return Array.isArray(pf) ? pf : [];
  });

  const negativeFactors = $derived.by((): string[] => {
    const nf = section.negativePrognosticFactors;
    return Array.isArray(nf) ? nf : [];
  });

  function toggleFactor(polarity: 'positive' | 'negative', factor: string) {
    const key = polarity === 'positive' ? 'positivePrognosticFactors' : 'negativePrognosticFactors';
    const current = polarity === 'positive' ? positiveFactors : negativeFactors;
    const updated = current.includes(factor)
      ? current.filter((f) => f !== factor)
      : [...current, factor];
    updateField('assessment', key, updated);
  }
</script>

<div class="soap-section soap-assessment">
  <!-- Primary Impairments (structured) -->
  {#if isSubsectionVisible(noteTemplate, 'assessment', 'primary-impairments')}
    <CollapsibleSubsection
      title="Primary Impairments"
      open={openSubs.impairments}
      onToggle={() => toggle('impairments')}
      dataSubsection="primary-impairments"
    >
      {#if impairmentEntries.length === 0}
        <div class="imp-empty">
          No impairments documented.
          <button type="button" class="imp-add-btn" onclick={addImpairment}>Add Impairment</button>
        </div>
      {:else}
        {#each impairmentEntries as entry (entry.id)}
          <div class="imp-entry">
            <button
              type="button"
              class="imp-remove"
              onclick={() => removeImpairment(entry.id)}
              aria-label="Remove impairment">&times;</button
            >
            <div class="imp-row">
              <label class="imp-field imp-field--grow">
                Body Region
                <select
                  value={entry.bodyRegion}
                  onchange={(e) =>
                    updateImpField(entry.id, 'bodyRegion', (e.target as HTMLSelectElement).value)}
                >
                  {#each BODY_REGIONS as opt}<option value={opt.value}>{opt.label}</option>{/each}
                </select>
              </label>
              <label class="imp-field imp-field--grow">
                Impairment Type
                <select
                  value={entry.impairmentType}
                  onchange={(e) =>
                    updateImpField(
                      entry.id,
                      'impairmentType',
                      (e.target as HTMLSelectElement).value,
                    )}
                >
                  {#each IMPAIRMENT_TYPES as opt}<option value={opt.value}>{opt.label}</option
                    >{/each}
                </select>
              </label>
              <label class="imp-field">
                Severity
                <select
                  value={entry.severity}
                  onchange={(e) =>
                    updateImpField(entry.id, 'severity', (e.target as HTMLSelectElement).value)}
                >
                  {#each SEVERITY_LEVELS as opt}<option value={opt.value}>{opt.label}</option
                    >{/each}
                </select>
              </label>
            </div>
            <label class="imp-field imp-field--full">
              Notes
              <input
                type="text"
                value={entry.notes}
                placeholder="Specifics, measurements, contributing factors..."
                oninput={(e) =>
                  updateImpField(entry.id, 'notes', (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
        {/each}
        <button type="button" class="imp-add-btn" onclick={addImpairment}>+ Add Impairment</button>
      {/if}

      <label class="field-label" style="margin-top: 0.5rem;">
        Narrative Summary (optional)
        <textarea
          rows="2"
          value={field('primaryImpairments')}
          oninput={(e) => onInput('primaryImpairments', e)}
          placeholder="Additional narrative summary of impairments..."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- ICF Classification -->
  {#if isSubsectionVisible(noteTemplate, 'assessment', 'icf-classification')}
    <CollapsibleSubsection
      title="ICF Classification"
      open={openSubs.icf}
      onToggle={() => toggle('icf')}
      dataSubsection="icf-classification"
    >
      <label class="field-label">
        Body Functions, Structures & Impairments
        <span class="field-hint"
          >ICF b/s codes: muscle strength, joint mobility, pain, sensory integrity, posture, tissue
          integrity</span
        >
        <textarea
          rows="2"
          value={field('bodyFunctions')}
          oninput={(e) => onInput('bodyFunctions', e)}
          placeholder="Impairments in body functions (pain, ROM, strength, motor control)..."
        ></textarea>
      </label>
      <label class="field-label">
        Activity Limitations
        <span class="field-hint"
          >ICF d codes: walking, stairs, transfers, lifting, self-care, driving, occupational tasks</span
        >
        <textarea
          rows="2"
          value={field('activityLimitations')}
          oninput={(e) => onInput('activityLimitations', e)}
          placeholder="Specific activities the patient has difficulty performing..."
        ></textarea>
      </label>
      <label class="field-label">
        Participation Restrictions
        <span class="field-hint"
          >Social roles, occupational demands, recreational activities, community engagement</span
        >
        <textarea
          rows="2"
          value={field('participationRestrictions')}
          oninput={(e) => onInput('participationRestrictions', e)}
          placeholder="Life situations affected (work, recreation, social)..."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- PT Diagnosis -->
  {#if isSubsectionVisible(noteTemplate, 'assessment', 'pt-diagnosis')}
    <CollapsibleSubsection
      title="Physical Therapy Diagnosis"
      open={openSubs.diagnosis}
      onToggle={() => toggle('diagnosis')}
      dataSubsection="pt-diagnosis"
    >
      <label class="field-label">
        Movement System Diagnosis (APTA)
        <SearchableSelect
          value={msd}
          placeholder="Search APTA movement system categories..."
          items={MOVEMENT_SYSTEM_DIAGNOSES}
          scoreFn={scoreMSD}
          onSelect={onMsdSelect}
        />
      </label>
      <label class="field-label">
        Diagnosis Details / Free-Text
        <input
          type="text"
          value={field('ptDiagnosis')}
          oninput={(e) => onInput('ptDiagnosis', e)}
          placeholder="Additional details, differential diagnoses, or free-text diagnosis"
        />
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- Prognosis -->
  {#if isSubsectionVisible(noteTemplate, 'assessment', 'prognosis')}
    <CollapsibleSubsection
      title="Prognosis"
      open={openSubs.prognosis}
      onToggle={() => toggle('prognosis')}
      dataSubsection="prognosis"
    >
      <div class="field-row">
        <label class="field-label field-label--select">
          Rating
          <select value={field('prognosis')} onchange={(e) => onInput('prognosis', e)}>
            <option value="">Select...</option>
            <option value="excellent">Excellent — Full recovery expected</option>
            <option value="good">Good — Significant improvement expected</option>
            <option value="fair">Fair — Moderate improvement expected</option>
            <option value="poor">Poor — Minimal improvement expected</option>
            <option value="guarded">Guarded — Uncertain outcome</option>
          </select>
        </label>
      </div>

      <GroupedToggleBoard
        label="Positive Prognostic Factors"
        helper="Select the patient strengths and case features that support recovery."
        groups={POSITIVE_FACTOR_GROUPS}
        selected={positiveFactors}
        onToggle={(factor) => toggleFactor('positive', factor)}
        selectedLabel="Recovery strengths"
        emptyLabel="No positive factors selected yet."
      />

      <GroupedToggleBoard
        label="Negative or Barrier Factors"
        helper="Select the barriers that need to be reflected in your prognosis and plan."
        groups={NEGATIVE_FACTOR_GROUPS}
        selected={negativeFactors}
        onToggle={(factor) => toggleFactor('negative', factor)}
        selectedLabel="Barriers in play"
        emptyLabel="No barrier factors selected yet."
      />

      <label class="field-label">
        Additional Prognostic Notes
        <textarea
          rows="2"
          value={field('prognosticFactors')}
          oninput={(e) => onInput('prognosticFactors', e)}
          placeholder="Additional positive/negative factors, complicating conditions, patient-specific considerations..."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- Clinical Reasoning -->
  {#if isSubsectionVisible(noteTemplate, 'assessment', 'clinical-reasoning')}
    <CollapsibleSubsection
      title="Clinical Reasoning"
      open={openSubs.reasoning}
      onToggle={() => toggle('reasoning')}
      dataSubsection="clinical-reasoning"
    >
      <div class="field-row">
        <label class="field-label field-label--select">
          Tissue Irritability
          <select
            value={field('tissueIrritability')}
            onchange={(e) => onInput('tissueIrritability', e)}
          >
            {#each TISSUE_IRRITABILITY_OPTIONS as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>
        <label class="field-label field-label--select">
          Stage of Healing
          <select value={field('stageOfHealing')} onchange={(e) => onInput('stageOfHealing', e)}>
            {#each HEALING_STAGE_OPTIONS as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>
      </div>
      <label class="field-label">
        Clinical Impression
        <span class="field-hint"
          >Movement system diagnosis, contributing factors, tissue vs. movement-based hypothesis</span
        >
        <textarea
          rows="2"
          value={field('clinicalReasoning')}
          oninput={(e) => onInput('clinicalReasoning', e)}
          placeholder="Synthesize subjective/objective findings to justify movement system diagnosis and plan of care. Address tissue irritability, stage of healing, differential reasoning."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}
</div>

<style>
  .soap-section {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .field-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .field-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.78125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #616161);
    flex: 1;
    min-width: 0;
    margin-top: 0.375rem;
  }

  .field-label--select {
    flex: 0 0 280px;
  }

  .field-hint {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #9e9e9e);
    font-weight: 400;
    font-style: italic;
  }

  /* ─── Impairment Entries ─── */

  .imp-empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .imp-entry {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 2rem 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
    margin-bottom: 0.375rem;
  }

  .imp-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .imp-field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
  }

  .imp-field--grow {
    flex: 1;
    min-width: 120px;
  }

  .imp-field--full {
    width: 100%;
  }

  .imp-remove {
    position: absolute;
    top: 0.375rem;
    right: 0.375rem;
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-500, #757575);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s;
  }

  .imp-remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .imp-add-btn {
    align-self: flex-start;
    padding: 0.3rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-700, #424242);
    cursor: pointer;
    transition: all 0.12s;
  }

  .imp-add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }
</style>
