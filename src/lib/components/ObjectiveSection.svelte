<!--
  ObjectiveSection — editable objective SOAP fields.
  Integrates: SystemToggleBar (inline Add/Defer per subsection),
  RegionalAssessmentPicker (multi-region ROM/RIMs/MMT/Special Tests),
  NeuroscreenPanel (dermatome/myotome/reflex tables).

  Each subsection that maps to an APTA system has an inline Add/Defer toggle
  at the top. When "Add" is selected, the exam fields appear below the toggle.
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';
  import type {
    ObjectiveData,
    VitalsEntry,
    OrientationData,
    EdemaEntry,
    InterventionEntry,
    LungAuscultationData,
    RespiratoryPatternData,
    ToneEntry,
    PostureData,
    GaitAssessmentData,
    FunctionalMobilityEntry,
    WoundEntry,
    PalpationFinding,
    ProprioceptionEntry,
    SensationEntry,
    CircumferentialEntry,
  } from '$lib/types/sections';
  import {
    isGateOpen,
    createDefaultSystemsReview,
    type SystemsReviewData,
  } from '$lib/config/systemsReview';
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import VitalsFlowsheet from './VitalsFlowsheet.svelte';
  import SystemToggleBar from './SystemToggleBar.svelte';
  import OrientationGrid from './inputs/OrientationGrid.svelte';
  import EdemaAssessment from './inputs/EdemaAssessment.svelte';
  import RegionalAssessmentPicker from './RegionalAssessmentPicker.svelte';
  import NeuroscreenPanel from './NeuroscreenPanel.svelte';
  import StandardizedAssessmentsPanel from './StandardizedAssessmentsPanel.svelte';
  import { normalizeStandardizedAssessments } from '$lib/config/standardizedAssessments';
  import type { AssessmentInstance } from '$lib/config/standardizedAssessments';
  import InterventionLog from './inputs/InterventionLog.svelte';
  import RespiratoryAssessment from './inputs/RespiratoryAssessment.svelte';
  import PostureAssessment from './inputs/PostureAssessment.svelte';
  import ToneAssessment from './inputs/ToneAssessment.svelte';
  import GaitAssessment from './inputs/GaitAssessment.svelte';
  import FunctionalMobilityLog from './inputs/FunctionalMobilityLog.svelte';
  import WoundAssessment from './inputs/WoundAssessment.svelte';
  import CircumferentialMeasurements from './inputs/CircumferentialMeasurements.svelte';
  import { useNoteTemplate, isSubsectionVisible } from '$lib/config/templates';

  const noteTemplate = useNoteTemplate();

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

  const systemsReview = $derived(
    Object.keys(section.systemsReview ?? {}).length > 0
      ? section.systemsReview!
      : createDefaultSystemsReview(),
  );

  function handleSystemsUpdate(data: SystemsReviewData) {
    updateField('objective', 'systemsReview', data);
  }

  // Gate checks — determine which detailed panels to show
  const showCommunication = $derived(isGateOpen(systemsReview, 'communication'));
  const showCardiovascular = $derived(isGateOpen(systemsReview, 'cardiovascular'));
  const showIntegumentary = $derived(isGateOpen(systemsReview, 'integumentary'));

  // ─── Orientation (structured grid with legacy string migration) ───

  const DEFAULT_ORIENTATION: OrientationData = {
    person: '',
    place: '',
    time: '',
    situation: '',
    notes: '',
  };

  const orientationData = $derived.by((): OrientationData => {
    const raw = section.orientation;
    if (!raw) return DEFAULT_ORIENTATION;
    // Legacy string migration — move old free-text into notes
    if (typeof raw === 'string') return { ...DEFAULT_ORIENTATION, notes: raw };
    return { ...DEFAULT_ORIENTATION, ...raw };
  });

  function handleOrientationUpdate(data: OrientationData) {
    updateField('objective', 'orientation', data);
  }

  // ─── Edema (structured entries with legacy string migration) ───

  const edemaEntries = $derived.by((): EdemaEntry[] => {
    if (Array.isArray(section.edemaAssessments) && section.edemaAssessments.length > 0) {
      return section.edemaAssessments;
    }
    // Migrate legacy free-text into a single entry's notes
    const legacy = section.edema;
    if (typeof legacy === 'string' && legacy.trim()) {
      return [
        {
          id: 'migrated',
          location: '',
          locationOther: '',
          grade: '',
          type: '',
          circumference: '',
          landmark: '',
          notes: legacy,
        },
      ];
    }
    return [];
  });

  function handleEdemaUpdate(entries: EdemaEntry[]) {
    updateField('objective', 'edemaAssessments', entries);
    // Clear legacy field when structured data is written
    if (section.edema) updateField('objective', 'edema', '');
  }

  // ─── Circumferential Measurements ───

  const circumferentialEntries = $derived.by((): CircumferentialEntry[] => {
    if (
      Array.isArray(section.circumferentialMeasurements) &&
      section.circumferentialMeasurements.length > 0
    ) {
      return section.circumferentialMeasurements;
    }
    return [];
  });

  function handleCircumferentialUpdate(entries: CircumferentialEntry[]) {
    updateField('objective', 'circumferentialMeasurements', entries);
  }

  // ─── Respiratory / Auscultation (structured, with legacy migration) ───

  const heartSounds = $derived(field('heartSounds'));
  const lungAuscultation = $derived((section.lungAuscultation ?? {}) as LungAuscultationData);
  const respiratoryPattern = $derived((section.respiratoryPattern ?? {}) as RespiratoryPatternData);
  const legacyAuscultation = $derived(field('auscultation'));

  function handleHeartSoundsChange(value: string) {
    updateField('objective', 'heartSounds', value);
    if (section.auscultation) updateField('objective', 'auscultation', '');
  }

  function handleLungChange(data: LungAuscultationData) {
    updateField('objective', 'lungAuscultation', data);
    if (section.auscultation) updateField('objective', 'auscultation', '');
  }

  function handleRespPatternChange(data: RespiratoryPatternData) {
    updateField('objective', 'respiratoryPattern', data);
  }

  // ─── Posture Assessment ───

  const postureData = $derived((section.postureAssessment ?? {}) as PostureData);

  function handlePostureUpdate(data: PostureData) {
    updateField('objective', 'postureAssessment', data);
  }

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

  // ─── Tone Assessment (structured MAS with legacy string migration) ───

  const toneEntries = $derived.by((): ToneEntry[] => {
    if (Array.isArray(section.toneAssessments) && section.toneAssessments.length > 0) {
      return section.toneAssessments;
    }
    const legacy = section.tone;
    if (typeof legacy === 'string' && legacy.trim()) {
      return [
        {
          id: 'migrated',
          muscleGroup: '',
          side: '',
          masGrade: '',
          notes: legacy,
        },
      ];
    }
    return [];
  });

  function handleToneUpdate(entries: ToneEntry[]) {
    updateField('objective', 'toneAssessments', entries);
    if (section.tone) updateField('objective', 'tone', '');
  }

  // ─── Gait Assessment (structured, with legacy migration from functional.assessment) ───

  const DEFAULT_GAIT: GaitAssessmentData = {};

  const gaitData = $derived.by((): GaitAssessmentData => {
    if (section.gaitAssessment && Object.keys(section.gaitAssessment).length > 0) {
      return section.gaitAssessment;
    }
    // Migrate legacy free-text from functional.assessment into notes
    const legacy = (section.functional as Record<string, string> | undefined)?.assessment;
    if (typeof legacy === 'string' && legacy.trim()) {
      return { ...DEFAULT_GAIT, notes: legacy };
    }
    return DEFAULT_GAIT;
  });

  function handleGaitUpdate(data: GaitAssessmentData) {
    updateField('objective', 'gaitAssessment', data);
    // Clear legacy functional.assessment on first structured write
    const legacyFunc = section.functional as Record<string, string> | undefined;
    if (legacyFunc?.assessment) {
      updateField('objective', 'functional', { ...legacyFunc, assessment: '' });
    }
  }

  // ─── Functional Mobility (structured repeatable entries) ───

  const functionalMobilityEntries = $derived.by((): FunctionalMobilityEntry[] => {
    if (Array.isArray(section.functionalMobility) && section.functionalMobility.length > 0) {
      return section.functionalMobility;
    }
    return [];
  });

  function handleFunctionalMobilityUpdate(entries: FunctionalMobilityEntry[]) {
    updateField('objective', 'functionalMobility', entries);
  }

  // ─── Wound Assessment (structured, with legacy migration from skinIntegrity) ───

  const woundEntries = $derived.by((): WoundEntry[] => {
    if (Array.isArray(section.woundAssessments) && section.woundAssessments.length > 0) {
      return section.woundAssessments;
    }
    const legacy = section.skinIntegrity;
    if (typeof legacy === 'string' && legacy.trim()) {
      return [
        {
          id: 'migrated',
          location: '',
          type: '',
          stage: '',
          length: '',
          width: '',
          depth: '',
          undermining: '',
          tunneling: '',
          woundBedGranulation: '',
          woundBedSlough: '',
          woundBedEschar: '',
          woundBedEpithelial: '',
          exudateAmount: '',
          exudateType: '',
          odor: '',
          periwound: '',
          woundEdges: '',
          notes: legacy,
        },
      ];
    }
    return [];
  });

  function handleWoundUpdate(entries: WoundEntry[]) {
    updateField('objective', 'woundAssessments', entries);
    if (section.skinIntegrity) updateField('objective', 'skinIntegrity', '');
  }

  // ─── Palpation (structured findings with legacy migration) ───

  function genPalpId(): string {
    return `palp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const palpationEntries = $derived.by((): PalpationFinding[] => {
    if (Array.isArray(section.palpationFindings) && section.palpationFindings.length > 0) {
      return section.palpationFindings;
    }
    const legacy = (section.palpation as Record<string, string> | undefined)?.findings;
    if (typeof legacy === 'string' && legacy.trim()) {
      return [{ id: 'migrated', location: '', finding: '', notes: legacy }];
    }
    return [];
  });

  function handlePalpationUpdate(entries: PalpationFinding[]) {
    updateField('objective', 'palpationFindings', entries);
    const legacyPalp = section.palpation as Record<string, string> | undefined;
    if (legacyPalp?.findings) {
      updateField('objective', 'palpation', { ...legacyPalp, findings: '' });
    }
  }

  function addPalpation() {
    handlePalpationUpdate([
      ...palpationEntries,
      { id: genPalpId(), location: '', finding: '', notes: '' },
    ]);
  }

  function removePalpation(id: string) {
    handlePalpationUpdate(palpationEntries.filter((e) => e.id !== id));
  }

  function updatePalpation(id: string, field_: keyof PalpationFinding, value: string) {
    handlePalpationUpdate(
      palpationEntries.map((e) => (e.id === id ? { ...e, [field_]: value } : e)),
    );
  }

  // ─── Proprioception (structured entries) ───

  function genPropId(): string {
    return `prop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const proprioceptionEntries = $derived.by((): ProprioceptionEntry[] => {
    if (Array.isArray(section.proprioception) && section.proprioception.length > 0) {
      return section.proprioception;
    }
    return [];
  });

  function handleProprioceptionUpdate(entries: ProprioceptionEntry[]) {
    updateField('objective', 'proprioception', entries);
  }

  function addProprioception() {
    handleProprioceptionUpdate([
      ...proprioceptionEntries,
      { id: genPropId(), joint: '', side: '', status: '', method: '' },
    ]);
  }

  function removeProprioception(id: string) {
    handleProprioceptionUpdate(proprioceptionEntries.filter((e) => e.id !== id));
  }

  function updateProprioceptionField(id: string, field_: keyof ProprioceptionEntry, value: string) {
    handleProprioceptionUpdate(
      proprioceptionEntries.map((e) => (e.id === id ? { ...e, [field_]: value } : e)),
    );
  }

  // ─── Sensation Advanced (structured entries) ───

  function genSensId(): string {
    return `sens-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const sensationEntries = $derived.by((): SensationEntry[] => {
    if (Array.isArray(section.sensationAdvanced) && section.sensationAdvanced.length > 0) {
      return section.sensationAdvanced;
    }
    return [];
  });

  function handleSensationUpdate(entries: SensationEntry[]) {
    updateField('objective', 'sensationAdvanced', entries);
  }

  function addSensation() {
    handleSensationUpdate([
      ...sensationEntries,
      { id: genSensId(), modality: '', location: '', status: '', notes: '' },
    ]);
  }

  function removeSensation(id: string) {
    handleSensationUpdate(sensationEntries.filter((e) => e.id !== id));
  }

  function updateSensationField(id: string, field_: keyof SensationEntry, value: string) {
    handleSensationUpdate(
      sensationEntries.map((e) => (e.id === id ? { ...e, [field_]: value } : e)),
    );
  }

  // ─── Standardized Assessments ───

  const standardizedAssessments = $derived(
    normalizeStandardizedAssessments(section.standardizedAssessments ?? []),
  );

  function handleAssessmentsChange(updated: AssessmentInstance[]) {
    updateField('objective', 'standardizedAssessments', normalizeStandardizedAssessments(updated));
  }

  // ─── Interventions (structured log with legacy string migration) ───

  const interventionEntries = $derived.by((): InterventionEntry[] => {
    if (Array.isArray(section.interventions) && section.interventions.length > 0) {
      return section.interventions;
    }
    // Migrate legacy free-text into a single entry's description
    const legacy = section.treatmentPerformed;
    if (typeof legacy === 'string' && legacy.trim()) {
      return [
        {
          id: 'migrated',
          category: '',
          type: '',
          description: legacy,
          sets: '',
          reps: '',
          duration: '',
          intensity: '',
          timeMinutes: '',
          patientResponse: '',
          notes: '',
        },
      ];
    }
    return [];
  });

  function handleInterventionsUpdate(entries: InterventionEntry[]) {
    updateField('objective', 'interventions', entries);
    // Clear legacy field when structured data is written
    if (section.treatmentPerformed) updateField('objective', 'treatmentPerformed', '');
  }
</script>

<div class="soap-section soap-objective">
  <!-- 1. VITAL SIGNS (multi-measurement flowsheet) -->
  {#if isSubsectionVisible(noteTemplate, 'objective', 'vital-signs')}
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
  {/if}

  <!-- 2. INSPECTION & PALPATION -->
  {#if isSubsectionVisible(noteTemplate, 'objective', 'inspection-palpation')}
    <CollapsibleSubsection
      title="Inspection &amp; Palpation"
      open={!isCollapsed('inspection-palpation')}
      onToggle={() => toggleCollapse('inspection-palpation')}
      dataSubsection="inspection-palpation"
    >
      <label class="field-label">
        Observation
        <textarea
          rows="2"
          value={field('observation') || field('text')}
          oninput={(e) => {
            updateField('objective', 'observation', (e.target as HTMLTextAreaElement).value);
            if (section.text) updateField('objective', 'text', '');
          }}
          placeholder="General observations: posture, movement quality, willingness to move, assistive devices, affect, guarding..."
        ></textarea>
      </label>
      <label class="field-label">
        Inspection Findings
        <textarea
          rows="2"
          value={nestedField('inspection', 'visual')}
          oninput={(e) => onNestedInput('inspection', 'visual', e)}
          placeholder="Symmetry, swelling, deformity, skin changes, scars, atrophy, discoloration..."
        ></textarea>
      </label>
      <div class="field-label">
        Palpation Findings
        {#if palpationEntries.length === 0}
          <div class="palp-empty">
            No palpation findings documented.
            <button type="button" class="palp-add-btn" onclick={addPalpation}>Add Finding</button>
          </div>
        {:else}
          {#each palpationEntries as entry (entry.id)}
            <div class="palp-entry">
              <div class="palp-row">
                <label class="palp-field palp-field--grow">
                  Location
                  <input
                    type="text"
                    class="palp-input"
                    value={entry.location}
                    placeholder="e.g. L paraspinals T10-L2"
                    oninput={(e) =>
                      updatePalpation(entry.id, 'location', (e.target as HTMLInputElement).value)}
                  />
                </label>
                <label class="palp-field palp-field--grow">
                  Finding
                  <select
                    class="palp-select"
                    value={entry.finding}
                    onchange={(e) =>
                      updatePalpation(entry.id, 'finding', (e.target as HTMLSelectElement).value)}
                  >
                    <option value="">Select...</option>
                    <option value="tenderness">Tenderness</option>
                    <option value="trigger-point">Trigger Point</option>
                    <option value="spasm">Spasm</option>
                    <option value="guarding">Guarding</option>
                    <option value="crepitus">Crepitus</option>
                    <option value="warmth">Warmth</option>
                    <option value="swelling">Swelling</option>
                    <option value="induration">Induration</option>
                    <option value="hypomobility">Hypomobility</option>
                    <option value="hypermobility">Hypermobility</option>
                    <option value="normal">Normal</option>
                  </select>
                </label>
                <button
                  type="button"
                  class="palp-remove"
                  onclick={() => removePalpation(entry.id)}
                  aria-label="Remove finding">&times;</button
                >
              </div>
              <label class="palp-field palp-field--full">
                Notes
                <input
                  type="text"
                  class="palp-input"
                  value={entry.notes}
                  placeholder="Severity, reproduction of symptoms, tissue quality..."
                  oninput={(e) =>
                    updatePalpation(entry.id, 'notes', (e.target as HTMLInputElement).value)}
                />
              </label>
            </div>
          {/each}
          <button type="button" class="palp-add-btn" onclick={addPalpation}>+ Add Finding</button>
        {/if}
      </div>
    </CollapsibleSubsection>
  {/if}

  <!-- 3. COMMUNICATION / COGNITION -->
  {#if isSubsectionVisible(noteTemplate, 'objective', 'communication-cognition')}
    <CollapsibleSubsection
      title="Communication / Cognition"
      open={!isCollapsed('communication')}
      onToggle={() => toggleCollapse('communication')}
      dataSubsection="communication-cognition"
    >
      <SystemToggleBar
        systemId="communication"
        data={systemsReview}
        onUpdate={handleSystemsUpdate}
      />
      {#if showCommunication}
        <label class="field-label">
          Arousal Level
          <select
            class="obj-select"
            value={field('arousalLevel')}
            onchange={(e) =>
              updateField('objective', 'arousalLevel', (e.target as HTMLSelectElement).value)}
          >
            <option value="">Select...</option>
            <option value="alert">Alert</option>
            <option value="lethargic">Lethargic</option>
            <option value="obtunded">Obtunded</option>
            <option value="stuporous">Stuporous</option>
            <option value="comatose">Comatose</option>
          </select>
        </label>
        {#if field('arousalLevel') && field('arousalLevel') !== 'alert'}
          <div class="arousal-notice">
            Patient arousal is <strong>{field('arousalLevel')}</strong> — orientation assessment may be
            unreliable or deferred.
          </div>
        {/if}
        <OrientationGrid data={orientationData} onUpdate={handleOrientationUpdate} />
        <div class="obj-inline-row">
          <label class="field-label">
            Hearing
            <select
              class="obj-select"
              value={field('hearingStatus')}
              onchange={(e) =>
                updateField('objective', 'hearingStatus', (e.target as HTMLSelectElement).value)}
            >
              <option value="">Select...</option>
              <option value="normal">Normal</option>
              <option value="impaired-l">Impaired — Left</option>
              <option value="impaired-r">Impaired — Right</option>
              <option value="impaired-bilateral">Impaired — Bilateral</option>
              <option value="hearing-aid">Hearing Aid</option>
              <option value="deaf">Deaf</option>
            </select>
          </label>
          <label class="field-label">
            Speech
            <select
              class="obj-select"
              value={field('speechStatus')}
              onchange={(e) =>
                updateField('objective', 'speechStatus', (e.target as HTMLSelectElement).value)}
            >
              <option value="">Select...</option>
              <option value="clear">Clear</option>
              <option value="dysarthric">Dysarthric</option>
              <option value="aphasic-expressive">Aphasic — Expressive</option>
              <option value="aphasic-receptive">Aphasic — Receptive</option>
              <option value="aphasic-global">Aphasic — Global</option>
              <option value="non-verbal">Non-verbal</option>
            </select>
          </label>
        </div>
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
      {/if}
    </CollapsibleSubsection>
  {/if}

  <!-- 4. CARDIOVASCULAR / PULMONARY -->
  {#if isSubsectionVisible(noteTemplate, 'objective', 'cardiovascular-pulmonary')}
    <CollapsibleSubsection
      title="Cardiovascular / Pulmonary"
      open={!isCollapsed('cardiovascular')}
      onToggle={() => toggleCollapse('cardiovascular')}
      dataSubsection="cardiovascular-pulmonary"
    >
      <SystemToggleBar
        systemId="cardiovascular"
        data={systemsReview}
        onUpdate={handleSystemsUpdate}
      />
      {#if showCardiovascular}
        <RespiratoryAssessment
          {heartSounds}
          {lungAuscultation}
          {respiratoryPattern}
          {legacyAuscultation}
          onHeartSoundsChange={handleHeartSoundsChange}
          onLungChange={handleLungChange}
          onRespPatternChange={handleRespPatternChange}
        />
        <div class="field-label">
          Edema
          <EdemaAssessment entries={edemaEntries} onUpdate={handleEdemaUpdate} />
        </div>
        <div class="field-label">
          Circumferential Measurements
          <CircumferentialMeasurements
            entries={circumferentialEntries}
            onUpdate={handleCircumferentialUpdate}
          />
        </div>
        <label class="field-label">
          Endurance
          <textarea
            rows="2"
            value={field('endurance')}
            oninput={(e) => onInput('endurance', e)}
            placeholder="6MWT/2MWT distance, perceived exertion (RPE), HR recovery, desaturation..."
          ></textarea>
        </label>
      {/if}
    </CollapsibleSubsection>
  {/if}

  <!-- 5. INTEGUMENTARY -->
  {#if isSubsectionVisible(noteTemplate, 'objective', 'integumentary')}
    <CollapsibleSubsection
      title="Integumentary"
      open={!isCollapsed('integumentary')}
      onToggle={() => toggleCollapse('integumentary')}
      dataSubsection="integumentary"
    >
      <SystemToggleBar
        systemId="integumentary"
        data={systemsReview}
        onUpdate={handleSystemsUpdate}
      />
      {#if showIntegumentary}
        <div class="field-label">
          Wound / Skin Integrity
          <WoundAssessment entries={woundEntries} onUpdate={handleWoundUpdate} />
        </div>
        <label class="field-label">
          Color &amp; Temperature
          <textarea
            rows="2"
            value={field('colorTemp')}
            oninput={(e) => onInput('colorTemp', e)}
            placeholder="Skin color (erythema, pallor, cyanosis), temperature (warm, cool), turgor..."
          ></textarea>
        </label>
      {/if}
    </CollapsibleSubsection>
  {/if}

  <!-- 7. MUSCULOSKELETAL (Region-based ROM/RIMs/MMT/Special Tests) -->
  {#if isSubsectionVisible(noteTemplate, 'objective', 'musculoskeletal')}
    <CollapsibleSubsection
      title="Musculoskeletal"
      open={!isCollapsed('musculoskeletal')}
      onToggle={() => toggleCollapse('musculoskeletal')}
      dataSubsection="musculoskeletal"
    >
      <SystemToggleBar
        systemId="musculoskeletal"
        data={systemsReview}
        onUpdate={handleSystemsUpdate}
      />
      {#if isGateOpen(systemsReview, 'musculoskeletal')}
        <PostureAssessment data={postureData} onUpdate={handlePostureUpdate} />
        <RegionalAssessmentPicker
          selectedRegions={ra.selectedRegions ?? []}
          arom={ra.arom ?? {}}
          prom={ra.prom ?? {}}
          rims={ra.rims ?? {}}
          endFeel={ra.endFeel ?? {}}
          mmt={ra.mmt ?? {}}
          specialTests={ra.specialTests ?? {}}
          mmtCustomRows={ra.mmtCustomRows ?? {}}
          onUpdate={handleRAUpdate}
        />
      {/if}
    </CollapsibleSubsection>
  {/if}

  <!-- 8. NEUROMUSCULAR (Neuroscreen + supplemental fields) -->
  {#if isSubsectionVisible(noteTemplate, 'objective', 'neuromuscular')}
    <CollapsibleSubsection
      title="Neuromuscular"
      open={!isCollapsed('neuromuscular')}
      onToggle={() => toggleCollapse('neuromuscular')}
      dataSubsection="neuromuscular"
    >
      <SystemToggleBar
        systemId="neuromuscular"
        data={systemsReview}
        onUpdate={handleSystemsUpdate}
      />
      {#if isGateOpen(systemsReview, 'neuromuscular')}
        <NeuroscreenPanel
          selectedRegions={neuro.selectedRegions ?? []}
          dermatome={neuro.dermatome ?? {}}
          myotome={neuro.myotome ?? {}}
          reflex={neuro.reflex ?? {}}
          onUpdate={handleNeuroUpdate}
        />
        <div class="supplemental-fields">
          <div class="field-label">
            Tone (Modified Ashworth Scale)
            <ToneAssessment entries={toneEntries} onUpdate={handleToneUpdate} />
          </div>
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
          <div class="field-label">
            Proprioception
            {#if proprioceptionEntries.length === 0}
              <div class="palp-empty">
                No proprioception tested.
                <button type="button" class="palp-add-btn" onclick={addProprioception}
                  >Add Test</button
                >
              </div>
            {:else}
              {#each proprioceptionEntries as entry (entry.id)}
                <div class="palp-entry">
                  <div class="palp-row">
                    <label class="palp-field palp-field--grow">
                      Joint
                      <input
                        type="text"
                        class="palp-input"
                        value={entry.joint}
                        placeholder="e.g. Great toe, Ankle"
                        oninput={(e) =>
                          updateProprioceptionField(
                            entry.id,
                            'joint',
                            (e.target as HTMLInputElement).value,
                          )}
                      />
                    </label>
                    <label class="palp-field">
                      Side
                      <select
                        class="palp-select"
                        value={entry.side}
                        onchange={(e) =>
                          updateProprioceptionField(
                            entry.id,
                            'side',
                            (e.target as HTMLSelectElement).value,
                          )}
                      >
                        <option value="">—</option>
                        <option value="L">L</option>
                        <option value="R">R</option>
                        <option value="bilateral">Bilateral</option>
                      </select>
                    </label>
                    <label class="palp-field">
                      Status
                      <select
                        class="palp-select"
                        value={entry.status}
                        onchange={(e) =>
                          updateProprioceptionField(
                            entry.id,
                            'status',
                            (e.target as HTMLSelectElement).value,
                          )}
                      >
                        <option value="">Select...</option>
                        <option value="intact">Intact</option>
                        <option value="impaired">Impaired</option>
                        <option value="absent">Absent</option>
                      </select>
                    </label>
                    <label class="palp-field">
                      Method
                      <select
                        class="palp-select"
                        value={entry.method}
                        onchange={(e) =>
                          updateProprioceptionField(
                            entry.id,
                            'method',
                            (e.target as HTMLSelectElement).value,
                          )}
                      >
                        <option value="">Select...</option>
                        <option value="jps">Joint Position Sense</option>
                        <option value="kinesthesia">Kinesthesia</option>
                        <option value="romberg">Romberg</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      class="palp-remove"
                      onclick={() => removeProprioception(entry.id)}
                      aria-label="Remove test">&times;</button
                    >
                  </div>
                </div>
              {/each}
              <button type="button" class="palp-add-btn" onclick={addProprioception}
                >+ Add Test</button
              >
            {/if}
          </div>
          <div class="field-label">
            Sensation
            {#if sensationEntries.length === 0}
              <div class="palp-empty">
                No sensation tested.
                <button type="button" class="palp-add-btn" onclick={addSensation}>Add Test</button>
              </div>
            {:else}
              {#each sensationEntries as entry (entry.id)}
                <div class="palp-entry">
                  <div class="palp-row">
                    <label class="palp-field">
                      Modality
                      <select
                        class="palp-select"
                        value={entry.modality}
                        onchange={(e) =>
                          updateSensationField(
                            entry.id,
                            'modality',
                            (e.target as HTMLSelectElement).value,
                          )}
                      >
                        <option value="">Select...</option>
                        <option value="light-touch">Light Touch</option>
                        <option value="sharp-dull">Sharp/Dull</option>
                        <option value="temperature">Temperature</option>
                        <option value="vibration">Vibration</option>
                        <option value="two-point">Two-Point Discrimination</option>
                        <option value="stereognosis">Stereognosis</option>
                        <option value="graphesthesia">Graphesthesia</option>
                      </select>
                    </label>
                    <label class="palp-field palp-field--grow">
                      Location / Dermatome
                      <input
                        type="text"
                        class="palp-input"
                        value={entry.location}
                        placeholder="e.g. L4-S1 dermatome, dorsum of foot"
                        oninput={(e) =>
                          updateSensationField(
                            entry.id,
                            'location',
                            (e.target as HTMLInputElement).value,
                          )}
                      />
                    </label>
                    <label class="palp-field">
                      Status
                      <select
                        class="palp-select"
                        value={entry.status}
                        onchange={(e) =>
                          updateSensationField(
                            entry.id,
                            'status',
                            (e.target as HTMLSelectElement).value,
                          )}
                      >
                        <option value="">Select...</option>
                        <option value="intact">Intact</option>
                        <option value="diminished">Diminished</option>
                        <option value="absent">Absent</option>
                        <option value="hypersensitive">Hypersensitive</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      class="palp-remove"
                      onclick={() => removeSensation(entry.id)}
                      aria-label="Remove test">&times;</button
                    >
                  </div>
                  <label class="palp-field palp-field--full">
                    Notes
                    <input
                      type="text"
                      class="palp-input"
                      value={entry.notes}
                      placeholder="Distribution pattern, comparison to contralateral..."
                      oninput={(e) =>
                        updateSensationField(
                          entry.id,
                          'notes',
                          (e.target as HTMLInputElement).value,
                        )}
                    />
                  </label>
                </div>
              {/each}
              <button type="button" class="palp-add-btn" onclick={addSensation}>+ Add Test</button>
            {/if}
          </div>
          <div class="field-label">
            Gait Analysis
            <GaitAssessment data={gaitData} onUpdate={handleGaitUpdate} />
          </div>
          <div class="field-label">
            Functional Mobility / Transfers
            <FunctionalMobilityLog
              entries={functionalMobilityEntries}
              onUpdate={handleFunctionalMobilityUpdate}
            />
          </div>
        </div>
      {/if}
    </CollapsibleSubsection>
  {/if}

  <!-- 9. STANDARDIZED FUNCTIONAL ASSESSMENTS -->
  {#if isSubsectionVisible(noteTemplate, 'objective', 'standardized-assessments')}
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
  {/if}

  <!-- 10. TREATMENT PERFORMED (structured intervention log) -->
  {#if isSubsectionVisible(noteTemplate, 'objective', 'treatment-performed')}
    <CollapsibleSubsection
      title="Treatment Performed"
      open={!isCollapsed('treatment-performed')}
      onToggle={() => toggleCollapse('treatment-performed')}
      dataSubsection="treatment-performed"
    >
      <InterventionLog entries={interventionEntries} onUpdate={handleInterventionsUpdate} />
    </CollapsibleSubsection>
  {/if}
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
    gap: 0.25rem;
    font-size: 0.78125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #616161);
    flex: 1;
    min-width: 0;
    margin-top: 0.375rem;
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
    gap: 0.5rem 0.75rem;
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
    margin-top: 0.75rem;
    padding-top: 0.625rem;
    border-top: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .obj-select {
    font-size: 0.78125rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
    max-width: 220px;
  }

  .obj-inline-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.375rem;
  }

  /* Arousal → Orientation notice */
  .arousal-notice {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: #92400e;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    margin-top: 0.375rem;
  }

  /* Palpation structured entries (reused for proprioception & sensation) */
  .palp-empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .palp-entry {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
    margin-top: 0.375rem;
  }

  .palp-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .palp-field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
  }

  .palp-field--grow {
    flex: 1;
    min-width: 120px;
  }

  .palp-field--full {
    width: 100%;
  }

  .palp-select,
  .palp-input {
    font-size: 0.75rem;
    padding: 0.3rem 0.4rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
  }

  .palp-remove {
    flex-shrink: 0;
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
    margin-bottom: 0.125rem;
  }

  .palp-remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .palp-add-btn {
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
    margin-top: 0.375rem;
  }

  .palp-add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }
</style>
