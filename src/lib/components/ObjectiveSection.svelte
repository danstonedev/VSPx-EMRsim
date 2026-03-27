<!--
  ObjectiveSection — editable objective SOAP fields.
  Vitals, observation text, ROM/MMT tables, special tests.
-->
<script lang="ts">
  import { noteDraft, updateField, updateSection } from '$lib/stores/noteSession';

  const section = $derived($noteDraft.objective);

  function field(key: string): string {
    return (section[key] as string) ?? '';
  }

  function nestedField(parent: string, key: string): string {
    const p = section[parent] as Record<string, string> | undefined;
    return p?.[key] ?? '';
  }

  function onInput(key: string, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    updateField('objective', key, target.value);
  }

  function onNestedInput(parent: string, key: string, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const current = (section[parent] as Record<string, string>) ?? {};
    updateField('objective', parent, { ...current, [key]: target.value });
  }

  // Regional assessment helpers
  const ra = $derived((section.regionalAssessments as Record<string, unknown>) ?? {});

  const romKeys = [
    { idx: '0', label: 'Flexion R' },
    { idx: '1', label: 'Flexion L' },
    { idx: '2', label: 'Extension R' },
    { idx: '3', label: 'Extension L' },
    { idx: '4', label: 'Abduction R' },
    { idx: '5', label: 'Abduction L' },
    { idx: '6', label: 'ER R' },
    { idx: '7', label: 'ER L' },
    { idx: '8', label: 'IR R' },
    { idx: '9', label: 'IR L' },
  ];

  const mmtKeys = [
    { idx: '0', label: 'Flexion R' },
    { idx: '1', label: 'Flexion L' },
    { idx: '2', label: 'Abduction R' },
    { idx: '3', label: 'Abduction L' },
    { idx: '4', label: 'ER R' },
    { idx: '5', label: 'ER L' },
    { idx: '6', label: 'IR R' },
    { idx: '7', label: 'IR L' },
    { idx: '8', label: 'Extension R' },
    { idx: '9', label: 'Extension L' },
    { idx: '10', label: 'Horiz. Add. R' },
    { idx: '11', label: 'Horiz. Add. L' },
  ];

  function romVal(idx: string): string {
    const rom = (ra.rom as Record<string, string>) ?? {};
    return rom[idx] ?? '';
  }

  function mmtVal(idx: string): string {
    const mmt = (ra.mmt as Record<string, string>) ?? {};
    return mmt[idx] ?? '';
  }

  function onRomInput(idx: string, e: Event) {
    const val = (e.target as HTMLInputElement).value;
    const rom = { ...((ra.rom as Record<string, string>) ?? {}), [idx]: val };
    updateField('objective', 'regionalAssessments', { ...ra, rom });
  }

  function onMmtInput(idx: string, e: Event) {
    const val = (e.target as HTMLInputElement).value;
    const mmt = { ...((ra.mmt as Record<string, string>) ?? {}), [idx]: val };
    updateField('objective', 'regionalAssessments', { ...ra, mmt });
  }

  // Special tests
  type SpecialTest = { left: string; right: string; notes: string };
  const specialTests = $derived((ra.specialTests as Record<string, SpecialTest>) ?? {});
  const testEntries = $derived(Object.entries(specialTests));

  function onTestInput(testKey: string, field_name: string, e: Event) {
    const val = (e.target as HTMLInputElement | HTMLSelectElement).value;
    const current = specialTests[testKey] ?? { left: '', right: '', notes: '' };
    const updated = { ...current, [field_name]: val };
    const allTests = { ...specialTests, [testKey]: updated };
    updateField('objective', 'regionalAssessments', { ...ra, specialTests: allTests });
  }

  function addSpecialTest() {
    const nextIdx = `test-${Object.keys(specialTests).length}`;
    const allTests = {
      ...specialTests,
      [nextIdx]: { left: '', right: '', notes: '' },
    };
    updateField('objective', 'regionalAssessments', { ...ra, specialTests: allTests });
  }

  // Vitals
  const vitals = $derived((section.vitals as Record<string, string>) ?? {});
  const vitalKeys = [
    { key: 'bp', label: 'BP' },
    { key: 'hr', label: 'HR' },
    { key: 'rr', label: 'RR' },
    { key: 'temp', label: 'Temp' },
    { key: 'o2sat', label: 'O2 Sat' },
    { key: 'pain', label: 'Pain' },
  ];

  function onVitalInput(key: string, e: Event) {
    const val = (e.target as HTMLInputElement).value;
    updateField('objective', 'vitals', { ...vitals, [key]: val });
  }
