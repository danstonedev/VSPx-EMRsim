<script module lang="ts">
  import { writable } from 'svelte/store';
  import type { NoteData, Signature } from '$lib/services/noteLifecycle';

  export interface NoteExportPreviewOptions {
    note: NoteData;
    patient: {
      name: string;
      dob?: string;
      caseId?: string;
    };
    noteTypeLabel?: string;
    existingSignature?: Signature | null;
    mode?: 'sign' | 'export';
  }

  interface PreviewConfig extends Omit<NoteExportPreviewOptions, 'mode' | 'noteTypeLabel'> {
    mode: 'sign' | 'export';
    noteTypeLabel: string;
    resolve: (result: NoteExportPreviewResult | null) => void;
  }

  export interface NoteExportPreviewResult {
    confirmed: boolean;
    signature?: Signature;
    note?: NoteData;
  }

  const config = writable<PreviewConfig | null>(null);

  export function openNoteExportPreview(
    opts: NoteExportPreviewOptions,
  ): Promise<NoteExportPreviewResult | null> {
    return new Promise((resolve) => {
      config.set({
        ...opts,
        mode: opts.mode ?? 'sign',
        noteTypeLabel: opts.noteTypeLabel ?? 'Clinical Note',
        resolve,
      });
    });
  }
</script>

