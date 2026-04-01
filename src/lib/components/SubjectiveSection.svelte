<!--
  SubjectiveSection — editable subjective SOAP fields.
  Organized into collapsible subsections: History, Interview Q&A, Pain Assessment,
  Red Flag Screening (categorized 3-state cycling), Medications (searchable DB).
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';
  import type { SubjectiveData, QAPair, MedicationRecord } from '$lib/types/sections';
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import GroupedToggleBoard from './GroupedToggleBoard.svelte';
  import MedicationPanel from './MedicationPanel.svelte';
  import {
    RED_FLAG_CATEGORIES,
    createDefaultScreening,
    nextRedFlagStatus,
    buildRedFlagSummary,
    type RedFlagStatus,
    type RedFlagEntry,
  } from '$lib/config/redFlagCategories';
  import { useNoteTemplate, isSubsectionVisible } from '$lib/config/templates';

  const noteTemplate = useNoteTemplate();

  const ONSET_OPTIONS = [
    { value: '', label: 'Select onset...' },
    { value: 'acute', label: 'Acute (< 7 days)' },
    { value: 'subacute', label: 'Subacute (7 days – 6 weeks)' },
    { value: 'chronic', label: 'Chronic (> 6 weeks)' },
    { value: 'insidious', label: 'Insidious / Gradual' },
    { value: 'recurrent', label: 'Recurrent Episode' },
  ];

  const MECHANISM_OPTIONS = [
    { value: '', label: 'Select mechanism...' },
    { value: 'trauma', label: 'Traumatic Injury' },
    { value: 'overuse', label: 'Overuse / Repetitive' },
    { value: 'post-surgical', label: 'Post-Surgical' },
    { value: 'insidious', label: 'Insidious / No Known Mechanism' },
    { value: 'fall', label: 'Fall' },
    { value: 'mva', label: 'Motor Vehicle Accident' },
    { value: 'sport', label: 'Sport / Athletic Injury' },
    { value: 'degenerative', label: 'Degenerative / Age-Related' },
    { value: 'other', label: 'Other' },
  ];

  const FUNCTIONAL_LIMITATION_CHECKLIST = [
    'Reaching overhead',
    'Lifting / carrying',
    'Walking (community)',
    'Stairs',
    'Transfers (sit↔stand)',
    'Sleeping',
    'Dressing / grooming',
    'Sitting tolerance',
    'Standing tolerance',
    'Driving',
    'Work tasks',
    'Recreational activities',
  ];

  const FUNCTIONAL_LIMITATION_GROUPS = [
    {
      id: 'mobility',
      label: 'Mobility and Transfers',
      helper: 'How the condition is affecting movement through the environment.',
      items: ['Walking (community)', 'Stairs', 'Transfers (sit↔stand)', 'Driving'].map((item) => ({
        value: item,
        label: item,
      })),
    },
    {
      id: 'tolerance',
      label: 'Tolerance and Positioning',
      helper: 'Endurance, positional comfort, and sustained task limits.',
      items: ['Sitting tolerance', 'Standing tolerance', 'Sleeping'].map((item) => ({
        value: item,
        label: item,
      })),
    },
    {
      id: 'self-care',
      label: 'Self-Care and Handling',
      helper: 'Body care, reaching, and carrying demands.',
      items: ['Reaching overhead', 'Lifting / carrying', 'Dressing / grooming'].map((item) => ({
        value: item,
        label: item,
      })),
    },
    {
      id: 'life-roles',
      label: 'Work and Participation',
      helper: 'School, work, and recreation roles most affected.',
      items: ['Work tasks', 'Recreational activities'].map((item) => ({
        value: item,
        label: item,
      })),
    },
  ];

  const PAIN_QUALITY_OPTIONS = [
    '',
    'Sharp / Stabbing',
    'Dull / Aching',
    'Burning',
    'Throbbing / Pulsing',
    'Cramping',
    'Tingling',
    'Numbness',
    'Stiffness',
  ];
  const PAIN_PATTERN_OPTIONS = [
    '',
    'Constant',
    'Intermittent',
    'Morning stiffness',
    'End-of-day',
    'Activity-related',
    'Positional',
    'Weather-related',
  ];

  const section = $derived($noteDraft.subjective);

  // Collapsible state
  let collapsed = $state<Record<string, boolean>>({});

  function isCollapsed(id: string): boolean {
    return collapsed[id] ?? false;
  }

  function toggleCollapse(id: string) {
    collapsed = { ...collapsed, [id]: !collapsed[id] };
  }

  function field(key: keyof SubjectiveData): string {
    const v = section[key];
    return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';
  }

  function onInput(key: keyof SubjectiveData, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    updateField('subjective', key, target.value);
  }

  function onSelect(key: keyof SubjectiveData, e: Event) {
    const target = e.target as HTMLSelectElement;
    updateField('subjective', key, target.value);
  }

  // ── Pain Scale (clickable 0-10) ──
  const painScaleValue = $derived(
    typeof section.painScale === 'number'
      ? section.painScale
      : typeof section.painScale === 'string' && section.painScale !== ''
        ? parseInt(section.painScale, 10)
        : -1,
  );

  function setPainScale(val: number) {
    updateField('subjective', 'painScale', val);
  }

  function painScaleColor(val: number): string {
    if (val <= 3) return 'var(--color-brand-green, #009a44)';
    if (val <= 6) return '#f9a825';
    return '#d32f2f';
  }

  // ── Interview Q&A ──
  const qaItems = $derived(section.qaItems ?? []);

  function onQAInput(idx: number, field_name: 'question' | 'response', e: Event) {
    const val = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    const updated = qaItems.map((item, i) => (i === idx ? { ...item, [field_name]: val } : item));
    updateField('subjective', 'qaItems', updated);
  }

  function addQAPair() {
    updateField('subjective', 'qaItems', [...qaItems, { question: '', response: '' }]);
  }

  function removeQAPair(idx: number) {
    updateField(
      'subjective',
      'qaItems',
      qaItems.filter((_, i) => i !== idx),
    );
  }

  // ── Red Flag Screening (categorized, 3-state cycling) ──
  const redFlagScreening = $derived<RedFlagEntry[]>(
    section.redFlagScreening?.length
      ? (section.redFlagScreening as RedFlagEntry[])
      : createDefaultScreening(),
  );

  const presentCount = $derived(redFlagScreening.filter((f) => f.status === 'present').length);

  function cycleRedFlagStatus(id: string) {
    const updated = redFlagScreening.map((f) =>
      f.id === id ? { ...f, status: nextRedFlagStatus(f.status as RedFlagStatus) } : f,
    );
    updateField('subjective', 'redFlagScreening', updated);
    updateField('subjective', 'redFlags', buildRedFlagSummary(updated));
  }

  function onRedFlagNote(id: string, e: Event) {
    const val = (e.target as HTMLInputElement).value;
    const updated = redFlagScreening.map((f) => (f.id === id ? { ...f, note: val } : f));
    updateField('subjective', 'redFlagScreening', updated);
  }

  function getItemsForCategory(catId: string): RedFlagEntry[] {
    const cat = RED_FLAG_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return [];
    const ids = new Set(cat.items.map((i) => i.id));
    return redFlagScreening.filter((f) => ids.has(f.id));
  }

  function statusLabel(s: string) {
    if (s === 'denied') return '−';
    if (s === 'present') return '+';
    return '?';
  }

  function statusClass(s: string) {
    if (s === 'denied') return 'rf-btn--denied';
    if (s === 'present') return 'rf-btn--present';
    return 'rf-btn--unscreened';
  }

  // ── Functional Limitation Checklist ──
  const funcLimitChecklist = $derived.by((): string[] => {
    const fl = section.functionalLimitationChecklist;
    return Array.isArray(fl) ? fl : [];
  });

  function toggleFuncLimit(item: string) {
    const updated = funcLimitChecklist.includes(item)
      ? funcLimitChecklist.filter((f) => f !== item)
      : [...funcLimitChecklist, item];
    updateField('subjective', 'functionalLimitationChecklist', updated);
  }

  // ── Medications ──
  const medications = $derived<MedicationRecord[]>(section.medications ?? []);

  function onMedsUpdate(meds: MedicationRecord[]) {
    updateField('subjective', 'medications', meds);
  }