</script>

<div class="soap-section soap-objective">
  <fieldset class="soap-fieldset">
    <legend>General Observation</legend>
    <textarea
      rows="3"
      value={field('text')}
      oninput={(e) => onInput('text', e)}
      placeholder="General appearance, posture, movement patterns observed..."
    ></textarea>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Vitals</legend>
    <div class="vitals-grid">
      {#each vitalKeys as v}
        <label class="field-label field-label--compact">
          {v.label}
          <input type="text" value={vitals[v.key] ?? ''} oninput={(e) => onVitalInput(v.key, e)} />
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Inspection & Palpation</legend>
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
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Neuro Screening</legend>
    <textarea
      rows="2"
      value={nestedField('neuro', 'screening')}
      oninput={(e) => onNestedInput('neuro', 'screening', e)}
      placeholder="Dermatomes, myotomes, reflexes..."
    ></textarea>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Functional Assessment</legend>
    <textarea
      rows="2"
      value={nestedField('functional', 'assessment')}
      oninput={(e) => onNestedInput('functional', 'assessment', e)}
      placeholder="Gait, balance, transfers, functional tasks..."
    ></textarea>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>AROM (degrees)</legend>
    <div class="rom-grid">
      {#each romKeys as r}
        <label class="field-label field-label--compact">
          {r.label}
          <input type="text" value={romVal(r.idx)} oninput={(e) => onRomInput(r.idx, e)} />
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>MMT (0–5)</legend>
    <div class="rom-grid">
      {#each mmtKeys as m}
        <label class="field-label field-label--compact">
          {m.label}
          <input type="text" value={mmtVal(m.idx)} oninput={(e) => onMmtInput(m.idx, e)} />
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Special Tests</legend>
    {#if testEntries.length > 0}
      <table class="special-tests-table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Left</th>
            <th>Right</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {#each testEntries as [key, test]}
            <tr>
              <td class="test-label">{key.replace('test-', 'Test ')}</td>
              <td>
                <select value={test.left} onchange={(e) => onTestInput(key, 'left', e)}>
                  <option value="">—</option>
                  <option value="positive">+</option>
                  <option value="negative">−</option>
                </select>
              </td>
              <td>
                <select value={test.right} onchange={(e) => onTestInput(key, 'right', e)}>
                  <option value="">—</option>
                  <option value="positive">+</option>
                  <option value="negative">−</option>
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={test.notes}
                  oninput={(e) => onTestInput(key, 'notes', e)}
                  placeholder="Describe finding..."
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
    <button type="button" class="btn-add" onclick={addSpecialTest}>+ Add Special Test</button>
  </fieldset>
</div>

<style>
  .soap-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .soap-fieldset {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin: 0;
    background: white;
  }

  .soap-fieldset legend {
    font-weight: 600;
    font-size: 0.875rem;
    color: white;
    padding: 0.375rem 0.75rem;
    background: linear-gradient(180deg, #424242 0%, #525252 100%);
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .soap-fieldset > textarea {
    margin-top: 0.5rem;
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

  .vitals-grid,
  .rom-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
  }

  .vitals-grid .field-label--compact {
    min-width: 70px;
    max-width: 100px;
  }

  .rom-grid .field-label--compact {
    min-width: 90px;
    max-width: 110px;
  }

  .rom-grid .field-label--compact input,
  .vitals-grid .field-label--compact input {
    text-align: center;
  }

  .special-tests-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .special-tests-table th {
    text-align: left;
    font-weight: 600;
    font-size: 0.8125rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-panel-header, #616161);
    color: white;
  }

  .special-tests-table th:first-child {
    border-radius: 8px 0 0 0;
  }

  .special-tests-table th:last-child {
    border-radius: 0 8px 0 0;
  }

  .special-tests-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .special-tests-table tbody tr:nth-child(even) {
    background: var(--color-neutral-50, #fafafa);
  }

  .test-label {
    font-weight: 500;
    white-space: nowrap;
  }

  .btn-add {
    background: none;
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    min-height: 44px;
    font-size: 0.8125rem;
    color: var(--color-brand-green, #009a44);
    cursor: pointer;
    font-weight: 600;
  }

  .btn-add:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
  }
</style>
