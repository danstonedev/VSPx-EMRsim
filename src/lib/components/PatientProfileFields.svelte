<script lang="ts">
  import { updateField, noteDraft } from '$lib/stores/noteSession';
  import type { SubjectiveData } from '$lib/types/sections';
  import type { CaseObj } from '$lib/store';
  import type { VspRecord } from '$lib/services/vspRegistry';
  import { computeAge, displayName } from '$lib/services/vspRegistry';

  interface Props {
    caseObj?: CaseObj | null;
    vspPatient?: VspRecord | null;
    readonly?: boolean;
  }

  let { caseObj = null, vspPatient = null, readonly = false }: Props = $props();

  const SEX_OPTIONS = [
    { value: '', label: 'Select sex' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'other', label: 'Other' },
    { value: 'unspecified', label: 'Prefer not to say' },
  ];

  const PRONOUNS_OPTIONS = [
    { value: '', label: 'Select option' },
    { value: 'Woman (she/her)', label: 'Woman (she/her)' },
    { value: 'Man (he/him)', label: 'Man (he/him)' },
    { value: 'Non-binary (they/them)', label: 'Non-binary (they/them)' },
    { value: 'Trans woman (she/her)', label: 'Trans woman (she/her)' },
    { value: 'Trans man (he/him)', label: 'Trans man (he/him)' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
    { value: 'Use name only', label: 'Use name only' },
  ];

  const LANGUAGE_OPTIONS = [
    '',
    'English',
    'Spanish',
    'French',
    'German',
    'Mandarin',
    'Cantonese',
    'Vietnamese',
    'Korean',
    'Arabic',
    'Somali',
    'Hmong',
    'Russian',
    'Portuguese',
    'Tagalog',
    'Other / Custom',
  ];

  const INTERPRETER_OPTIONS = [
    { value: '', label: 'Select option' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  const section = $derived($noteDraft.subjective ?? {});

  const fallbackName = $derived.by((): string => {
    const value = vspPatient
      ? displayName(vspPatient)
      : (caseObj?.patientName ?? caseObj?.snapshot?.name);
    return typeof value === 'string' ? value : '';
  });

  const fallbackDob = $derived.by((): string => {
    const value = vspPatient?.dob ?? caseObj?.snapshot?.dob;
    return typeof value === 'string' ? value : '';
  });

  const fallbackAge = $derived.by(() => {
    if (typeof section.patientBirthday === 'string' && section.patientBirthday) {
      return computeAge(section.patientBirthday)?.toString() ?? '';
    }
    if (typeof section.patientAge === 'string' && section.patientAge) return section.patientAge;
    if (fallbackDob) return computeAge(fallbackDob)?.toString() ?? '';
    return caseObj?.snapshot?.age?.toString() ?? '';
  });

  const fallbackSex = $derived.by((): string => {
    const value = vspPatient?.sex ?? caseObj?.snapshot?.sex;
    return typeof value === 'string' ? value : '';
  });

  const fallbackPronouns = $derived.by((): string => {
    const value = vspPatient?.pronouns ?? caseObj?.snapshot?.pronouns;
    return typeof value === 'string' ? value : '';
  });

  const fallbackLanguage = $derived.by((): string => {
    const value = vspPatient?.preferredLanguage ?? caseObj?.snapshot?.preferredLanguage;
    return typeof value === 'string' ? value : '';
  });

  const fallbackInterpreter = $derived.by((): string => {
    if (typeof vspPatient?.interpreterNeeded === 'boolean') {
      return vspPatient.interpreterNeeded ? 'Yes' : 'No';
    }
    return '';
  });

  const fallbackHeightFt = $derived.by((): string => vspPatient?.heightFt?.toString() ?? '');
  const fallbackHeightIn = $derived.by((): string => vspPatient?.heightIn?.toString() ?? '');
  const fallbackWeight = $derived.by((): string => vspPatient?.weightLbs?.toString() ?? '');

  function field(key: keyof SubjectiveData, fallback = ''): string {
    if (readonly && fallback) return fallback;
    const value = section[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return fallback;
  }

  function onInput(key: keyof SubjectiveData, event: Event) {
    if (readonly) return;
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    updateField('subjective', key, target.value);
  }

  function onSelect(key: keyof SubjectiveData, event: Event) {
    if (readonly) return;
    const target = event.target as HTMLSelectElement;
    updateField('subjective', key, target.value);
  }

  function computeBmi(heightFt: string, heightIn: string, weightLbs: string): string {
    const ft = parseFloat(heightFt || '0');
    const inches = parseFloat(heightIn || '0');
    const lbs = parseFloat(weightLbs || '0');
    const totalInches = ft * 12 + inches;
    if (totalInches > 0 && lbs > 0) return ((lbs / (totalInches * totalInches)) * 703).toFixed(1);
    return '';
  }

  function bmiCategory(bmi: string): { label: string; cls: string } | null {
    const value = parseFloat(bmi);
    if (Number.isNaN(value)) return null;
    if (value < 18.5)
      return { label: 'Underweight', cls: 'patient-profile__bmi-badge--underweight' };
    if (value < 25) return { label: 'Normal', cls: 'patient-profile__bmi-badge--normal' };
    if (value < 30) return { label: 'Overweight', cls: 'patient-profile__bmi-badge--overweight' };
    return { label: 'Obese', cls: 'patient-profile__bmi-badge--obese' };
  }

  function formatDateDisplay(value: string): string {
    if (!value) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    return `${match[2]}/${match[3]}/${match[1]}`;
  }

  function present(value: string, fallback = 'Not provided'): string {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  const heightFt = $derived(field('patientHeightFt', fallbackHeightFt));
  const heightIn = $derived(field('patientHeightIn', fallbackHeightIn));
  const weightLbs = $derived(field('patientWeight', fallbackWeight));
  const derivedAge = $derived(field('patientAge', fallbackAge));
  const profileBmi = $derived(computeBmi(heightFt, heightIn, weightLbs));
  const profileBmiCat = $derived(bmiCategory(profileBmi));

  function onDobChange(event: Event) {
    if (readonly) return;
    const value = (event.target as HTMLInputElement).value;
    updateField('subjective', 'patientBirthday', value);
    updateField('subjective', 'patientAge', computeAge(value)?.toString() ?? '');
  }

  function onBodyMeasurement(
    key: 'patientHeightFt' | 'patientHeightIn' | 'patientWeight',
    event: Event,
  ) {
    if (readonly) return;
    const value = (event.target as HTMLInputElement).value;
    updateField('subjective', key, value);
    const nextHeightFt = key === 'patientHeightFt' ? value : heightFt;
    const nextHeightIn = key === 'patientHeightIn' ? value : heightIn;
    const nextWeight = key === 'patientWeight' ? value : weightLbs;
    updateField('subjective', 'patientBmi', computeBmi(nextHeightFt, nextHeightIn, nextWeight));
  }
</script>

<section class="patient-profile" class:patient-profile--readonly={readonly}>
  {#if !readonly}
    <div class="patient-profile__header">
      <div class="patient-profile__title-row">
        <h3 class="patient-profile__title">Profile Details</h3>
      </div>
      <p class="patient-profile__copy">This information is shared with the note and export.</p>
    </div>
  {/if}

  {#if readonly}
    <div class="patient-profile__print">
      <section class="patient-profile__print-section">
        <h4 class="patient-profile__print-heading">Identity</h4>
        <dl class="patient-profile__print-list">
          <div class="patient-profile__print-row patient-profile__print-row--wide">
            <dt>Full Name</dt>
            <dd>{present(field('patientName', fallbackName))}</dd>
          </div>
          <div class="patient-profile__print-row">
            <dt>Date of Birth</dt>
            <dd>{present(formatDateDisplay(field('patientBirthday', fallbackDob)))}</dd>
          </div>
          <div class="patient-profile__print-row">
            <dt>Age</dt>
            <dd>{present(derivedAge)}</dd>
          </div>
          <div class="patient-profile__print-row">
            <dt>Sex</dt>
            <dd>{present(field('patientGender', fallbackSex))}</dd>
          </div>
          <div class="patient-profile__print-row">
            <dt>Gender Identity / Pronouns</dt>
            <dd>{present(field('patientGenderIdentityPronouns', fallbackPronouns))}</dd>
          </div>
          <div class="patient-profile__print-row">
            <dt>Preferred Language</dt>
            <dd>{present(field('patientPreferredLanguage', fallbackLanguage))}</dd>
          </div>
          <div class="patient-profile__print-row">
            <dt>Interpreter Needed</dt>
            <dd>{present(field('patientInterpreterNeeded', fallbackInterpreter))}</dd>
          </div>
        </dl>
      </section>

      <section class="patient-profile__print-section">
        <h4 class="patient-profile__print-heading">Measurements</h4>
        <dl class="patient-profile__print-list">
          <div class="patient-profile__print-row">
            <dt>Height (ft)</dt>
            <dd>{present(heightFt)}</dd>
          </div>
          <div class="patient-profile__print-row">
            <dt>Height (in)</dt>
            <dd>{present(heightIn)}</dd>
          </div>
          <div class="patient-profile__print-row">
            <dt>Weight (lbs)</dt>
            <dd>{present(weightLbs)}</dd>
          </div>
          <div class="patient-profile__print-row">
            <dt>BMI</dt>
            <dd>
              <span>{present(profileBmi)}</span>
              {#if profileBmiCat}
                <span class={`patient-profile__bmi-badge ${profileBmiCat.cls}`}
                  >{profileBmiCat.label}</span
                >
              {/if}
            </dd>
          </div>
        </dl>
      </section>

      <section class="patient-profile__print-section">
        <h4 class="patient-profile__print-heading">Social</h4>
        <dl class="patient-profile__print-list">
          <div class="patient-profile__print-row patient-profile__print-row--wide">
            <dt>Work Status / Occupation</dt>
            <dd>{present(field('patientWorkStatusOccupation'))}</dd>
          </div>
          <div class="patient-profile__print-row patient-profile__print-row--wide">
            <dt>Living Situation / Home Environment</dt>
            <dd>{present(field('patientLivingSituationHomeEnvironment'))}</dd>
          </div>
          <div class="patient-profile__print-row patient-profile__print-row--wide">
            <dt>Social Support</dt>
            <dd>{present(field('patientSocialSupport'))}</dd>
          </div>
        </dl>
      </section>
    </div>
  {:else}
    <div class="patient-profile__grid">
      <label class="patient-profile__field patient-profile__field--full">
        <span>Full Name</span>
        <input
          type="text"
          value={field('patientName', fallbackName)}
          oninput={(event) => onInput('patientName', event)}
          placeholder="Patient full name"
        />
      </label>

      <label class="patient-profile__field">
        <span>Date of Birth</span>
        <input
          type="date"
          value={field('patientBirthday', fallbackDob)}
          onchange={onDobChange}
          min="1900-01-01"
          max={new Date().toISOString().slice(0, 10)}
        />
      </label>

      <label class="patient-profile__field">
        <span>Age</span>
        <input type="text" value={derivedAge} readonly tabindex="-1" placeholder="auto" />
      </label>

      <label class="patient-profile__field">
        <span>Sex</span>
        <select
          value={field('patientGender', fallbackSex)}
          onchange={(event) => onSelect('patientGender', event)}
        >
          {#each SEX_OPTIONS as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label class="patient-profile__field">
        <span>Gender Identity / Pronouns</span>
        <select
          value={field('patientGenderIdentityPronouns', fallbackPronouns)}
          onchange={(event) => onSelect('patientGenderIdentityPronouns', event)}
        >
          {#each PRONOUNS_OPTIONS as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label class="patient-profile__field">
        <span>Preferred Language</span>
        <select
          value={field('patientPreferredLanguage', fallbackLanguage)}
          onchange={(event) => onSelect('patientPreferredLanguage', event)}
        >
          {#each LANGUAGE_OPTIONS as language}
            <option value={language}>{language || 'Select language'}</option>
          {/each}
        </select>
      </label>

      <label class="patient-profile__field">
        <span>Interpreter Needed</span>
        <select
          value={field('patientInterpreterNeeded', fallbackInterpreter.toLowerCase())}
          onchange={(event) => onSelect('patientInterpreterNeeded', event)}
        >
          {#each INTERPRETER_OPTIONS as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="patient-profile__divider"></div>

    <div class="patient-profile__measurements">
      <label class="patient-profile__field patient-profile__field--compact">
        <span>Height (ft)</span>
        <input
          type="number"
          value={heightFt}
          oninput={(event) => onBodyMeasurement('patientHeightFt', event)}
          placeholder="5"
          min="0"
          max="8"
        />
      </label>

      <label class="patient-profile__field patient-profile__field--compact">
        <span>Height (in)</span>
        <input
          type="number"
          value={heightIn}
          oninput={(event) => onBodyMeasurement('patientHeightIn', event)}
          placeholder="10"
          min="0"
          max="11"
        />
      </label>

      <label class="patient-profile__field patient-profile__field--compact">
        <span>Weight (lbs)</span>
        <input
          type="number"
          value={weightLbs}
          oninput={(event) => onBodyMeasurement('patientWeight', event)}
          placeholder="165"
          min="0"
        />
      </label>

      <label class="patient-profile__field patient-profile__field--compact">
        <span>BMI</span>
        <div class="patient-profile__bmi">
          <input type="text" value={profileBmi} readonly tabindex="-1" placeholder="auto" />
          {#if profileBmiCat}
            <span class={`patient-profile__bmi-badge ${profileBmiCat.cls}`}
              >{profileBmiCat.label}</span
            >
          {/if}
        </div>
      </label>
    </div>

    <div class="patient-profile__divider"></div>

    <div class="patient-profile__stack">
      <label class="patient-profile__field patient-profile__field--full">
        <span>Work Status / Occupation</span>
        <input
          type="text"
          value={field('patientWorkStatusOccupation')}
          oninput={(event) => onInput('patientWorkStatusOccupation', event)}
          placeholder="e.g. Full-time office worker, retired, student"
        />
      </label>

      <label class="patient-profile__field patient-profile__field--full">
        <span>Living Situation / Home Environment</span>
        <textarea
          rows="2"
          value={field('patientLivingSituationHomeEnvironment')}
          oninput={(event) => onInput('patientLivingSituationHomeEnvironment', event)}
          placeholder="e.g. Lives alone in 2-story home, 5 steps to enter, no railing"
        ></textarea>
      </label>

      <label class="patient-profile__field patient-profile__field--full">
        <span>Social Support</span>
        <textarea
          rows="2"
          value={field('patientSocialSupport')}
          oninput={(event) => onInput('patientSocialSupport', event)}
          placeholder="e.g. Spouse available for assistance, daughter lives nearby"
        ></textarea>
      </label>
    </div>
  {/if}
</section>

<style>
  .patient-profile {
    padding: 1rem;
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
  }

  .patient-profile--readonly {
    background: transparent;
    padding: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .patient-profile__header {
    margin-bottom: 0.9rem;
  }

  .patient-profile__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.15rem;
  }

  .patient-profile__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-neutral-900, #171717);
  }

  .patient-profile__mode-badge {
    display: inline-flex;
    align-items: center;
    min-height: 1.8rem;
    padding: 0 0.65rem;
    border-radius: 999px;
    background: #eef3ff;
    color: #2648a4;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .patient-profile__copy {
    margin: 0.2rem 0 0;
    font-size: 0.8rem;
    color: var(--color-neutral-500, #737373);
  }

  .patient-profile__grid,
  .patient-profile__measurements,
  .patient-profile__stack {
    display: grid;
    gap: 0.8rem;
  }

  .patient-profile__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .patient-profile__measurements {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: end;
  }

  .patient-profile__stack {
    grid-template-columns: minmax(0, 1fr);
  }

  .patient-profile__field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-neutral-700, #404040);
  }

  .patient-profile__field span {
    line-height: 1.2;
  }

  .patient-profile__field--full {
    grid-column: 1 / -1;
  }

  .patient-profile__field input,
  .patient-profile__field select,
  .patient-profile__field textarea {
    width: 100%;
    min-width: 0;
  }

  .patient-profile__field textarea {
    resize: vertical;
  }

  .patient-profile__divider {
    height: 1px;
    margin: 1rem 0;
    background: linear-gradient(
      90deg,
      rgba(15, 23, 42, 0.04),
      rgba(15, 23, 42, 0.12),
      rgba(15, 23, 42, 0.04)
    );
  }

  .patient-profile__bmi {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .patient-profile__bmi input {
    flex: 1;
  }

  .patient-profile__bmi-badge {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
    padding: 0 0.5rem;
    border-radius: 999px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .patient-profile__bmi-badge--underweight {
    background: #e3f2fd;
    color: #1565c0;
  }

  .patient-profile__bmi-badge--normal {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .patient-profile__bmi-badge--overweight {
    background: #fff3e0;
    color: #e65100;
  }

  .patient-profile__bmi-badge--obese {
    background: #fce4ec;
    color: #c62828;
  }

  .patient-profile__print {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .patient-profile__print-section {
    margin: 0;
  }

  .patient-profile__print-heading {
    margin: 0 0 0.5rem;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-neutral-500, #737373);
  }

  .patient-profile__print-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0 1rem;
    margin: 0;
  }

  .patient-profile__print-row {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
    min-width: 0;
  }

  .patient-profile__print-row--wide {
    grid-column: 1 / -1;
  }

  .patient-profile__print-row dt {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-neutral-600, #525252);
  }

  .patient-profile__print-row dd {
    margin: 0;
    font-size: 0.95rem;
    color: var(--color-neutral-900, #171717);
    line-height: 1.45;
    white-space: pre-wrap;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
  }

  .patient-profile__print-row dd > span:first-child {
    flex: 1;
  }

  @media (max-width: 900px) {
    .patient-profile__grid,
    .patient-profile__measurements,
    .patient-profile__print-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .patient-profile {
      padding: 0.85rem;
    }

    .patient-profile__title-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .patient-profile__grid,
    .patient-profile__measurements,
    .patient-profile__print-list {
      grid-template-columns: minmax(0, 1fr);
    }

    .patient-profile__bmi {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
