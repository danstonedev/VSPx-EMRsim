<!--
  SignedNoteViewer — read-only rendering of a signed/locked note.
  Port of app/js/features/navigation/panels/SignedNoteViewer.js.
-->
<script lang="ts">
  import type { Signature, Amendment, NoteData } from '$lib/services/noteLifecycle';

  interface Props {
    note: NoteData;
    patientName?: string;
    onAmend?: () => void;
    onBack?: () => void;
  }

  let { note, patientName = '', onAmend, onBack }: Props = $props();

  const signature = $derived(note.meta?.signature as Signature | undefined);
  const amendments = $derived((note.amendments ?? []) as Amendment[]);

  const PT_SECTIONS = ['subjective', 'objective', 'assessment', 'plan', 'billing'] as const;
  const DIETETICS_SECTIONS = [
    'nutrition_assessment',
    'nutrition_diagnosis',
    'nutrition_intervention',
    'nutrition_monitoring',
    'billing',
  ] as const;

  const isDietetics = $derived('nutrition_assessment' in note);
  const sections = $derived(isDietetics ? DIETETICS_SECTIONS : PT_SECTIONS);

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  const SECTION_TITLES: Record<string, string> = {
    subjective: 'Subjective',
    objective: 'Objective',
    assessment: 'Assessment',
    plan: 'Plan',
    billing: 'Billing',
    nutrition_assessment: 'Nutrition Assessment',
    nutrition_diagnosis: 'Nutrition Diagnosis',
    nutrition_intervention: 'Nutrition Intervention',
    nutrition_monitoring: 'Nutrition Monitoring',
  };

  function getSectionTitle(key: string): string {
    return SECTION_TITLES[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Format a complex object into readable text */
  function formatObject(obj: Record<string, unknown>): string {
    return Object.entries(obj)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(
        ([k, v]) => `${formatFieldName(k)}: ${typeof v === 'object' ? formatValue(v) : String(v)}`,
      )
      .join(', ');
  }

  /** Recursively format a value for display */
  function formatValue(value: unknown): string {
    if (value == null || value === '') return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === 'object' && item
            ? formatObject(item as Record<string, unknown>)
            : String(item),
        )
        .filter(Boolean)
        .join('\n');
    }
    if (typeof value === 'object') return formatObject(value as Record<string, unknown>);
    return String(value);
  }

  /** Render a section's data as readable text */
  function renderSectionContent(key: string): string {
    const data = note[key];
    if (!data || typeof data !== 'object') return '';
    const entries = Object.entries(data as Record<string, unknown>);
    return entries
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => {
        if (Array.isArray(v)) {
          return `${formatFieldName(k)}:\n${formatValue(v)}`;
        }
        if (typeof v === 'object') {
          return `${formatFieldName(k)}: ${formatValue(v)}`;
        }
        return `${formatFieldName(k)}: ${v}`;
      })
      .join('\n\n');
  }

  function formatFieldName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }
</script>

<div class="signed-note">
  <div class="signed-note__header">
    <h2 class="signed-note__title">
      {isDietetics ? 'Nutrition Care Process Note' : 'Clinical Note'}
    </h2>
    {#if patientName}
      <p class="signed-note__patient">Patient: {patientName}</p>
    {/if}
  </div>

  <!-- Note Sections (PT SOAP or Dietetics ADIME) -->
  {#each sections as sectionKey}
    {@const content = renderSectionContent(sectionKey)}
    {#if content}
      <div class="signed-note__section">
        <h3 class="signed-note__section-title">{getSectionTitle(sectionKey)}</h3>
        <pre class="signed-note__content">{content}</pre>
      </div>
    {/if}
  {/each}

  <!-- Signature Block -->
  {#if signature}
    <div class="signed-note__signature">
      <div class="signed-note__sig-line">
        <span class="signed-note__sig-label">Signed by:</span>
        <span class="signed-note__sig-value">{signature.name}</span>
      </div>
      <div class="signed-note__sig-line">
        <span class="signed-note__sig-label">Title:</span>
        <span class="signed-note__sig-value">{signature.title}</span>
      </div>
      <div class="signed-note__sig-line">
        <span class="signed-note__sig-label">Date:</span>
        <span class="signed-note__sig-value">{formatDate(signature.signedAt)}</span>
      </div>
    </div>
  {/if}

  <!-- Amendments -->
  {#if amendments.length > 0}
    <div class="signed-note__amendments">
      <h3 class="signed-note__amendments-title">Amendment History</h3>
      {#each amendments as amend, i}
        <div class="signed-note__amendment">
          <div class="signed-note__amend-header">Amendment #{i + 1}</div>
          <p class="signed-note__amend-reason">Reason: {amend.reason}</p>
          <p class="signed-note__amend-meta">
            Previous signer: {amend.previousSignature.name} — {formatDate(amend.amendedAt)}
          </p>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Actions -->
  <div class="signed-note__actions">
    {#if onBack}
      <button type="button" class="btn btn--secondary" onclick={onBack}> &larr; Back </button>
    {/if}
    {#if onAmend}
      <button type="button" class="btn btn--primary" onclick={onAmend}> Amend Note </button>
    {/if}
  </div>
</div>

<style>
  .signed-note {
    padding: 1.25rem;
    max-width: 800px;
  }

  .signed-note__header {
    border-bottom: 2px solid var(--color-neutral-200, #e0e0e0);
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
  }

  .signed-note__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .signed-note__patient {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: var(--color-neutral-500, #9e9e9e);
  }

  .signed-note__section {
    margin-bottom: 1.25rem;
  }

  .signed-note__section-title {
    margin: 0 0 0.5rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-neutral-700, #616161);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .signed-note__content {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
    padding: 0.75rem;
    background: var(--color-neutral-50, #fafafa);
    border-radius: 6px;
    border: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .signed-note__signature {
    margin: 1.5rem 0;
    padding: 1rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
  }

  .signed-note__sig-line {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    padding: 0.25rem 0;
  }

  .signed-note__sig-label {
    font-weight: 600;
    color: var(--color-neutral-600, #757575);
    min-width: 80px;
  }

  .signed-note__sig-value {
    color: var(--color-neutral-800, #424242);
  }

  .signed-note__amendments {
    margin: 1rem 0;
    border-top: 1px solid var(--color-neutral-200, #e0e0e0);
    padding-top: 1rem;
  }

  .signed-note__amendments-title {
    margin: 0 0 0.75rem;
    font-size: 0.9375rem;
    font-weight: 700;
  }

  .signed-note__amendment {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
  }

  .signed-note__amend-header {
    font-weight: 700;
    font-size: 0.8125rem;
    margin-bottom: 0.25rem;
  }

  .signed-note__amend-reason {
    font-size: 0.8125rem;
    margin: 0.25rem 0;
  }

  .signed-note__amend-meta {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #9e9e9e);
    margin: 0.25rem 0 0;
  }

  .signed-note__actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-neutral-200, #e0e0e0);
  }

  .btn {
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .btn--secondary {
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-700, #616161);
  }

  .btn--secondary:hover {
    background: var(--color-neutral-200, #e0e0e0);
  }

  .btn--primary {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .btn--primary:hover {
    background: #007a35;
  }
</style>
