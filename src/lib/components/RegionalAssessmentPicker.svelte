<!--
  RegionalAssessmentPicker — Combined ROM/PROM/RIM table + MMT + Special Tests.
  Matches the legacy Combined ROM Assessment layout with grouped Left/Right columns.
-->
<script lang="ts">
  import {
    REGION_ORDER,
    REGIONS,
    RIMS_OPTIONS,
    MMT_GRADES,
    type RegionDef,
  } from '$lib/config/regionalAssessments';
  import type { CustomMmtRow } from '$lib/types/sections';

  interface Props {
    selectedRegions: string[];
    arom: Record<string, string>;
    prom: Record<string, string>;
    rims: Record<string, string>;
    mmt: Record<string, string>;
    specialTests: Record<string, string>;
    mmtCustomRows?: Record<string, CustomMmtRow[]>;
    onUpdate: (field: string, value: unknown) => void;
  }

  let {
    selectedRegions,
    arom,
    prom,
    rims,
    mmt,
    specialTests,
    mmtCustomRows = {},
    onUpdate,
  }: Props = $props();

  /* ── Region toggle ── */

  function toggleRegion(regionId: string) {
    const current = [...selectedRegions];
    const idx = current.indexOf(regionId);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(regionId);
    onUpdate('selectedRegions', current);
  }

  function regionLabel(id: string): string {
    return (REGIONS as Record<string, RegionDef>)[id]?.name ?? id;
  }

  const activeRegions = $derived(REGION_ORDER.filter((id) => selectedRegions.includes(id)));

  /* ── Key helpers ── */

  function romKey(regionId: string, joint: string, side: string): string {
    return `${regionId}:${joint}:${side}`;
  }

  function mmtKey(regionId: string, muscle: string, side: string): string {
    return `${regionId}:${muscle}:${side}`;
  }

  function stKey(regionId: string, testName: string): string {
    return `${regionId}:${testName}`;
  }

  /* ── Data update helpers ── */

  function getDictByName(name: string): Record<string, string> {
    switch (name) {
      case 'arom':
        return arom;
      case 'prom':
        return prom;
      case 'rims':
        return rims;
      case 'mmt':
        return mmt;
      case 'specialTests':
        return specialTests;
      default:
        return {};
    }
  }

  function handleInput(dict: string, key: string, value: string) {
    onUpdate(dict, { ...getDictByName(dict), [key]: value });
  }

  /* ── Grouping helpers ── */

  interface RomGroup {
    joint: string;
    normal: string;
    midline: boolean;
  }

  function groupRomByJoint(items: { joint: string; normal: string; side: string }[]): RomGroup[] {
    const seen = new Map<string, RomGroup>();
    const order: string[] = [];
    for (const item of items) {
      if (!seen.has(item.joint)) {
        seen.set(item.joint, { joint: item.joint, normal: item.normal, midline: item.side === '' });
        order.push(item.joint);
      }
    }
    return order.map((j) => seen.get(j)!);
  }

  interface MmtGroup {
    muscle: string;
    normal: string;
    midline: boolean;
  }

  function groupMmtByMuscle(items: { muscle: string; side: string; normal: string }[]): MmtGroup[] {
    const seen = new Map<string, MmtGroup>();
    const order: string[] = [];
    for (const item of items) {
      if (!seen.has(item.muscle)) {
        seen.set(item.muscle, {
          muscle: item.muscle,
          normal: item.normal,
          midline: item.side === '',
        });
        order.push(item.muscle);
      }
    }
    return order.map((m) => seen.get(m)!);
  }

  /* ── Custom MMT rows ── */

  function addCustomMmtRow(regionId: string) {
    const current = mmtCustomRows[regionId] ?? [];
    const id = `custom-${Date.now()}`;
    onUpdate('mmtCustomRows', { ...mmtCustomRows, [regionId]: [...current, { id, name: '' }] });
  }

  function removeCustomMmtRow(regionId: string, rowId: string) {
    const current = mmtCustomRows[regionId] ?? [];
    onUpdate('mmtCustomRows', {
      ...mmtCustomRows,
      [regionId]: current.filter((r) => r.id !== rowId),
    });
    // Clear MMT data for this row
    const newMmt = { ...mmt };
    delete newMmt[mmtKey(regionId, rowId, 'L')];
    delete newMmt[mmtKey(regionId, rowId, 'R')];
    onUpdate('mmt', newMmt);
  }

  function updateCustomMmtName(regionId: string, rowId: string, name: string) {
    const current = mmtCustomRows[regionId] ?? [];
    onUpdate('mmtCustomRows', {
      ...mmtCustomRows,
      [regionId]: current.map((r) => (r.id === rowId ? { ...r, name } : r)),
    });
  }

  /* ── Special Test options ── */

  const ST_OPTIONS = [
    { value: '', label: '—' },
    { value: 'positive', label: '+' },
    { value: 'negative', label: '−' },
    { value: 'equivocal', label: 'Equiv' },
    { value: 'not-tested', label: 'N/T' },
  ];
