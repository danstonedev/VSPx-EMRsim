<!--
  OrientationGrid — structured orientation assessment (Person, Place, Time, Situation).
  Replaces free-text orientation textarea with toggleable status per domain
  and auto-generated clinical summary (e.g., "Oriented x3 — impaired to Time").
-->
<script lang="ts">
  import type { OrientationData, OrientationStatus } from '$lib/types/sections';

  interface Props {
    data: OrientationData;
    onUpdate: (data: OrientationData) => void;
  }

  let { data, onUpdate }: Props = $props();

  const DOMAINS: { key: keyof Omit<OrientationData, 'notes'>; label: string }[] = [
    { key: 'person', label: 'Person' },
    { key: 'place', label: 'Place' },
    { key: 'time', label: 'Time' },
    { key: 'situation', label: 'Situation' },
  ];

  const STATUS_OPTIONS: { value: OrientationStatus; label: string; abbr: string }[] = [
    { value: '', label: 'Not assessed', abbr: '—' },
    { value: 'intact', label: 'Intact', abbr: 'Intact' },
    { value: 'impaired', label: 'Impaired', abbr: 'Impaired' },
    { value: 'unable', label: 'Unable to assess', abbr: 'Unable' },
  ];

  function setStatus(key: keyof Omit<OrientationData, 'notes'>, value: OrientationStatus) {
    onUpdate({ ...data, [key]: value });
  }

  function setNotes(value: string) {
    onUpdate({ ...data, notes: value });
  }

  const summary = $derived.by(() => {
    const assessed = DOMAINS.filter((d) => data[d.key] !== '');
    if (assessed.length === 0) return '';

    const intact = DOMAINS.filter((d) => data[d.key] === 'intact');
    const impaired = DOMAINS.filter((d) => data[d.key] === 'impaired');
    const unable = DOMAINS.filter((d) => data[d.key] === 'unable');

    const parts: string[] = [];
    if (intact.length === 4) {
      parts.push('Oriented \u00d74');
    } else if (intact.length > 0) {
      parts.push(`Oriented \u00d7${intact.length} (${intact.map((d) => d.label).join(', ')})`);
    }
    if (impaired.length > 0) {
      parts.push(`impaired to ${impaired.map((d) => d.label).join(', ')}`);
    }
    if (unable.length > 0) {
      parts.push(`unable to assess ${unable.map((d) => d.label).join(', ')}`);
    }
    return parts.join(' — ');
  });
</script>

<div class="og">
  <div class="og__grid">
    {#each DOMAINS as domain}
      {@const current = data[domain.key]}
      <div class="og__domain">
        <span class="og__domain-label">{domain.label}</span>
        <div class="og__options" role="radiogroup" aria-label="{domain.label} orientation">
          {#each STATUS_OPTIONS as opt}
            {@const active = current === opt.value}
            <button
              type="button"
              class="og__btn"
              class:og__btn--intact={active && opt.value === 'intact'}
              class:og__btn--impaired={active && opt.value === 'impaired'}
              class:og__btn--unable={active && opt.value === 'unable'}
              aria-pressed={active ? 'true' : 'false'}
              onclick={() => setStatus(domain.key, active ? '' : opt.value)}
            >
              {opt.abbr}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if summary}
    <div class="og__summary">{summary}</div>
  {/if}

  <label class="og__notes-label">
    Notes
    <textarea
      class="og__notes"
      rows="1"
      value={data.notes}
      oninput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
      placeholder="Additional orientation details..."
    ></textarea>
  </label>
</div>

<style>
  .og {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .og__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.5rem;
  }

  .og__domain {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .og__domain-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
  }

  .og__options {
    display: flex;
    gap: 0;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    overflow: hidden;
  }

  .og__btn {
    flex: 1;
    padding: 0.3rem 0.25rem;
    font-size: 0.6875rem;
    font-weight: 600;
    border: none;
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-500, #757575);
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;
  }

  .og__btn + .og__btn {
    border-left: 1px solid var(--color-neutral-300, #d4d4d4);
  }

  .og__btn:hover {
    background: var(--color-neutral-50, #fafafa);
  }

  .og__btn--intact {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .og__btn--impaired {
    background: #e57300;
    color: white;
  }

  .og__btn--unable {
    background: var(--color-neutral-500, #757575);
    color: white;
  }

  .og__summary {
    font-size: 0.78125rem;
    font-weight: 600;
    color: var(--color-neutral-700, #424242);
    padding: 0.375rem 0.5rem;
    background: var(--color-neutral-50, #fafafa);
    border-radius: 4px;
    border-left: 3px solid var(--color-brand-green, #009a44);
  }

  .og__notes-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-neutral-600, #616161);
  }

  .og__notes {
    font-size: 0.8125rem;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 4px;
    resize: vertical;
  }
</style>
