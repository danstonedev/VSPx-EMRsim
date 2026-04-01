<!--
  PostureAssessment — three-view structured posture checklist.
  Anterior, Posterior, and Lateral views with common findings.
  Each finding: present checkbox, severity, notes.
-->
<script lang="ts">
  import type { PostureData, PostureFinding } from '$lib/types/sections';

  interface Props {
    data: PostureData;
    onUpdate: (data: PostureData) => void;
  }

  let { data, onUpdate }: Props = $props();

  interface ViewConfig {
    id: 'anterior' | 'posterior' | 'lateral';
    label: string;
    findings: string[];
  }

  const VIEWS: ViewConfig[] = [
    {
      id: 'anterior',
      label: 'Anterior',
      findings: [
        'Head tilt',
        'Shoulder height asymmetry',
        'Trunk shift',
        'Pelvic obliquity',
        'Genu valgum',
        'Genu varum',
        'Foot pronation',
        'Foot supination',
      ],
    },
    {
      id: 'posterior',
      label: 'Posterior',
      findings: [
        'Scoliotic curve',
        'Scapular winging',
        'Scapular asymmetry',
        'Gluteal fold asymmetry',
        'Calcaneal alignment deviation',
      ],
    },
    {
      id: 'lateral',
      label: 'Lateral',
      findings: [
        'Forward head posture',
        'Increased cervical lordosis',
        'Decreased cervical lordosis',
        'Thoracic kyphosis',
        'Increased lumbar lordosis',
        'Decreased lumbar lordosis',
        'Knee hyperextension',
        'Knee flexion contracture',
      ],
    },
  ];

  const SEVERITIES = [
    { value: '', label: '—' },
    { value: 'mild', label: 'Mild' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'marked', label: 'Marked' },
  ];

  function defaultFinding(): PostureFinding {
    return { present: false, severity: '', notes: '' };
  }

  function getFinding(
    viewId: 'anterior' | 'posterior' | 'lateral',
    findingName: string,
  ): PostureFinding {
    return data[viewId]?.[findingName] ?? defaultFinding();
  }

  function updateFinding(
    viewId: 'anterior' | 'posterior' | 'lateral',
    findingName: string,
    field: keyof PostureFinding,
    value: boolean | string,
  ) {
    const current = getFinding(viewId, findingName);
    const updated = { ...current, [field]: value };
    // Auto-clear severity if unchecked
    if (field === 'present' && !value) {
      updated.severity = '';
    }
    onUpdate({
      ...data,
      [viewId]: {
        ...(data[viewId] ?? {}),
        [findingName]: updated,
      },
    });
  }

  function updateNotes(value: string) {
    onUpdate({ ...data, notes: value });
  }

  // Count total present findings
  const totalFindings = $derived.by((): number => {
    let count = 0;
    for (const view of VIEWS) {
      for (const f of view.findings) {
        if (getFinding(view.id, f).present) count++;
      }
    }
    return count;
  });
</script>

<div class="pa">
  <div class="pa__summary">
    {totalFindings} finding{totalFindings !== 1 ? 's' : ''} noted
  </div>

  {#each VIEWS as view}
    <details class="pa__view" open={VIEWS.indexOf(view) === 0}>
      <summary class="pa__view-header">{view.label} View</summary>
      <div class="pa__grid">
        {#each view.findings as finding}
          {@const f = getFinding(view.id, finding)}
          <div class="pa__item" class:pa__item--active={f.present}>
            <label class="pa__check-label">
              <input
                type="checkbox"
                class="pa__checkbox"
                checked={f.present}
                onchange={(e) =>
                  updateFinding(
                    view.id,
                    finding,
                    'present',
                    (e.target as HTMLInputElement).checked,
                  )}
              />
              {finding}
            </label>
            {#if f.present}
              <select
                value={f.severity}
                onchange={(e) =>
                  updateFinding(
                    view.id,
                    finding,
                    'severity',
                    (e.target as HTMLSelectElement).value,
                  )}
              >
                {#each SEVERITIES as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
              <input
                type="text"
                class="pa__note-input"
                value={f.notes}
                placeholder="Notes..."
                oninput={(e) =>
                  updateFinding(view.id, finding, 'notes', (e.target as HTMLInputElement).value)}
              />
            {/if}
          </div>
        {/each}
      </div>
    </details>
  {/each}

  <label class="pa__general-notes">
    General Posture Notes
    <input
      type="text"
      class="pa__note-input pa__note-input--full"
      value={data.notes ?? ''}
      placeholder="Overall postural impression, compensatory patterns..."
      oninput={(e) => updateNotes((e.target as HTMLInputElement).value)}
    />
  </label>
</div>

<style>
  .pa {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .pa__summary {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-500, #757575);
    padding: 0.25rem 0;
  }

  .pa__view {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    overflow: hidden;
  }

  .pa__view-header {
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-neutral-700, #424242);
    background: var(--color-neutral-50, #fafafa);
    cursor: pointer;
  }

  .pa__grid {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.375rem 0.625rem;
  }

  .pa__item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    padding: 0.1875rem 0;
    font-size: 0.75rem;
  }

  .pa__item--active {
    background: rgba(0, 154, 68, 0.04);
    border-radius: 4px;
    padding: 0.25rem 0.375rem;
  }

  .pa__check-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-neutral-700, #424242);
    cursor: pointer;
    min-width: 180px;
  }

  .pa__checkbox {
    width: 14px;
    height: 14px;
    accent-color: var(--color-brand-green, #009a44);
  }

  .pa__note-input {
    flex: 1;
    min-width: 100px;
  }

  .pa__note-input--full {
    width: 100%;
    min-width: 0;
  }

  .pa__general-notes {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    margin-top: 0.25rem;
  }
</style>
