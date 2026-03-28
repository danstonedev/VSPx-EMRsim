<!--
  SystemsReviewPanel — APTA-aligned 6-system review with Add/Defer toggles.
  Cascading: system-level Add → opens subcategory drawer; Defer → collapses + shows deferral reason.
-->
<script lang="ts">
  import {
    SYSTEMS,
    SUBCATEGORIES,
    DEFER_REASONS,
    createDefaultSystemsReview,
    type SystemsReviewData,
    type SystemStatus,
  } from '$lib/config/systemsReview';

  interface Props {
    data: SystemsReviewData;
    onUpdate: (data: SystemsReviewData) => void;
  }

  let { data, onUpdate }: Props = $props();

  const review = $derived(Object.keys(data).length > 0 ? data : createDefaultSystemsReview());

  function setSystemStatus(sysId: string, status: SystemStatus) {
    const sys = { ...review[sysId] };
    if (sys.status === status) {
      // toggle off
      sys.status = '';
      sys.deferReason = '';
    } else {
      sys.status = status;
      // cascade subcategories
      const subcats = { ...sys.subcategories };
      for (const key of Object.keys(subcats)) {
        subcats[key] = status;
      }
      sys.subcategories = subcats;
      if (status === 'impaired') sys.deferReason = '';
    }
    onUpdate({ ...review, [sysId]: sys });
  }

  function setSubcatStatus(sysId: string, subcatId: string, status: SystemStatus) {
    const sys = { ...review[sysId], subcategories: { ...review[sysId].subcategories } };
    const current = sys.subcategories[subcatId];
    sys.subcategories[subcatId] = current === status ? '' : status;
    if (status === 'impaired') {
      const deferReasons = { ...sys.deferReasons };
      delete deferReasons[subcatId];
      sys.deferReasons = deferReasons;
    }
    onUpdate({ ...review, [sysId]: sys });
  }

  function setDeferReason(sysId: string, reason: string) {
    const sys = { ...review[sysId], deferReason: reason };
    onUpdate({ ...review, [sysId]: sys });
  }

  function setSubcatDeferReason(sysId: string, subcatId: string, reason: string) {
    const sys = {
      ...review[sysId],
      deferReasons: { ...review[sysId].deferReasons, [subcatId]: reason },
    };
    onUpdate({ ...review, [sysId]: sys });
  }
</script>

<div class="sr-panel">
  {#each SYSTEMS as sys}
    {@const state = review[sys.id]}
    {@const subcats = SUBCATEGORIES[sys.id] ?? []}
    <div
      class="sr-system"
      class:sr-system--impaired={state?.status === 'impaired'}
      class:sr-system--deferred={state?.status === 'wnl'}
    >
      <div class="sr-system__header">
        <span class="sr-system__label">{sys.label}</span>
        <div class="sr-toggle" role="group" aria-label="{sys.label} status">
          <button
            type="button"
            class="sr-toggle__btn"
            class:sr-toggle__btn--active={state?.status === 'impaired'}
            onclick={() => setSystemStatus(sys.id, 'impaired')}>Add</button
          >
          <button
            type="button"
            class="sr-toggle__btn sr-toggle__btn--defer"
            class:sr-toggle__btn--active={state?.status === 'wnl'}
            onclick={() => setSystemStatus(sys.id, 'wnl')}>Defer</button
          >
        </div>
      </div>

      <!-- Defer reason dropdown -->
      {#if state?.status === 'wnl'}
        <div class="sr-defer-row">
          <select
            class="sr-defer-select"
            value={state.deferReason}
            onchange={(e) => setDeferReason(sys.id, (e.target as HTMLSelectElement).value)}
          >
            {#each DEFER_REASONS as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Subcategory drawer -->
      {#if state?.status === 'impaired' && subcats.length > 0}
        <div class="sr-subcats">
          {#each subcats as sub}
            {@const subStatus = state.subcategories[sub.id] ?? ''}
            <div class="sr-subcat">
              <span class="sr-subcat__label">{sub.label}</span>
              <div class="sr-toggle sr-toggle--sm" role="group" aria-label="{sub.label} status">
                <button
                  type="button"
                  class="sr-toggle__btn sr-toggle__btn--sm"
                  class:sr-toggle__btn--active={subStatus === 'impaired'}
                  onclick={() => setSubcatStatus(sys.id, sub.id, 'impaired')}>Add</button
                >
                <button
                  type="button"
                  class="sr-toggle__btn sr-toggle__btn--sm sr-toggle__btn--defer"
                  class:sr-toggle__btn--active={subStatus === 'wnl'}
                  onclick={() => setSubcatStatus(sys.id, sub.id, 'wnl')}>Defer</button
                >
              </div>
              {#if subStatus === 'wnl'}
                <select
                  class="sr-defer-select sr-defer-select--sm"
                  value={state.deferReasons?.[sub.id] ?? ''}
                  onchange={(e) =>
                    setSubcatDeferReason(sys.id, sub.id, (e.target as HTMLSelectElement).value)}
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
  {/each}
</div>

<style>
  .sr-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sr-system {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    padding: 0.625rem 0.75rem;
    background: var(--color-surface, #ffffff);
    transition: border-color 0.15s;
  }

  .sr-system--impaired {
    border-color: var(--color-brand-green, #009a44);
    background: rgba(0, 154, 68, 0.03);
  }

  .sr-system--deferred {
    border-color: var(--color-neutral-300, #d4d4d4);
    background: var(--color-neutral-50, #fafafa);
  }

  .sr-system__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .sr-system__label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-neutral-700, #424242);
  }

  .sr-toggle {
    display: flex;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    overflow: hidden;
  }

  .sr-toggle__btn {
    padding: 0.3rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: none;
    background: var(--color-surface, #ffffff);
    cursor: pointer;
    color: var(--color-neutral-600, #616161);
    transition: all 0.12s;
  }

  .sr-toggle__btn + .sr-toggle__btn {
    border-left: 1px solid var(--color-neutral-300, #d4d4d4);
  }

  .sr-toggle__btn--active:not(.sr-toggle__btn--defer) {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .sr-toggle__btn--defer.sr-toggle__btn--active {
    background: var(--color-neutral-500, #757575);
    color: white;
  }

  .sr-toggle__btn--sm {
    padding: 0.2rem 0.5rem;
    font-size: 0.6875rem;
  }

  .sr-defer-row {
    margin-top: 0.375rem;
  }

  .sr-defer-select {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
    width: 100%;
    max-width: 280px;
  }

  .sr-defer-select--sm {
    max-width: 220px;
    font-size: 0.6875rem;
  }

  .sr-subcats {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .sr-subcat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding-left: 0.5rem;
  }

  .sr-subcat__label {
    font-size: 0.75rem;
    color: var(--color-neutral-600, #616161);
    flex: 1;
    min-width: 100px;
  }
</style>