</script>

<div class="soap-section soap-subjective">
  <!-- 1. HISTORY -->
  {#if isSubsectionVisible(noteTemplate, 'subjective', 'history')}
    <CollapsibleSubsection
      title="History"
      open={!isCollapsed('history')}
      onToggle={() => toggleCollapse('history')}
      dataSubsection="history"
    >
      <label class="field-label">
        Chief Complaint
        <textarea
          rows="2"
          value={field('chiefComplaint')}
          oninput={(e) => onInput('chiefComplaint', e)}
          placeholder="Primary reason for referral or visit in the patient's own words (e.g., 'Right shoulder pain limiting overhead activities for 3 weeks')"
        ></textarea>
      </label>

      <div class="field-row">
        <label class="field-label">
          Onset / Acuity
          <select value={field('onset')} onchange={(e) => onSelect('onset', e)}>
            {#each ONSET_OPTIONS as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>
        <label class="field-label">
          Mechanism of Injury
          <select value={field('mechanism')} onchange={(e) => onSelect('mechanism', e)}>
            {#each MECHANISM_OPTIONS as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>
      </div>

      <label class="field-label">
        History of Present Illness
        <textarea
          rows="2"
          value={field('historyOfPresentIllness')}
          oninput={(e) => onInput('historyOfPresentIllness', e)}
          placeholder="Duration, progression, prior treatment. Include 24-hour symptom pattern and current functional status."
        ></textarea>
      </label>

      <GroupedToggleBoard
        label="Functional Limitations"
        helper="Choose the common activities the patient is already struggling with, then add specifics below."
        groups={FUNCTIONAL_LIMITATION_GROUPS}
        selected={funcLimitChecklist}
        onToggle={toggleFuncLimit}
        selectedLabel="Selected activity limits"
        emptyLabel="No common functional limits selected yet."
      />
      <label class="field-label">
        Functional Limitation Details
        <textarea
          rows="2"
          value={field('functionalLimitations')}
          oninput={(e) => onInput('functionalLimitations', e)}
          placeholder="Additional details about functional limitations (e.g., 'Unable to reach overhead, difficulty sleeping on affected side')"
        ></textarea>
      </label>

      <label class="field-label">
        Prior Level of Function
        <textarea
          rows="2"
          value={field('priorLevel')}
          oninput={(e) => onInput('priorLevel', e)}
          placeholder="Baseline functional level prior to current episode (e.g., 'Independent with all ADLs, walks 2 miles daily, works full-time as mechanic')"
        ></textarea>
      </label>
      <label class="field-label">
        Patient Goals
        <textarea
          rows="2"
          value={field('patientGoals')}
          oninput={(e) => onInput('patientGoals', e)}
          placeholder="Patient-stated goals in their own words (e.g., 'Return to playing tennis, sleep through the night without pain')"
        ></textarea>
      </label>

      <label class="field-label">
        Past Medical History
        <textarea
          rows="2"
          value={field('pastMedicalHistory')}
          oninput={(e) => onInput('pastMedicalHistory', e)}
          placeholder="Relevant comorbidities: HTN, DM, cardiac, neurological, rheumatologic conditions..."
        ></textarea>
      </label>
      <label class="field-label">
        Surgical History
        <textarea
          rows="2"
          value={field('surgicalHistory')}
          oninput={(e) => onInput('surgicalHistory', e)}
          placeholder="Prior surgeries with dates (e.g., 'R rotator cuff repair 2019, L TKA 2021')"
        ></textarea>
      </label>
      <label class="field-label">
        Social History
        <textarea
          rows="2"
          value={field('socialHistory')}
          oninput={(e) => onInput('socialHistory', e)}
          placeholder="Living situation, occupation, activity level, support system, relevant habits..."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- 2. INTERVIEW Q&A -->
  {#if isSubsectionVisible(noteTemplate, 'subjective', 'interview-qa')}
    <CollapsibleSubsection
      title="Interview Q&A"
      open={!isCollapsed('interview-qa')}
      onToggle={() => toggleCollapse('interview-qa')}
      dataSubsection="interview-qa"
    >
      {#if qaItems.length > 0}
        <div class="qa-items">
          {#each qaItems as qa, i}
            <div class="qa-pair">
              <div class="qa-pair__header">
                <span class="qa-pair__num">Q{i + 1}</span>
                <button
                  type="button"
                  class="qa-pair__remove"
                  aria-label="Remove Q&A pair {i + 1}"
                  onclick={() => removeQAPair(i)}>✕</button
                >
              </div>
              <label class="field-label">
                Question
                <input
                  type="text"
                  value={qa.question}
                  oninput={(e) => onQAInput(i, 'question', e)}
                  placeholder="What question was asked?"
                />
              </label>
              <label class="field-label">
                Response
                <textarea
                  rows="2"
                  value={qa.response}
                  oninput={(e) => onQAInput(i, 'response', e)}
                  placeholder="Patient's response..."
                ></textarea>
              </label>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-hint">No interview questions recorded yet.</p>
      {/if}
      <button type="button" class="btn-add" onclick={addQAPair}>+ Add Q&A Pair</button>
    </CollapsibleSubsection>
  {/if}

  <!-- 3. PAIN ASSESSMENT (clickable 0-10, quality/pattern dropdowns) -->
  {#if isSubsectionVisible(noteTemplate, 'subjective', 'pain-assessment')}
    <CollapsibleSubsection
      title="Pain Assessment"
      open={!isCollapsed('pain-assessment')}
      onToggle={() => toggleCollapse('pain-assessment')}
      dataSubsection="pain-assessment"
    >
      <label class="field-label">
        Location
        <input
          type="text"
          value={field('painLocation')}
          oninput={(e) => onInput('painLocation', e)}
          placeholder="e.g. Right shoulder, anterior/lateral"
        />
      </label>

      <!-- Clickable pain scale 0-10 -->
      <fieldset class="pain-scale-field">
        <legend class="pain-scale-label">Pain Scale (0–10)</legend>
        <div class="pain-scale-row" role="radiogroup" aria-label="Pain intensity scale 0-10">
          {#each Array(11) as _, n}
            <button
              type="button"
              class="pain-scale-btn"
              class:pain-scale-btn--selected={painScaleValue === n}
              style={painScaleValue === n
                ? `background: ${painScaleColor(n)}; color: white; border-color: ${painScaleColor(n)};`
                : ''}
              role="radio"
              aria-checked={painScaleValue === n}
              aria-label="Pain level {n}"
              onclick={() => setPainScale(n)}>{n}</button
            >
          {/each}
        </div>
        {#if painScaleValue >= 0}
          <span class="pain-scale-readout">{painScaleValue}/10</span>
        {/if}
      </fieldset>

      <div class="field-row">
        <label class="field-label">
          Quality
          <select value={field('painQuality')} onchange={(e) => onSelect('painQuality', e)}>
            {#each PAIN_QUALITY_OPTIONS as opt}
              <option value={opt}>{opt || 'Select quality…'}</option>
            {/each}
          </select>
        </label>
        <label class="field-label">
          Pattern
          <select value={field('painPattern')} onchange={(e) => onSelect('painPattern', e)}>
            {#each PAIN_PATTERN_OPTIONS as opt}
              <option value={opt}>{opt || 'Select pattern…'}</option>
            {/each}
          </select>
        </label>
      </div>

      <label class="field-label">
        Aggravating Factors
        <textarea
          rows="2"
          value={field('aggravatingFactors')}
          oninput={(e) => onInput('aggravatingFactors', e)}
          placeholder="Movements, positions, or activities that increase symptoms (e.g., 'Overhead reaching, lying on R side, lifting >10 lbs')"
        ></textarea>
      </label>
      <label class="field-label">
        Easing Factors
        <textarea
          rows="2"
          value={field('easingFactors')}
          oninput={(e) => onInput('easingFactors', e)}
          placeholder="Movements, positions, or modalities that decrease symptoms (e.g., 'Rest, ice, NSAIDs, arm supported at side')"
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- 4. RED FLAG SCREENING (categorized, 3-state cycling) -->
  {#if isSubsectionVisible(noteTemplate, 'subjective', 'red-flag-screening')}
    <CollapsibleSubsection
      title="Red Flag Screening"
      open={!isCollapsed('red-flag-screening')}
      onToggle={() => toggleCollapse('red-flag-screening')}
      dataSubsection="red-flag-screening"
    >
      {#snippet titleExtra()}
        {#if presentCount > 0}
          <span class="rf-badge">{presentCount}</span>
        {/if}
      {/snippet}
      <p class="rf-instructions">
        Click status button to cycle: <span class="rf-legend rf-legend--unscreened">?</span> Not
        Screened → <span class="rf-legend rf-legend--denied">−</span> Denied →
        <span class="rf-legend rf-legend--present">+</span> Present
      </p>

      {#each RED_FLAG_CATEGORIES as cat}
        <fieldset class="rf-category">
          <legend class="rf-category__legend">{cat.label}</legend>
          {#each getItemsForCategory(cat.id) as flag}
            <div class="rf-item">
              <button
                type="button"
                class="rf-status-btn {statusClass(flag.status)}"
                aria-label="{flag.item}: {flag.status}"
                onclick={() => cycleRedFlagStatus(flag.id)}>{statusLabel(flag.status)}</button
              >
              <span class="rf-item__label">{flag.item}</span>
              {#if flag.status === 'present'}
                <input
                  type="text"
                  class="rf-item__note"
                  placeholder="Note…"
                  value={flag.note ?? ''}
                  oninput={(e) => onRedFlagNote(flag.id, e)}
                />
              {/if}
            </div>
          {/each}
        </fieldset>
      {/each}

      <label class="field-label" style="margin-top: 0.75rem;">
        Additional Notes
        <textarea
          rows="2"
          value={field('redFlags')}
          oninput={(e) => onInput('redFlags', e)}
          placeholder="Additional red flag screening notes..."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}

  <!-- 5. MEDICATION & SUPPLEMENTS (searchable DB) -->
  {#if isSubsectionVisible(noteTemplate, 'subjective', 'current-medications')}
    <CollapsibleSubsection
      title="Medication & Supplements"
      open={!isCollapsed('current-medications')}
      onToggle={() => toggleCollapse('current-medications')}
      dataSubsection="current-medications"
    >
      <MedicationPanel {medications} onUpdate={onMedsUpdate} />
    </CollapsibleSubsection>
  {/if}
</div>

<style>
  .soap-section {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .field-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
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

  /* Q&A pairs */
  .qa-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .qa-pair {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    padding: 0.75rem;
    background: var(--color-neutral-50, #fafafa);
  }

  .qa-pair__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .qa-pair__num {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-brand-green, #009a44);
    text-transform: uppercase;
  }

  .qa-pair__remove {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-neutral-400, #9e9e9e);
    padding: 0.125rem 0.25rem;
    border-radius: 4px;
    line-height: 1;
  }

  .qa-pair__remove:hover {
    background: var(--color-neutral-200, #e0e0e0);
    color: #d32f2f;
  }

  .empty-hint {
    font-size: 0.8125rem;
    color: var(--color-neutral-400, #9e9e9e);
    font-style: italic;
    margin: 0.25rem 0 0.5rem;
  }

  /* Pain scale widget */
  .pain-scale-field {
    margin-top: 0.75rem;
  }

  .pain-scale-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #616161);
    display: block;
    margin-bottom: 0.375rem;
  }

  .pain-scale-field {
    border: none;
    padding: 0;
    margin: 0;
  }

  .pain-scale-row {
    display: flex;
    gap: 0;
  }

  .pain-scale-btn {
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    background: var(--color-surface, #ffffff);
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-neutral-700, #424242);
    transition: all 0.1s;
    flex-shrink: 0;
  }

  .pain-scale-btn:first-child {
    border-radius: 6px 0 0 6px;
  }

  .pain-scale-btn:last-child {
    border-radius: 0 6px 6px 0;
  }

  .pain-scale-btn + .pain-scale-btn {
    border-left: none;
  }

  .pain-scale-btn:hover:not(.pain-scale-btn--selected) {
    background: var(--color-neutral-100, #f5f5f5);
  }

  .pain-scale-btn--selected {
    font-weight: 700;
    transform: scale(1.08);
    z-index: 1;
    position: relative;
    border-left: 1px solid;
  }

  .pain-scale-readout {
    display: inline-block;
    margin-left: 0.75rem;
    font-weight: 700;
    font-size: 0.875rem;
    color: var(--color-neutral-700, #424242);
    vertical-align: middle;
  }

  /* Red flag screening — categorized */
  .rf-instructions {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #757575);
    margin: 0 0 0.75rem;
  }

  .rf-legend {
    display: inline-flex;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 700;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    margin: 0 0.125rem;
  }

  .rf-legend--unscreened {
    background: var(--color-neutral-200, #e0e0e0);
    color: var(--color-neutral-600, #616161);
  }

  .rf-legend--denied {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .rf-legend--present {
    background: #fff3e0;
    color: #e65100;
  }

  .rf-badge {
    background: #d32f2f;
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    padding: 0.0625rem 0.375rem;
    border-radius: 8px;
    min-width: 16px;
    text-align: center;
    line-height: 1.3;
  }

  .rf-category {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.5rem;
  }

  .rf-category__legend {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-neutral-600, #616161);
    padding: 0 0.375rem;
  }

  .rf-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
  }

  .rf-status-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 2px solid;
    font-weight: 700;
    font-size: 0.8125rem;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.12s;
  }

  :global(.rf-btn--unscreened) {
    background: var(--color-neutral-100, #f5f5f5);
    border-color: var(--color-neutral-300, #d4d4d4);
    color: var(--color-neutral-500, #757575);
  }

  :global(.rf-btn--denied) {
    background: #e8f5e9;
    border-color: #43a047;
    color: #2e7d32;
  }

  :global(.rf-btn--present) {
    background: #fff3e0;
    border-color: #ff671f;
    color: #e65100;
  }

  .rf-item__label {
    font-size: 0.8125rem;
    flex: 1;
    min-width: 0;
  }

  .rf-item__note {
    flex: 0 0 180px;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ff671f;
    border-radius: 4px;
    background: #fff8f0;
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

  @media (max-width: 640px) {
    .pain-scale-btn {
      width: 30px;
      height: 40px;
      font-size: 0.75rem;
    }
    .pain-scale-row {
      gap: 2px;
    }
  }
</style>
