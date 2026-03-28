<!--
  ObjectiveSection — editable objective SOAP fields.
  Integrates: SystemsReviewPanel (APTA Add/Defer cascade),
  RegionalAssessmentPicker (multi-region ROM/RIMs/MMT/Special Tests),
  NeuroscreenPanel (dermatome/myotome/reflex tables).

  Systems Review gates: when a system is set to "Add" (impaired), its
  detailed examination panel appears inline. When "Defer" or untouched,
  the panel stays hidden.
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';
  import type { ObjectiveData, VitalsEntry } from '$lib/types/sections';
  import { isGateOpen, type SystemsReviewData } from '$lib/config/systemsReview';
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import VitalsFlowsheet from './VitalsFlowsheet.svelte';
  import SystemsReviewPanel from './SystemsReviewPanel.svelte';
  import RegionalAssessmentPicker from './RegionalAssessmentPicker.svelte';
  import NeuroscreenPanel from './NeuroscreenPanel.svelte';
  import StandardizedAssessmentsPanel from './StandardizedAssessmentsPanel.svelte';
  import { normalizeStandardizedAssessments } from '$lib/config/standardizedAssessments';
  import type { AssessmentInstance } from '$lib/config/standardizedAssessments';

  const section = $derived($noteDraft.objective);

  // Collapsible subsection state
  let collapsed = $state<Record<string, boolean>>({});

  function isCollapsed(id: string): boolean {
    return collapsed[id] ?? false;
  }

  function toggleCollapse(id: string) {
    collapsed = { ...collapsed, [id]: !collapsed[id] };
  }

  function field(key: keyof ObjectiveData): string {
    const v = section[key];
    return typeof v === 'string' ? v : '';
  }

  function nestedField(parent: keyof ObjectiveData, key: string): string {
    const p = section[parent] as Record<string, string> | undefined;
    return p?.[key] ?? '';
  }

  function onInput(key: keyof ObjectiveData, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    updateField('objective', key, target.value);
  }

  function onNestedInput(parent: keyof ObjectiveData, key: string, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const current = (section[parent] as Record<string, string>) ?? {};
    updateField('objective', parent, { ...current, [key]: target.value });
  }

  // ─── Vitals Flowsheet (multi-measurement) ───

  function genVitalsId(): string {
    return `vs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const vitalsSeries = $derived.by((): VitalsEntry[] => {
    const raw = section.vitalsSeries;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    // Bootstrap from legacy single-vitals data
    return [{ id: genVitalsId(), label: 'Measurement 1', time: '', vitals: {} }];
  });

  const vitalsActiveId = $derived.by((): string => {
    const id = section.vitalsActiveId;
    if (id && vitalsSeries.some((e) => e.id === id)) return id;
    return vitalsSeries[0]?.id ?? '';
  });

  function handleVitalsUpdate(series: VitalsEntry[], activeId: string) {
    updateField('objective', 'vitalsSeries', series);
    updateField('objective', 'vitalsActiveId', activeId);
  }

  // ─── Anthropometrics (one-time, separate from flowsheet) ───

  const vitals = $derived(section.vitals ?? {});

  const anthropometrics = [
    { key: 'heightFt', label: 'Ht (ft)', placeholder: '5' },
    { key: 'heightIn', label: 'Ht (in)', placeholder: '10' },
    { key: 'weightLbs', label: 'Wt (lbs)', placeholder: '165' },
  ];

  function onVitalInput(key: string, e: Event) {
    const val = (e.target as HTMLInputElement).value;
    const updated = { ...vitals, [key]: val } as Record<string, string>;
    const ft = parseFloat(updated.heightFt || '0');
    const inches = parseFloat(updated.heightIn || '0');
    const lbs = parseFloat(updated.weightLbs || '0');
    const totalInches = ft * 12 + inches;
    if (totalInches > 0 && lbs > 0) {
      updated.bmi = ((lbs / (totalInches * totalInches)) * 703).toFixed(1);
    } else {
      updated.bmi = '';
    }
    updateField('objective', 'vitals', updated);
  }

  const computedBmi = $derived((vitals as Record<string, string>).bmi ?? '');

  // ─── Systems Review ───

  const systemsReview = $derived(section.systemsReview ?? ({} as SystemsReviewData));

  function handleSystemsUpdate(data: SystemsReviewData) {
    updateField('objective', 'systemsReview', data);
  }

  // Gate checks — determine which detailed panels to show
  const showCommunication = $derived(isGateOpen(systemsReview, 'communication'));
  const showCardiovascular = $derived(isGateOpen(systemsReview, 'cardiovascular'));
  const showIntegumentary = $derived(isGateOpen(systemsReview, 'integumentary'));

  // ─── Regional Assessments ───

  const ra = $derived(section.regionalAssessments ?? {});

  function handleRAUpdate(fieldName: string, value: unknown) {
    updateField('objective', 'regionalAssessments', { ...ra, [fieldName]: value });
  }

  // ─── Neuroscreen ───

  const neuro = $derived(
    section.neuroscreenData ?? { selectedRegions: [], dermatome: {}, myotome: {}, reflex: {} },
  );

  function handleNeuroUpdate(fieldName: string, value: unknown) {
    updateField('objective', 'neuroscreenData', { ...neuro, [fieldName]: value });
  }

  // ─── Standardized Assessments ───

  const standardizedAssessments = $derived(
    normalizeStandardizedAssessments(section.standardizedAssessments ?? []),
  );

  function handleAssessmentsChange(updated: AssessmentInstance[]) {
    updateField('objective', 'standardizedAssessments', normalizeStandardizedAssessments(updated));
  }
</script>

<div class="soap-section soap-objective">
  <!-- 1. VITAL SIGNS (multi-measurement flowsheet) -->
  <CollapsibleSubsection
    title="Vital Signs"
    open={!isCollapsed('vital-signs')}
    onToggle={() => toggleCollapse('vital-signs')}
    dataSubsection="vital-signs"
  >
    <VitalsFlowsheet
      series={vitalsSeries}
      activeId={vitalsActiveId}
      onUpdate={handleVitalsUpdate}
    />

    <div class="vitals-divider"></div>
    <div class="anthropometrics-label">Anthropometrics</div>
    <div class="vitals-grid">
      {#each anthropometrics as v}
        <label class="field-label field-label--compact">
          {v.label}
          <input
            type="text"
            value={(vitals as Record<string, string>)[v.key] ?? ''}
            oninput={(e) => onVitalInput(v.key, e)}
            placeholder={v.placeholder}
          />
        </label>
      {/each}
      <label class="field-label field-label--compact field-label--readonly">
        BMI
        <input type="text" value={computedBmi} readonly tabindex="-1" placeholder="auto" />
      </label>
    </div>
  </CollapsibleSubsection>

  <!-- 2. SYSTEMS REVIEW (APTA Add/Defer Cascade) -->
  <CollapsibleSubsection
    title="Systems Review"
    open={!isCollapsed('systems-review')}
    onToggle={() => toggleCollapse('systems-review')}
    dataSubsection="systems-review"
  >
    <SystemsReviewPanel data={systemsReview} onUpdate={handleSystemsUpdate} />
  </CollapsibleSubsection>

  <!-- 3. INSPECTION & PALPATION -->
  <CollapsibleSubsection
    title="Inspection &amp; Palpation"
    open={!isCollapsed('inspection-palpation')}
    onToggle={() => toggleCollapse('inspection-palpation')}
    dataSubsection="inspection-palpation"
  >
    <label class="field-label">
      General Observation
      <textarea
        rows="3"
        value={field('text')}
        oninput={(e) => onInput('text', e)}
        placeholder="General observations: posture, gait deviations, movement quality, willingness to move, use of assistive devices"
      ></textarea>
    </label>
    <label class="field-label">
      Visual Inspection
      <textarea
        rows="2"
        value={nestedField('inspection', 'visual')}
        oninput={(e) => onNestedInput('inspection', 'visual', e)}
        placeholder="Posture, symmetry, swelling, deformity, skin..."
      ></textarea>
    </label>
    <label class="field-label">
      Palpation Findings
      <textarea
        rows="2"
        value={nestedField('palpation', 'findings')}
        oninput={(e) => onNestedInput('palpation', 'findings', e)}
        placeholder="Tenderness, trigger points, tissue quality..."
      ></textarea>
    </label>
  </CollapsibleSubsection>

  <!-- 3b. COMMUNICATION / COGNITION (gated by Systems Review) -->
  {#if showCommunication}
    <CollapsibleSubsection
      title="Communication / Cognition"
      open={!isCollapsed('communication')}
      onToggle={() => toggleCollapse('communication')}
      dataSubsection="communication-cognition"
    >
      <div class="gated-hint">Opened via Systems Review → Communication / Cognition → Add</div>
      <label class="field-label">
        Orientation
        <textarea
          rows="2"
          value={field('orientation')}
          oninput={(e) => onInput('orientation', e)}
          placeholder="Oriented to person, place, time, situation (×4)..."
        ></textarea>
      </label>
      <label class="field-label">
        Memory &amp; Attention
        <textarea
          rows="2"
          value={field('memoryAttention')}
          oninput={(e) => onInput('memoryAttention', e)}
          placeholder="Short-term recall, attention span, ability to follow multi-step commands..."
        ></textarea>
      </label>
      <label class="field-label">
        Safety Awareness
        <textarea
          rows="2"
          value={field('safetyAwareness')}
          oninput={(e) => onInput('safetyAwareness', e)}
          placeholder="Awareness of limitations, judgment, impulsivity, fall risk behaviors..."
        ></textarea>
      </label>
      <label class="field-label">
        Vision / Perception
        <textarea
          rows="2"
          value={field('visionPerception')}
          oninput={(e) => onInput('visionPerception', e)}
          placeholder="Visual acuity, neglect, spatial awareness, depth perception..."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- 3c. CARDIOVASCULAR / PULMONARY (gated by Systems Review) -->
  {#if showCardiovascular}
    <CollapsibleSubsection
      title="Cardiovascular / Pulmonary"
      open={!isCollapsed('cardiovascular')}
      onToggle={() => toggleCollapse('cardiovascular')}
      dataSubsection="cardiovascular-pulmonary"
    >
      <div class="gated-hint">Opened via Systems Review → Cardiovascular / Pulmonary → Add</div>
      <label class="field-label">
        Auscultation
        <textarea
          rows="2"
          value={field('auscultation')}
          oninput={(e) => onInput('auscultation', e)}
          placeholder="Heart sounds (S1/S2, murmurs, gallops), lung sounds (clear, crackles, wheezes)..."
        ></textarea>
      </label>
      <label class="field-label">
        Edema
        <textarea
          rows="2"
          value={field('edema')}
          oninput={(e) => onInput('edema', e)}
          placeholder="Location, severity (trace/1+/2+/3+/4+), pitting vs. non-pitting, circumference..."
        ></textarea>
      </label>
      <label class="field-label">
        Endurance
        <textarea
          rows="2"
          value={field('endurance')}
          oninput={(e) => onInput('endurance', e)}
          placeholder="6MWT/2MWT distance, perceived exertion (RPE), HR recovery, desaturation..."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- 3d. INTEGUMENTARY (gated by Systems Review) -->
  {#if showIntegumentary}
    <CollapsibleSubsection
      title="Integumentary"
      open={!isCollapsed('integumentary')}
      onToggle={() => toggleCollapse('integumentary')}
      dataSubsection="integumentary"
    >
      <div class="gated-hint">Opened via Systems Review → Integumentary → Add</div>
      <label class="field-label">
        Skin Integrity
        <textarea
          rows="3"
          value={field('skinIntegrity')}
          oninput={(e) => onInput('skinIntegrity', e)}
          placeholder="Wound location, size (L×W×D), stage, drainage, wound bed, periwound, surgical incision status..."
        ></textarea>
      </label>
      <label class="field-label">
        Color &amp; Temperature
        <textarea
          rows="2"
          value={field('colorTemp')}
          oninput={(e) => onInput('colorTemp', e)}
          placeholder="Skin color (erythema, pallor, cyanosis), temperature (warm, cool), turgor..."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- 4. MUSCULOSKELETAL (Region-based ROM/RIMs/MMT/Special Tests) -->
  <CollapsibleSubsection
    title="Musculoskeletal"
    open={!isCollapsed('musculoskeletal')}
    onToggle={() => toggleCollapse('musculoskeletal')}
    dataSubsection="musculoskeletal"
  >
    <RegionalAssessmentPicker
      selectedRegions={ra.selectedRegions ?? []}
      arom={ra.arom ?? {}}
      prom={ra.prom ?? {}}
      rims={ra.rims ?? {}}
      mmt={ra.mmt ?? {}}
      specialTests={ra.specialTests ?? {}}
      mmtCustomRows={ra.mmtCustomRows ?? {}}
      onUpdate={handleRAUpdate}
    />
  </CollapsibleSubsection>

  <!-- 5. NEUROMUSCULAR (Neuroscreen + supplemental fields) -->
  <CollapsibleSubsection
    title="Neuromuscular"
    open={!isCollapsed('neuromuscular')}
    onToggle={() => toggleCollapse('neuromuscular')}
    dataSubsection="neuromuscular"
  >
    <NeuroscreenPanel
      selectedRegions={neuro.selectedRegions ?? []}
      dermatome={neuro.dermatome ?? {}}
      myotome={neuro.myotome ?? {}}
      reflex={neuro.reflex ?? {}}
      onUpdate={handleNeuroUpdate}
    />
    <div class="supplemental-fields">
      <label class="field-label">
        Tone
        <textarea
          rows="2"
          value={field('tone')}
          oninput={(e) => onInput('tone', e)}
          placeholder="Muscle tone assessment (hyper/hypotonia, spasticity, Modified Ashworth Scale)..."
        ></textarea>
      </label>
      <label class="field-label">
        Coordination
        <textarea
          rows="2"
          value={field('coordination')}
          oninput={(e) => onInput('coordination', e)}
          placeholder="Finger-to-nose, heel-to-shin, rapid alternating movements, dysmetria..."
        ></textarea>
      </label>
      <label class="field-label">
        Balance
        <textarea
          rows="2"
          value={field('balance')}
          oninput={(e) => onInput('balance', e)}
          placeholder="Static/dynamic balance, Romberg, single-leg stance, tandem stance..."
        ></textarea>
      </label>
      <label class="field-label">
        Cranial Nerves
        <textarea
          rows="2"
          value={nestedField('neuro', 'cranialNerves')}
          oninput={(e) => onNestedInput('neuro', 'cranialNerves', e)}
          placeholder="CN I–XII screening (intact/impaired). Note specific deficits..."
        ></textarea>
      </label>
      <label class="field-label">
        Functional Assessment
        <textarea
          rows="2"
          value={nestedField('functional', 'assessment')}
          oninput={(e) => onNestedInput('functional', 'assessment', e)}
          placeholder="Gait pattern, assistive devices, transfers, bed mobility, functional tasks..."
        ></textarea>
      </label>
    </div>
  </CollapsibleSubsection>

  <!-- 6. STANDARDIZED FUNCTIONAL ASSESSMENTS -->
  <CollapsibleSubsection
    title="Standardized Functional Assessments"
    open={!isCollapsed('standardized-assessments')}
    onToggle={() => toggleCollapse('standardized-assessments')}
    dataSubsection="standardized-assessments"
  >
    <StandardizedAssessmentsPanel
      assessments={standardizedAssessments}
      onchange={handleAssessmentsChange}
    />
  </CollapsibleSubsection>

  <!-- 7. TREATMENT PERFORMED -->
  <CollapsibleSubsection
    title="Treatment Performed"
    open={!isCollapsed('treatment-performed')}
    onToggle={() => toggleCollapse('treatment-performed')}
    dataSubsection="treatment-performed"
  >
    <textarea
      rows="4"
      value={field('treatmentPerformed')}
      oninput={(e) => onInput('treatmentPerformed', e)}
      placeholder="Interventions performed this session, parameters (sets/reps/duration), and patient response (tolerance, pain, functional change)"
    ></textarea>
  </CollapsibleSubsection>
</div>

<style>
  .soap-section {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .field-label {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #616161);
    flex: 1;
    min-width: 0;
    margin-top: 0.5rem;
  }

  .field-label--compact {
    flex: 0 0 auto;
    min-width: 80px;
    margin-top: 0;
  }

  .field-label--readonly input {
    background: var(--color-neutral-50, #fafafa);
    color: var(--color-neutral-500, #737373);
    font-weight: 600;
    cursor: default;
  }

  .vitals-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
  }

  .vitals-grid .field-label--compact {
    min-width: 70px;
    max-width: 100px;
  }

  .vitals-grid .field-label--compact input {
    text-align: center;
  }

  .vitals-divider {
    height: 1px;
    background: var(--color-neutral-200, #e0e0e0);
    margin: 0.75rem 0;
  }

  .anthropometrics-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-neutral-500, #757575);
    margin-bottom: 0.5rem;
  }

  .supplemental-fields {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .gated-hint {
    font-size: 0.6875rem;
    color: var(--color-neutral-400, #a3a3a3);
    font-style: italic;
    margin-bottom: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 154, 68, 0.04);
    border-radius: 4px;
    border-left: 3px solid var(--color-brand-green, #009a44);
  }
</style>