</script>

<div class="rap">
  <!-- Region pill selector -->
  <div class="ct-pills" role="group" aria-label="Select body regions">
    {#each REGION_ORDER as id}
      <button
        type="button"
        class="ct-pill"
        class:ct-pill--active={selectedRegions.includes(id)}
        onclick={() => toggleRegion(id)}>{regionLabel(id)}</button
      >
    {/each}
  </div>

  {#if activeRegions.length === 0}
    <p class="ct-empty-hint" style="padding:1.5rem 0; text-align:center">
      Select one or more body regions above to begin.
    </p>
  {/if}

  {#each activeRegions as regionId}
    {@const region = (REGIONS as Record<string, RegionDef>)[regionId]}
    {#if region}
      <details class="rap-region" open>
        <summary class="rap-region__header">
          <span class="rap-region__title">{region.name}</span>
        </summary>

        <!-- ═══ Combined ROM / PROM / RIM Table ═══ -->
        {#if region.rom.length > 0}
          {@const romGroups = groupRomByJoint(region.rom)}
          <div class="crom-section">
            <h4 class="crom-heading">Combined ROM Assessment</h4>
            <div class="ct-wrap">
              <table class="ct-table">
                <thead>
                  <tr>
                    <th class="ct-th ct-th--region crom-region-col" rowspan="2"
                      >{region.name.toUpperCase()}</th
                    >
                    <th class="ct-th ct-th--group" colspan="3">Left</th>
                    <th class="ct-th ct-th--group ct-th--divider" colspan="3">Right</th>
                  </tr>
                  <tr>
                    <th class="ct-th ct-th--sub">AROM</th>
                    <th class="ct-th ct-th--sub">PROM</th>
                    <th class="ct-th ct-th--sub">RIM</th>
                    <th class="ct-th ct-th--sub ct-th--divider">AROM</th>
                    <th class="ct-th ct-th--sub">PROM</th>
                    <th class="ct-th ct-th--sub">RIM</th>
                  </tr>
                </thead>
                <tbody>
                  {#each romGroups as group, i}
                    <tr class="ct-row" class:ct-row--alt={i % 2 === 1}>
                      <td class="ct-td ct-td--label">{group.joint}</td>

                      {#if group.midline}
                        <!-- Midline movement: left inputs, right dashes -->
                        <td class="ct-td">
                          <div class="crom-input-wrap">
                            <input
                              type="text"
                              inputmode="numeric"
                              class="ct-input crom-input-w"
                              value={arom[romKey(regionId, group.joint, '')] ?? ''}
                              oninput={(e) =>
                                handleInput(
                                  'arom',
                                  romKey(regionId, group.joint, ''),
                                  (e.target as HTMLInputElement).value,
                                )}
                            /><span class="crom-deg">°</span>
                          </div>
                        </td>
                        <td class="ct-td">
                          <div class="crom-input-wrap">
                            <input
                              type="text"
                              inputmode="numeric"
                              class="ct-input crom-input-w"
                              value={prom[romKey(regionId, group.joint, '')] ?? ''}
                              oninput={(e) =>
                                handleInput(
                                  'prom',
                                  romKey(regionId, group.joint, ''),
                                  (e.target as HTMLInputElement).value,
                                )}
                            /><span class="crom-deg">°</span>
                          </div>
                        </td>
                        <td class="ct-td">
                          <select
                            class="ct-select crom-select-w"
                            value={rims[romKey(regionId, group.joint, '')] ?? ''}
                            onchange={(e) =>
                              handleInput(
                                'rims',
                                romKey(regionId, group.joint, ''),
                                (e.target as HTMLSelectElement).value,
                              )}
                          >
                            {#each RIMS_OPTIONS as opt}<option value={opt.value}>{opt.label}</option
                              >{/each}
                          </select>
                        </td>
                        <td class="ct-td ct-td--empty ct-td--divider">—</td>
                        <td class="ct-td ct-td--empty">—</td>
                        <td class="ct-td ct-td--empty">—</td>
                      {:else}
                        <!-- Bilateral: Left side -->
                        <td class="ct-td">
                          <div class="crom-input-wrap">
                            <input
                              type="text"
                              inputmode="numeric"
                              class="ct-input crom-input-w"
                              value={arom[romKey(regionId, group.joint, 'L')] ?? ''}
                              oninput={(e) =>
                                handleInput(
                                  'arom',
                                  romKey(regionId, group.joint, 'L'),
                                  (e.target as HTMLInputElement).value,
                                )}
                            /><span class="crom-deg">°</span>
                          </div>
                        </td>
                        <td class="ct-td">
                          <div class="crom-input-wrap">
                            <input
                              type="text"
                              inputmode="numeric"
                              class="ct-input crom-input-w"
                              value={prom[romKey(regionId, group.joint, 'L')] ?? ''}
                              oninput={(e) =>
                                handleInput(
                                  'prom',
                                  romKey(regionId, group.joint, 'L'),
                                  (e.target as HTMLInputElement).value,
                                )}
                            /><span class="crom-deg">°</span>
                          </div>
                        </td>
                        <td class="ct-td">
                          <select
                            class="ct-select crom-select-w"
                            value={rims[romKey(regionId, group.joint, 'L')] ?? ''}
                            onchange={(e) =>
                              handleInput(
                                'rims',
                                romKey(regionId, group.joint, 'L'),
                                (e.target as HTMLSelectElement).value,
                              )}
                          >
                            {#each RIMS_OPTIONS as opt}<option value={opt.value}>{opt.label}</option
                              >{/each}
                          </select>
                        </td>
                        <!-- Bilateral: Right side -->
                        <td class="ct-td ct-td--divider">
                          <div class="crom-input-wrap">
                            <input
                              type="text"
                              inputmode="numeric"
                              class="ct-input crom-input-w"
                              value={arom[romKey(regionId, group.joint, 'R')] ?? ''}
                              oninput={(e) =>
                                handleInput(
                                  'arom',
                                  romKey(regionId, group.joint, 'R'),
                                  (e.target as HTMLInputElement).value,
                                )}
                            /><span class="crom-deg">°</span>
                          </div>
                        </td>
                        <td class="ct-td">
                          <div class="crom-input-wrap">
                            <input
                              type="text"
                              inputmode="numeric"
                              class="ct-input crom-input-w"
                              value={prom[romKey(regionId, group.joint, 'R')] ?? ''}
                              oninput={(e) =>
                                handleInput(
                                  'prom',
                                  romKey(regionId, group.joint, 'R'),
                                  (e.target as HTMLInputElement).value,
                                )}
                            /><span class="crom-deg">°</span>
                          </div>
                        </td>
                        <td class="ct-td">
                          <select
                            class="ct-select crom-select-w"
                            value={rims[romKey(regionId, group.joint, 'R')] ?? ''}
                            onchange={(e) =>
                              handleInput(
                                'rims',
                                romKey(regionId, group.joint, 'R'),
                                (e.target as HTMLSelectElement).value,
                              )}
                          >
                            {#each RIMS_OPTIONS as opt}<option value={opt.value}>{opt.label}</option
                              >{/each}
                          </select>
                        </td>
                      {/if}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        <!-- ═══ Manual Muscle Testing Table ═══ -->
        {#if region.mmt.length > 0}
          {@const mmtGroups = groupMmtByMuscle(region.mmt)}
          {@const customRows = mmtCustomRows[regionId] ?? []}
          <div class="mmt-section">
            <div class="ct-wrap">
              <table class="ct-table">
                <thead>
                  <tr>
                    <th class="ct-th ct-th--region mmt-region-col">MANUAL MUSCLE TESTING</th>
                    <th class="ct-th ct-th--group mmt-group-col">Left</th>
                    <th class="ct-th ct-th--group mmt-group-col">Right</th>
                    <th class="ct-th ct-th--actions">
                      <button
                        type="button"
                        class="ct-btn-add"
                        onclick={() => addCustomMmtRow(regionId)}
                        title="Add custom muscle">+</button
                      >
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {#each mmtGroups as group}
                    <tr class="ct-row">
                      <td class="ct-td ct-td--label">{group.muscle}</td>
                      {#if group.midline}
                        <td class="ct-td" colspan="2">
                          <select
                            class="ct-select mmt-select-w"
                            value={mmt[mmtKey(regionId, group.muscle, '')] ?? ''}
                            onchange={(e) =>
                              handleInput(
                                'mmt',
                                mmtKey(regionId, group.muscle, ''),
                                (e.target as HTMLSelectElement).value,
                              )}
                          >
                            {#each MMT_GRADES as g}<option value={g.value}>{g.label}</option>{/each}
                          </select>
                        </td>
                      {:else}
                        <td class="ct-td">
                          <select
                            class="ct-select mmt-select-w"
                            value={mmt[mmtKey(regionId, group.muscle, 'L')] ?? ''}
                            onchange={(e) =>
                              handleInput(
                                'mmt',
                                mmtKey(regionId, group.muscle, 'L'),
                                (e.target as HTMLSelectElement).value,
                              )}
                          >
                            {#each MMT_GRADES as g}<option value={g.value}>{g.label}</option>{/each}
                          </select>
                        </td>
                        <td class="ct-td">
                          <select
                            class="ct-select mmt-select-w"
                            value={mmt[mmtKey(regionId, group.muscle, 'R')] ?? ''}
                            onchange={(e) =>
                              handleInput(
                                'mmt',
                                mmtKey(regionId, group.muscle, 'R'),
                                (e.target as HTMLSelectElement).value,
                              )}
                          >
                            {#each MMT_GRADES as g}<option value={g.value}>{g.label}</option>{/each}
                          </select>
                        </td>
                      {/if}
                      <td class="ct-td mmt-td--actions"></td>
                    </tr>
                  {/each}
                  {#each customRows as row}
                    <tr class="ct-row">
                      <td class="ct-td ct-td--label">
                        <input
                          type="text"
                          class="ct-input mmt-name-input"
                          value={row.name}
                          placeholder="Muscle name"
                          oninput={(e) =>
                            updateCustomMmtName(
                              regionId,
                              row.id,
                              (e.target as HTMLInputElement).value,
                            )}
                        />
                      </td>
                      <td class="ct-td">
                        <select
                          class="ct-select mmt-select-w"
                          value={mmt[mmtKey(regionId, row.id, 'L')] ?? ''}
                          onchange={(e) =>
                            handleInput(
                              'mmt',
                              mmtKey(regionId, row.id, 'L'),
                              (e.target as HTMLSelectElement).value,
                            )}
                        >
                          {#each MMT_GRADES as g}<option value={g.value}>{g.label}</option>{/each}
                        </select>
                      </td>
                      <td class="ct-td">
                        <select
                          class="ct-select mmt-select-w"
                          value={mmt[mmtKey(regionId, row.id, 'R')] ?? ''}
                          onchange={(e) =>
                            handleInput(
                              'mmt',
                              mmtKey(regionId, row.id, 'R'),
                              (e.target as HTMLSelectElement).value,
                            )}
                        >
                          {#each MMT_GRADES as g}<option value={g.value}>{g.label}</option>{/each}
                        </select>
                      </td>
                      <td class="ct-td mmt-td--actions">
                        <button
                          type="button"
                          class="ct-btn-remove mmt-del-btn"
                          onclick={() => removeCustomMmtRow(regionId, row.id)}
                          title="Remove muscle">×</button
                        >
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        <!-- ═══ Special Tests ═══ -->
        {#if region.specialTests.length > 0}
          <div class="st-section">
            <div class="ct-wrap">
              <table class="ct-table">
                <thead>
                  <tr>
                    <th class="ct-th ct-th--region">SPECIAL TESTS</th>
                    <th class="ct-th ct-th--group">Purpose</th>
                    <th class="ct-th ct-th--group">Result</th>
                    <th class="ct-th ct-th--group">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {#each region.specialTests as st}
                    {@const key = stKey(regionId, st.name)}
                    <tr class="ct-row">
                      <td class="ct-td ct-td--label">{st.name}</td>
                      <td class="ct-td st-td--purpose">{st.purpose}</td>
                      <td class="ct-td">
                        <select
                          class="ct-select st-select-w"
                          value={specialTests[key] ?? ''}
                          onchange={(e) =>
                            handleInput('specialTests', key, (e.target as HTMLSelectElement).value)}
                        >
                          {#each ST_OPTIONS as opt}<option value={opt.value}>{opt.label}</option
                            >{/each}
                        </select>
                      </td>
                      <td class="ct-td">
                        <input
                          type="text"
                          class="ct-input st-input-w"
                          placeholder="Notes…"
                          value={specialTests[key + ':notes'] ?? ''}
                          oninput={(e) =>
                            handleInput(
                              'specialTests',
                              key + ':notes',
                              (e.target as HTMLInputElement).value,
                            )}
                        />
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </details>
    {/if}
  {/each}
</div>

<style>
  /* ═══════════════════════════════════════════════════════════
     RegionalAssessmentPicker — Component-specific styles only.
     Shared clinical table styles (.ct-*) are in app.css.
     ═══════════════════════════════════════════════════════════ */

  /* ─── Layout ─── */

  .rap {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ─── Region card (details/summary) ─── */

  .rap-region {
    border: 1px solid var(--ct-cell-border);
    border-radius: var(--ct-radius);
    overflow: hidden;
    background: var(--ct-surface);
  }

  .rap-region__header {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-neutral-700, #424242);
    cursor: pointer;
    background: var(--ct-row-alt);
    border-bottom: 1px solid var(--ct-cell-border);
    transition: background 0.15s;
  }

  .rap-region__header:hover {
    background: var(--color-neutral-100, #f5f5f5);
  }

  .rap-region__title {
    display: inline;
  }

  /* ─── Combined ROM section ─── */

  .crom-section {
    padding: 0.75rem 0.875rem;
  }

  .crom-heading {
    font-size: 0.9375rem;
    font-weight: 700;
    font-style: italic;
    color: var(--ct-region-bg);
    margin: 0 0 0.625rem;
  }

  /* ROM region column width override */
  .crom-region-col {
    width: 18%;
    min-width: 130px;
  }

  /* ROM input width + degree symbol */
  .crom-input-wrap {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
  }

  .crom-input-w {
    width: 3.75rem;
  }

  .crom-deg {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #a3a3a3);
    pointer-events: none;
    user-select: none;
  }

  .crom-select-w {
    min-width: 9.5rem;
  }

  /* ─── MMT section ─── */

  .mmt-section {
    padding: 0.75rem 0.875rem 0.5rem;
  }

  /* MMT region column width override */
  .mmt-region-col {
    width: 40%;
  }

  .mmt-group-col {
    width: 25%;
  }

  .mmt-td--actions {
    text-align: center;
    padding: 0.375rem;
  }

  .mmt-select-w {
    width: 100%;
  }

  .mmt-name-input {
    width: 100%;
  }

  /* MMT delete button — bordered variant override on top of ct-btn-remove */
  .mmt-del-btn {
    border: 1px solid #e53935;
    color: #e53935;
    border-radius: 4px;
  }

  .mmt-del-btn:hover {
    background: #e53935;
    color: #fff;
  }

  /* ─── Special Tests section ─── */

  .st-section {
    padding: 0.75rem 0.875rem 0.5rem;
  }

  .st-td--purpose {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #757575);
    max-width: 12rem;
  }

  .st-select-w {
    min-width: 5rem;
  }

  .st-input-w {
    width: 100%;
    min-width: 7rem;
  }
</style>
