<!--
  NeuroscreenPanel — Combined neuroscreen tables for LE, UE, and Cranial Nerves.
  Dermatome, myotome, and reflex assessments per selected region.
-->
<script lang="ts">
  import {
    NEURO_REGIONS,
    DERMATOME_OPTIONS,
    MYOTOME_OPTIONS,
    REFLEX_OPTIONS,
    neuroKey,
    getNeuroscreenRegionList,
  } from '$lib/config/neuroscreenData';

  interface Props {
    selectedRegions: string[];
    dermatome: Record<string, string>;
    myotome: Record<string, string>;
    reflex: Record<string, string>;
    onUpdate: (field: string, value: any) => void;
  }

  let { selectedRegions, dermatome, myotome, reflex, onUpdate }: Props = $props();

  const regionList = getNeuroscreenRegionList();

  function toggleRegion(id: string) {
    const current = [...selectedRegions];
    const idx = current.indexOf(id);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(id);
    onUpdate('selectedRegions', current);
  }

  function handleSelect(dict: string, key: string, value: string) {
    const source = dict === 'dermatome' ? dermatome : dict === 'myotome' ? myotome : reflex;
    onUpdate(dict, { ...source, [key]: value });
  }

  const activeRegions = $derived(regionList.filter((r) => selectedRegions.includes(r.value)));
</script>

<div class="ns">
  <!-- Region selector -->
  <div class="ct-pills" role="group" aria-label="Neuroscreen regions">
    {#each regionList as r}
      <button
        type="button"
        class="ct-pill"
        class:ct-pill--active={selectedRegions.includes(r.value)}
        onclick={() => toggleRegion(r.value)}>{r.label}</button
      >
    {/each}
  </div>

  {#if activeRegions.length === 0}
    <p class="ct-empty-hint" style="padding:1rem 0; text-align:center">
      Select a neuroscreen region above to begin.
    </p>
  {/if}

  {#each activeRegions as regionMeta}
    {@const region = NEURO_REGIONS[regionMeta.value]}
    {#if region}
      <details class="ns-region" open>
        <summary class="ns-region__header">{region.name}</summary>
        <div class="ct-wrap" style="padding: 0.5rem 0.75rem">
          <table class="ct-table">
            <thead>
              <tr>
                <th class="ct-th ct-th--region ns-region-col" rowspan="2"
                  >{region.name.toUpperCase()}</th
                >
                <th class="ct-th ct-th--group" colspan="2">Dermatome</th>
                <th class="ct-th ct-th--group ct-th--divider" colspan="2">Myotome</th>
                {#if region.items.some((l: import('$lib/config/neuroscreenData').NeuroscreenItem) => l.reflex !== null)}
                  <th class="ct-th ct-th--group ct-th--divider" colspan="2">Reflex</th>
                {/if}
              </tr>
              <tr>
                <th class="ct-th ct-th--sub">L</th><th class="ct-th ct-th--sub">R</th>
                <th class="ct-th ct-th--sub ct-th--divider">L</th><th class="ct-th ct-th--sub">R</th
                >
                {#if region.items.some((l: import('$lib/config/neuroscreenData').NeuroscreenItem) => l.reflex !== null)}
                  <th class="ct-th ct-th--sub ct-th--divider">L</th><th class="ct-th ct-th--sub"
                    >R</th
                  >
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each region.items as level, i}
                {@const hasReflex = level.reflex !== null}
                {@const anyReflex = region.items.some(
                  (l: import('$lib/config/neuroscreenData').NeuroscreenItem) => l.reflex !== null,
                )}
                <tr class="ct-row" class:ct-row--alt={i % 2 === 1}>
                  <td class="ct-td ct-td--label">{level.level}</td>
                  <!-- Dermatome L/R -->
                  {#each ['L', 'R'] as side}
                    {@const dk = neuroKey(regionMeta.value, level.level, side, 'derm')}
                    <td class="ct-td">
                      <select
                        class="ct-select ns-sel-w"
                        value={dermatome[dk] ?? ''}
                        onchange={(e) =>
                          handleSelect('dermatome', dk, (e.target as HTMLSelectElement).value)}
                      >
                        {#each DERMATOME_OPTIONS as opt}<option value={opt.value}
                            >{opt.label}</option
                          >{/each}
                      </select>
                    </td>
                  {/each}
                  <!-- Myotome L/R -->
                  {#each ['L', 'R'] as side, si}
                    {@const mk = neuroKey(regionMeta.value, level.level, side, 'myo')}
                    <td class="ct-td" class:ct-td--divider={si === 0}>
                      <select
                        class="ct-select ns-sel-w"
                        value={myotome[mk] ?? ''}
                        onchange={(e) =>
                          handleSelect('myotome', mk, (e.target as HTMLSelectElement).value)}
                      >
                        {#each MYOTOME_OPTIONS as opt}<option value={opt.value}>{opt.label}</option
                          >{/each}
                      </select>
                    </td>
                  {/each}
                  <!-- Reflex L/R -->
                  {#if anyReflex}
                    {#if hasReflex}
                      {#each ['L', 'R'] as side, si}
                        {@const rk = neuroKey(regionMeta.value, level.level, side, 'reflex')}
                        <td class="ct-td" class:ct-td--divider={si === 0}>
                          <select
                            class="ct-select ns-sel-w"
                            value={reflex[rk] ?? ''}
                            onchange={(e) =>
                              handleSelect('reflex', rk, (e.target as HTMLSelectElement).value)}
                          >
                            {#each REFLEX_OPTIONS as opt}<option value={opt.value}
                                >{opt.label}</option
                              >{/each}
                          </select>
                        </td>
                      {/each}
                    {:else}
                      <td class="ct-td ct-td--divider ct-td--empty">—</td>
                      <td class="ct-td ct-td--empty">—</td>
                    {/if}
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </details>
    {/if}
  {/each}
</div>

<style>
  .ns {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .ns-region {
    border: 1px solid var(--ct-cell-border);
    border-radius: var(--ct-radius);
    overflow: hidden;
  }

  .ns-region__header {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 700;
    cursor: pointer;
    background: var(--ct-row-alt);
    color: var(--color-neutral-700, #424242);
  }

  .ns-region-col {
    width: 10%;
  }
  .ns-sel-w {
    min-width: 5.5rem;
  }

  @media (max-width: 768px) {
    .ns-sel-w {
      min-width: 4rem;
    }
  }
</style>