<script lang="ts">
  import { SIGNATURE_STORAGE_NAME, SIGNATURE_STORAGE_TITLE } from '$lib/services/noteLifecycle';

  type PreviewField = {
    label: string;
    value: string;
    path: string;
    sectionKey: string;
    editable: boolean;
    input: 'text' | 'textarea';
  };

  type PreviewSection = {
    title: string;
    fields: PreviewField[];
  };

  const cfg = $derived($config);

  let name = $state('');
  let title = $state('');
  let attested = $state(false);
  let activeElement = $state<HTMLInputElement | undefined>(undefined);
  let previewNote = $state<NoteData | null>(null);

  function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  function getPath(record: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, part) => {
      if (!acc || typeof acc !== 'object' || Array.isArray(acc)) return undefined;
      return (acc as Record<string, unknown>)[part];
    }, record);
  }

  function setPath(record: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let cursor = record;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      const next = cursor[key];
      if (!next || typeof next !== 'object' || Array.isArray(next)) {
        cursor[key] = {};
      }
      cursor = cursor[key] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]] = value;
  }

  function titleize(key: string): string {
    return key
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function formatValue(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      return value
        .map((entry) => formatValue(entry))
        .filter(Boolean)
        .join(', ');
    }
    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .map(([key, entry]) => {
          const formatted = formatValue(entry);
          return formatted ? `${titleize(key)}: ${formatted}` : '';
        })
        .filter(Boolean)
        .join('\n');
    }
    return '';
  }

  function formatSignedAt(value: string | undefined): string {
    if (!value) return 'Not signed';
    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) return value;
    return timestamp.toLocaleString();
  }

  const sectionMap: Array<{
    key: string;
    title: string;
    fields: Array<{ label: string; path: string; input?: 'text' | 'textarea' }>;
  }> = [
    {
      key: 'subjective',
      title: 'Subjective',
      fields: [
        { label: 'Patient Name', path: 'patientName' },
        { label: 'Date of Birth', path: 'patientBirthday' },
        { label: 'Age', path: 'patientAge' },
        { label: 'Sex', path: 'patientGender' },
        { label: 'Gender Identity / Pronouns', path: 'patientGenderIdentityPronouns' },
        { label: 'Preferred Language', path: 'patientPreferredLanguage' },
        { label: 'Interpreter Needed', path: 'patientInterpreterNeeded' },
        { label: 'BMI', path: 'patientBmi' },
        { label: 'Work Status / Occupation', path: 'patientWorkStatusOccupation' },
        { label: 'Living Situation', path: 'patientLivingSituationHomeEnvironment' },
        { label: 'Social Support', path: 'patientSocialSupport' },
        { label: 'Chief Complaint', path: 'chiefComplaint', input: 'textarea' },
        { label: 'History of Present Illness', path: 'historyOfPresentIllness', input: 'textarea' },
        { label: 'Functional Limitations', path: 'functionalLimitations', input: 'textarea' },
        { label: 'Prior Level of Function', path: 'priorLevel', input: 'textarea' },
        { label: 'Patient Goals', path: 'patientGoals', input: 'textarea' },
        { label: 'Additional History', path: 'additionalHistory', input: 'textarea' },
        { label: 'Pain Location', path: 'painLocation' },
        { label: 'Pain Scale', path: 'painScale' },
        { label: 'Pain Quality', path: 'painQuality' },
        { label: 'Pain Pattern', path: 'painPattern' },
        { label: 'Aggravating Factors', path: 'aggravatingFactors', input: 'textarea' },
        { label: 'Easing Factors', path: 'easingFactors', input: 'textarea' },
        { label: 'Red Flag Screening', path: 'redFlagScreening' },
        { label: 'Interview Q&A', path: 'qaItems' },
        { label: 'Medications', path: 'medications' },
      ],
    },
    {
      key: 'objective',
      title: 'Objective',
      fields: [
        { label: 'Vitals', path: 'vitals' },
        { label: 'Vitals Flowsheet', path: 'vitalsSeries' },
        { label: 'Inspection', path: 'inspection' },
        { label: 'Palpation', path: 'palpation' },
        { label: 'Systems Review', path: 'systemsReview' },
        { label: 'Regional Assessments', path: 'regionalAssessments' },
        { label: 'Neuroscreen', path: 'neuroscreenData' },
        { label: 'Standardized Assessments', path: 'standardizedAssessments' },
        { label: 'Treatment Performed', path: 'treatmentPerformed', input: 'textarea' },
      ],
    },
    {
      key: 'assessment',
      title: 'Assessment',
      fields: [
        { label: 'Primary Impairments', path: 'primaryImpairments', input: 'textarea' },
        { label: 'Body Functions (ICF)', path: 'bodyFunctions', input: 'textarea' },
        { label: 'Activity Limitations (ICF)', path: 'activityLimitations', input: 'textarea' },
        {
          label: 'Participation Restrictions (ICF)',
          path: 'participationRestrictions',
          input: 'textarea',
        },
        { label: 'PT Diagnosis', path: 'ptDiagnosis', input: 'textarea' },
        { label: 'Prognosis', path: 'prognosis' },
        { label: 'Prognostic Factors', path: 'prognosticFactors', input: 'textarea' },
        { label: 'Clinical Reasoning', path: 'clinicalReasoning', input: 'textarea' },
      ],
    },
    {
      key: 'plan',
      title: 'Plan',
      fields: [
        { label: 'Frequency', path: 'frequency' },
        { label: 'Duration', path: 'duration' },
        { label: 'Goals', path: 'goals' },
        { label: 'Treatment Plan', path: 'treatmentPlan', input: 'textarea' },
        { label: 'Exercise Focus', path: 'exerciseFocus', input: 'textarea' },
        { label: 'Exercise Prescription (FITT)', path: 'exercisePrescription', input: 'textarea' },
        { label: 'Manual Therapy', path: 'manualTherapy', input: 'textarea' },
        { label: 'Modalities', path: 'modalities' },
        { label: 'In-Clinic Interventions', path: 'inClinicInterventions' },
        { label: 'Home Exercise Program', path: 'hepInterventions' },
        { label: 'Patient Education', path: 'patientEducation', input: 'textarea' },
      ],
    },
    {
      key: 'billing',
      title: 'Billing',
      fields: [
        { label: 'ICD-10 Codes', path: 'diagnosisCodes' },
        { label: 'CPT Codes', path: 'billingCodes' },
        { label: 'Orders / Referrals', path: 'ordersReferrals' },
      ],
    },
    {
      key: 'nutrition_assessment',
      title: 'Nutrition Assessment',
      fields: [
        { label: 'Food / Nutrition History', path: 'food_nutrition_history', input: 'textarea' },
        { label: 'Anthropometric Data', path: 'anthropometric' },
        { label: 'Biochemical Data', path: 'biochemical' },
        {
          label: 'Nutrition-Focused Physical Exam',
          path: 'nutrition_focused_pe',
          input: 'textarea',
        },
        { label: 'Client History', path: 'client_history', input: 'textarea' },
        { label: 'Estimated Needs', path: 'estimated_needs' },
        { label: 'Malnutrition Risk', path: 'malnutrition_risk' },
      ],
    },
    {
      key: 'nutrition_diagnosis',
      title: 'Nutrition Diagnosis',
      fields: [
        { label: 'PES Statements', path: 'pes_statements' },
        { label: 'Priority Diagnosis', path: 'priority_diagnosis', input: 'textarea' },
      ],
    },
    {
      key: 'nutrition_intervention',
      title: 'Nutrition Intervention',
      fields: [
        { label: 'Strategy', path: 'strategy', input: 'textarea' },
        { label: 'Diet Order', path: 'diet_order', input: 'textarea' },
        { label: 'Goals', path: 'goals', input: 'textarea' },
        { label: 'Education Topics', path: 'education_topics', input: 'textarea' },
        { label: 'Counseling Notes', path: 'counseling_notes', input: 'textarea' },
        { label: 'Care Coordination', path: 'coordination', input: 'textarea' },
      ],
    },
    {
      key: 'nutrition_monitoring',
      title: 'Nutrition Monitoring and Evaluation',
      fields: [
        { label: 'Indicators', path: 'indicators', input: 'textarea' },
        { label: 'Criteria', path: 'criteria', input: 'textarea' },
        { label: 'Outcomes', path: 'outcomes', input: 'textarea' },
        { label: 'Follow-Up Plan', path: 'follow_up_plan', input: 'textarea' },
      ],
    },
  ];

  function isEditableValue(value: unknown): value is string | number | boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  }

  function updatePreviewField(sectionKey: string, path: string, value: string): void {
    if (!previewNote) return;
    const next = structuredClone(previewNote) as Record<string, unknown>;
    const sectionRecord = asRecord(next[sectionKey]);
    setPath(sectionRecord, path, value);
    next[sectionKey] = sectionRecord;
    previewNote = next as NoteData;
  }

  function buildSections(note: NoteData, mode: 'sign' | 'export'): PreviewSection[] {
    const source = note as Record<string, unknown>;
    return sectionMap
      .filter((section) => section.key in source)
      .map((section) => {
        const sectionRecord = asRecord(source[section.key]);
        const fields = section.fields
          .map((field) => {
            const rawValue = getPath(sectionRecord, field.path);
            const input: PreviewField['input'] = field.input === 'textarea' ? 'textarea' : 'text';
            return {
              label: field.label,
              value: formatValue(rawValue),
              path: field.path,
              sectionKey: section.key,
              editable: mode === 'sign' && isEditableValue(rawValue),
              input,
            };
          })
          .filter((field) => field.value);
        return { title: section.title, fields };
      })
      .filter((section) => section.fields.length > 0);
  }

  const previewSections = $derived(cfg && previewNote ? buildSections(previewNote, cfg.mode) : []);
  const previewSignature = $derived.by(() => {
    if (!cfg) return null;
    return cfg.existingSignature ?? (cfg.note.meta?.signature as Signature | undefined) ?? null;
  });
  const previewSignedAt = $derived.by(() => {
    if (!cfg) return '';
    return formatSignedAt(
      cfg.existingSignature?.signedAt ??
        (typeof cfg.note.meta?.signedAt === 'string' ? cfg.note.meta.signedAt : undefined),
    );
  });
  const canConfirm = $derived.by(() => {
    if (!cfg) return false;
    if (cfg.mode === 'export') return true;
    return name.trim().length > 0 && title.trim().length > 0 && attested;
  });

  $effect(() => {
    if (!cfg) return;
    previewNote = structuredClone(cfg.note);
    name = cfg.existingSignature?.name ?? localStorage.getItem(SIGNATURE_STORAGE_NAME) ?? '';
    title = cfg.existingSignature?.title ?? localStorage.getItem(SIGNATURE_STORAGE_TITLE) ?? '';
    attested = false;
    queueMicrotask(() => activeElement?.focus());
  });

  function close() {
    config.set(null);
  }

  function cancel() {
    cfg?.resolve(null);
    close();
  }

  function confirm() {
    if (!cfg || !canConfirm) return;
    if (cfg.mode === 'export') {
      cfg.resolve({ confirmed: true, note: previewNote ?? cfg.note });
      close();
      return;
    }

    localStorage.setItem(SIGNATURE_STORAGE_NAME, name.trim());
    localStorage.setItem(SIGNATURE_STORAGE_TITLE, title.trim());
    const signature: Signature = {
      name: name.trim(),
      title: title.trim(),
      signedAt: new Date().toISOString(),
      version: 1,
    };
    cfg.resolve({ confirmed: true, signature, note: previewNote ?? cfg.note });
    close();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!cfg) return;
    if (event.key === 'Escape') cancel();
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && canConfirm) {
      event.preventDefault();
      confirm();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if cfg}
  <div
    class="preview-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Note review before sign or export"
  >
    <div class="preview-modal">
      <div class="preview-modal__header">
        <div>
          <div class="preview-modal__eyebrow">
            {cfg.mode === 'sign' ? 'Review Before Signing' : 'Export Preview'}
          </div>
          <h2 class="preview-modal__title">{cfg.noteTypeLabel}</h2>
        </div>
        <button
          class="preview-modal__close"
          type="button"
          onclick={cancel}
          aria-label="Close preview"
        >
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>

      <div class="preview-modal__body">
        <section class="preview-sheet preview-sheet--patient">
          <div class="preview-grid">
            <div>
              <span class="preview-label">Patient</span>
              <div class="preview-value">{cfg.patient.name || 'Patient'}</div>
            </div>
            <div>
              <span class="preview-label">DOB</span>
              <div class="preview-value">{cfg.patient.dob || 'N/A'}</div>
            </div>
            <div>
              <span class="preview-label">Case ID</span>
              <div class="preview-value">{cfg.patient.caseId || 'N/A'}</div>
            </div>
          </div>
        </section>

        <section class="preview-sheet">
          {#if cfg.mode === 'sign'}
            <p class="preview-hint">
              Review the note below. Plain-text fields remain editable until you sign.
            </p>
          {/if}
          {#if previewSections.length > 0}
            {#each previewSections as section}
              <div class="preview-section">
                <h3 class="preview-section__title">{section.title}</h3>
                <div class="preview-section__fields">
                  {#each section.fields as field}
                    <div class="preview-field">
                      <div class="preview-label">{field.label}</div>
                      {#if field.editable}
                        {#if field.input === 'textarea'}
                          <textarea
                            class="preview-field__textarea"
                            rows="4"
                            value={field.value}
                            oninput={(event) =>
                              updatePreviewField(
                                field.sectionKey,
                                field.path,
                                (event.currentTarget as HTMLTextAreaElement).value,
                              )}
                          ></textarea>
                        {:else}
                          <input
                            class="preview-field__input"
                            type="text"
                            value={field.value}
                            oninput={(event) =>
                              updatePreviewField(
                                field.sectionKey,
                                field.path,
                                (event.currentTarget as HTMLInputElement).value,
                              )}
                          />
                        {/if}
                      {:else}
                        <pre class="preview-field__value">{field.value}</pre>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          {:else}
            <p class="preview-empty">No populated note fields are available for preview yet.</p>
          {/if}
        </section>

        {#if cfg.mode === 'sign'}
          <section class="preview-sheet preview-sheet--signature">
            <div class="preview-section">
              <h3 class="preview-section__title">Signature</h3>
              <div class="preview-signature-grid">
                <label class="preview-input">
                  <span>Full Name</span>
                  <input
                    bind:value={name}
                    bind:this={activeElement}
                    type="text"
                    placeholder="Jane Doe, SPT"
                  />
                </label>
                <label class="preview-input">
                  <span>Title / Credentials</span>
                  <input bind:value={title} type="text" placeholder="Student Physical Therapist" />
                </label>
              </div>
              <label class="preview-attest">
                <input bind:checked={attested} type="checkbox" />
                <span
                  >I attest that this documentation is accurate and ready for signature and export.</span
                >
              </label>
            </div>
          </section>
        {:else if previewSignature}
          <section class="preview-sheet preview-sheet--signature">
            <div class="preview-section">
              <h3 class="preview-section__title">Signature on Export</h3>
              <div class="preview-signature-summary">
                <div>
                  <span class="preview-label">Signed By</span>
                  <div class="preview-value">{previewSignature.name}</div>
                </div>
                <div>
                  <span class="preview-label">Title</span>
                  <div class="preview-value">{previewSignature.title}</div>
                </div>
                <div>
                  <span class="preview-label">Signed At</span>
                  <div class="preview-value">{previewSignedAt}</div>
                </div>
              </div>
            </div>
          </section>
        {/if}
      </div>

      <div class="preview-modal__actions">
        <button class="preview-btn preview-btn--ghost" type="button" onclick={cancel}>Cancel</button
        >
        <button
          class="preview-btn preview-btn--primary"
          type="button"
          disabled={!canConfirm}
          onclick={confirm}
        >
          {#if cfg.mode === 'sign'}
            Sign &amp; Download
          {:else}
            Download .docx
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .preview-overlay {
    position: fixed;
    inset: 0;
    z-index: 10020;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.52);
    backdrop-filter: blur(5px);
  }

  .preview-modal {
    width: min(1080px, 100%);
    max-height: min(92vh, 980px);
    display: flex;
    flex-direction: column;
    background: #eef2f4;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 36px 90px rgba(15, 23, 42, 0.28);
  }

  .preview-modal__header,
  .preview-modal__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: linear-gradient(180deg, rgba(18, 18, 18, 0.96), rgba(58, 58, 58, 0.96));
    color: white;
  }

  .preview-modal__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preview-modal__eyebrow {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.68;
    margin-bottom: 0.2rem;
  }

  .preview-modal__title {
    margin: 0;
    font-size: 1.15rem;
  }

  .preview-modal__close {
    width: 2.25rem;
    height: 2.25rem;
    display: grid;
    place-items: center;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.08);
    color: white;
    cursor: pointer;
  }

  .preview-sheet {
    background: rgba(255, 255, 255, 0.96);
    border-radius: 18px;
    padding: 1rem 1.1rem;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  }

  .preview-sheet--patient {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .preview-label {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-neutral-600, #6b7280);
    margin-bottom: 0.25rem;
  }

  .preview-value {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-neutral-900, #111827);
  }

  .preview-section + .preview-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
  }

  .preview-section__title {
    margin: 0 0 0.8rem;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-neutral-900, #111827);
  }

  .preview-section__fields {
    display: grid;
    gap: 0.8rem;
  }

  .preview-field {
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 14px;
    padding: 0.8rem 0.9rem;
    background: #fcfcfd;
  }

  .preview-field__value {
    margin: 0;
    white-space: pre-wrap;
    font-family: inherit;
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--color-neutral-900, #111827);
  }

  .preview-empty {
    margin: 0;
    color: var(--color-neutral-600, #6b7280);
  }

  .preview-hint {
    margin: 0 0 0.35rem;
    font-size: 0.86rem;
    color: var(--color-neutral-600, #6b7280);
  }

  .preview-field__input,
  .preview-field__textarea {
    width: 100%;
    border-radius: 10px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    padding: 0.72rem 0.8rem;
    font: inherit;
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--color-neutral-900, #111827);
    background: white;
  }

  .preview-field__textarea {
    resize: vertical;
    min-height: 7rem;
  }

  .preview-signature-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .preview-signature-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .preview-input {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-neutral-700, #4b5563);
  }

  .preview-input input {
    min-height: 2.75rem;
    border-radius: 12px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    padding: 0.7rem 0.85rem;
    font-size: 0.95rem;
  }

  .preview-attest {
    margin-top: 0.9rem;
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    color: var(--color-neutral-700, #4b5563);
    font-size: 0.86rem;
  }

  .preview-btn {
    min-height: 2.5rem;
    padding: 0.55rem 1rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .preview-btn--ghost {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.16);
    color: white;
  }

  .preview-btn--primary {
    background: #009a44;
    color: white;
  }

  .preview-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 840px) {
    .preview-grid,
    .preview-signature-grid,
    .preview-signature-summary {
      grid-template-columns: 1fr;
    }
  }
</style>
