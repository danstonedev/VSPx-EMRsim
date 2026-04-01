<!--
  SystemToggleBar — compact inline Add/Defer toggle for a single APTA system.
  Placed at the top of each subsection to control whether the exam fields are shown.
  When "Add" is selected, subcategory-level Add/Defer toggles appear below.
  When "Defer" is selected, a deferral reason dropdown appears.
-->
<script lang="ts">
  import {
    SUBCATEGORIES,
    DEFER_REASONS,
    type SystemsReviewData,
    type SystemState,
    type SystemStatus,
  } from '$lib/config/systemsReview';

  interface Props {
    systemId: string;
    data: SystemsReviewData;
    onUpdate: (data: SystemsReviewData) => void;
  }

  let { systemId, data, onUpdate }: Props = $props();

  const state = $derived<SystemState>(
    data[systemId] ?? { status: '', subcategories: {}, deferReason: '', deferReasons: {} },
  );
  const subcats = $derived(SUBCATEGORIES[systemId] ?? []);

  function setStatus(status: SystemStatus) {
    const sys = { ...state };
    if (sys.status === status) {
      sys.status = '';
      sys.deferReason = '';
    } else {
      sys.status = status;
      const sc = { ...sys.subcategories };
      for (const key of Object.keys(sc)) {
        sc[key] = status;
      }
      sys.subcategories = sc;
      if (status === 'impaired') sys.deferReason = '';
    }
    onUpdate({ ...data, [systemId]: sys });
  }

  function setSubcatStatus(subcatId: string, status: SystemStatus) {
    const sys = { ...state, subcategories: { ...state.subcategories } };
    const current = sys.subcategories[subcatId];
    sys.subcategories[subcatId] = current === status ? '' : status;
    if (status === 'impaired') {
      const dr = { ...sys.deferReasons };
      delete dr[subcatId];
      sys.deferReasons = dr;
    }
    onUpdate({ ...data, [systemId]: sys });
  }

  function setDeferReason(reason: string) {
    onUpdate({ ...data, [systemId]: { ...state, deferReason: reason } });
  }

  function setSubcatDeferReason(subcatId: string, reason: string) {
    onUpdate({
      ...data,
      [systemId]: {
        ...state,
        deferReasons: { ...state.deferReasons, [subcatId]: reason },
      },
    });
  }
</script>

<div
  class="stb"
  class:stb--impaired={state.status === 'impaired'}
  class:stb--deferred={state.status === 'wnl'}
>
  <div class="stb__row">
    <div class="stb__toggle" role="group" aria-label="System status">
      <button
        type="button"
        class="stb__btn"
        class:stb__btn--active={state.status === 'impaired'}
        onclick={() => setStatus('impaired')}>Add</button
      >
      <button
        type="button"
        class="stb__btn stb__btn--defer"
        class:stb__btn--active={state.status === 'wnl'}
        onclick={() => setStatus('wnl')}>Defer</button
      >
    </div>

    {#if state.status === 'wnl'}
      <select
        class="stb__reason"
        value={state.deferReason}
        onchange={(e) => setDeferReason((e.target as HTMLSelectElement).value)}
      >
        {#each DEFER_REASONS as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    {/if}

    {#if state.status === ''}
      <span class="stb__hint">Choose Add to document or Defer to skip this system</span>
    {/if}
  </div>

  <!-- Subcategory-level toggles when system is set to Add -->
  {#if state.status === 'impaired' && subcats.length > 0}
    <div class="stb__subcats">
      {#each subcats as sub}
        {@const subStatus = state.subcategories[sub.id] ?? ''}
        <div class="stb__subcat">
          <span class="stb__subcat-label">{sub.label}</span>
          <div class="stb__toggle stb__toggle--sm" role="group" aria-label="{sub.label} status">
            <button
              type="button"
              class="stb__btn stb__btn--sm"
              class:stb__btn--active={subStatus === 'impaired'}
              onclick={() => setSubcatStatus(sub.id, 'impaired')}>Add</button
            >
            <button
              type="button"
              class="stb__btn stb__btn--sm stb__btn--defer"
              class:stb__btn--active={subStatus === 'wnl'}
              onclick={() => setSubcatStatus(sub.id, 'wnl')}>Defer</button
            >
          </div>
          {#if subStatus === 'wnl'}
            <select
              class="stb__reason stb__reason--sm"
              value={state.deferReasons?.[sub.id] ?? ''}
              onchange={(e) => setSubcatDeferReason(sub.id, (e.target as HTMLSelectElement).value)}
            >
              {#each DEFER_REASONS as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .stb {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    padding: 0.5rem 0.625rem;
    margin-bottom: 0.5rem;
    background: var(--color-neutral-50, #fafafa);
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .stb--impaired {
    border-color: var(--color-brand-green, #009a44);
    background: rgba(0, 154, 68, 0.04);
  }

  .stb--deferred {
    border-color: var(--color-neutral-300, #d4d4d4);
    background: var(--color-neutral-50, #fafafa);
  }

  .stb__row {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex-wrap: wrap;
  }

  .stb__toggle {
    display: flex;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .stb__btn {
    padding: 0.3rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: none;
    background: var(--color-surface, #ffffff);
    cursor: pointer;
    color: var(--color-neutral-600, #616161);
    transition: all 0.12s;
  }

  .stb__btn + .stb__btn {
    border-left: 1px solid var(--color-neutral-300, #d4d4d4);
  }

  .stb__btn--active:not(.stb__btn--defer) {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .stb__btn--defer.stb__btn--active {
    background: var(--color-neutral-500, #757575);
    color: white;
  }

  .stb__btn--sm {
    padding: 0.2rem 0.5rem;
    font-size: 0.6875rem;
  }

  .stb__reason {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
    max-width: 260px;
  }

  .stb__reason--sm {
    max-width: 220px;
    font-size: 0.6875rem;
  }

  .stb__hint {
    font-size: 0.6875rem;
    color: var(--color-neutral-400, #a3a3a3);
    font-style: italic;
  }

  .stb__subcats {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .stb__subcat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding-left: 0.375rem;
  }

  .stb__subcat-label {
    font-size: 0.75rem;
    color: var(--color-neutral-600, #616161);
    flex: 1;
    min-width: 100px;
  }
</style>
