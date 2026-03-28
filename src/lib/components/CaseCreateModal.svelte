<script lang="ts">
  import { showToast } from '$lib/components/Toast.svelte';
  import type { CaseObj, CaseWrapper } from '$lib/store';

  interface Props {
    open: boolean;
    editCase?: CaseWrapper | null;
    onclose: () => void;
    oncreate: (caseObj: CaseObj) => void | Promise<void>;
    onupdate?: (id: string, caseObj: CaseObj) => void | Promise<void>;
  }

  let { open, editCase = null, onclose, oncreate, onupdate }: Props = $props();

  const isEditMode = $derived(!!editCase);

  const sexOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const settingOptions = ['Outpatient', 'Inpatient', 'Home Health', 'SNF', 'Acute Rehab', 'Other'];
  const acuityOptions = ['Acute', 'Subacute', 'Chronic', 'Unspecified'];

  let title = $state('');
  let age = $state('');
  let sex = $state('Prefer not to say');
  let setting = $state('');
  let acuity = $state('');
  let errorMessage = $state('');
  let isSubmitting = $state(false);
  let dialogEl: HTMLDivElement | undefined = $state();
  let titleInput: HTMLInputElement | undefined = $state();

  function stringValue(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
  }

  $effect(() => {
    if (!open) {
      return;
    }

    // Pre-populate form fields in edit mode
    if (editCase) {
      const obj = editCase.caseObj;
      title =
        stringValue(obj?.meta?.title) ||
        stringValue(obj?.title) ||
        stringValue(obj?.patientName) ||
        '';
      age = String(obj?.meta?.patientAge ?? obj?.patientAge ?? '');
      sex =
        stringValue(obj?.meta?.patientGender) ||
        stringValue(obj?.patientGender) ||
        'Prefer not to say';
      setting = stringValue(obj?.meta?.setting) || stringValue(obj?.setting) || '';
      acuity = stringValue(obj?.meta?.acuity) || stringValue(obj?.acuity) || '';
    }

    const focusTimer = window.setTimeout(() => {
      titleInput?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
    };
  });

  function resetForm(): void {
    title = '';
    age = '';
    sex = 'Prefer not to say';
    setting = '';
    acuity = '';
    errorMessage = '';
    isSubmitting = false;
  }

  function close(): void {
    if (isSubmitting) {
      return;
    }
    resetForm();
    onclose();
  }

  function validate(): number | null {
    const trimmedTitle = title.trim();
    const parsedAge = Number.parseInt(age, 10);

    if (!trimmedTitle) {
      errorMessage = 'Case title is required.';
      return null;
    }

    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      errorMessage = 'Patient age must be a whole number between 1 and 120.';
      return null;
    }

    if (!setting) {
      errorMessage = 'Clinical setting is required.';
      return null;
    }

    if (!acuity) {
      errorMessage = 'Case acuity is required.';
      return null;
    }

    errorMessage = '';
    return parsedAge;
  }

  function buildCase(parsedAge: number): CaseObj {
    const trimmedTitle = title.trim();

    return {
      title: trimmedTitle,
      patientName: trimmedTitle,
      setting,
      patientAge: parsedAge,
      patientGender: sex,
      acuity,
      createdBy: 'faculty',
      createdAt: new Date().toISOString(),
      meta: {
        title: trimmedTitle,
        setting,
        patientAge: parsedAge,
        patientGender: sex,
        acuity,
      },
      snapshot: {
        age: String(parsedAge),
        sex,
      },
      history: {},
      encounters: {
        eval: {
          subjective: {},
          objective: {},
          assessment: {},
          plan: {},
          billing: {},
        },
      },
    };
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    const parsedAge = validate();
    if (parsedAge == null) {
      return;
    }

    isSubmitting = true;

    try {
      if (isEditMode && editCase && onupdate) {
        // Edit mode: merge updated metadata into the existing case object
        const existing = editCase.caseObj;
        const trimmedTitle = title.trim();
        const updated: CaseObj = {
          ...existing,
          title: trimmedTitle,
          patientName: trimmedTitle,
          setting,
          patientAge: parsedAge,
          patientGender: sex,
          acuity,
          meta: {
            ...(existing.meta ?? {}),
            title: trimmedTitle,
            setting,
            patientAge: parsedAge,
            patientGender: sex,
            acuity,
          },
          snapshot: {
            ...(existing.snapshot ?? {}),
            age: String(parsedAge),
            sex,
          },
        };
        await Promise.resolve(onupdate(editCase.id, updated));
      } else {
        await Promise.resolve(oncreate(buildCase(parsedAge)));
      }
      resetForm();
      onclose();
    } catch (error) {
      const action = isEditMode ? 'update' : 'create';
      errorMessage =
        error instanceof Error ? error.message : `Unable to ${action} the case right now.`;
      showToast(`Case ${action} failed`, { type: 'error' });
    } finally {
      isSubmitting = false;
    }
  }

  function getFocusableElements(): HTMLElement[] {
    if (!dialogEl) {
      return [];
    }

    return Array.from(
      dialogEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('disabled'));
  }

  function trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (active === first || active === dialogEl)) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (!open) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    trapFocus(event);
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if open}
  <div class="modal-overlay">
    <div
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-case-title"
      tabindex="-1"
      bind:this={dialogEl}
    >
      <div class="modal-header">
        <div>
          <p class="modal-kicker">
            {isEditMode ? 'Edit case properties' : 'New faculty-authored case'}
          </p>
          <h2 id="create-case-title">{isEditMode ? 'Edit Case' : 'Create Case'}</h2>
        </div>
        <button type="button" class="close-button" aria-label="Close case modal" onclick={close}>
          x
        </button>
      </div>

      <form class="modal-form" onsubmit={handleSubmit}>
        <label class="field">
          <span>Case Title</span>
          <input
            bind:this={titleInput}
            type="text"
            bind:value={title}
            placeholder="e.g., Shoulder Impingement (R)"
            aria-required="true"
            required
          />
        </label>

        <div class="field-grid">
          <label class="field">
            <span>Patient Age</span>
            <input
              type="number"
              bind:value={age}
              min="1"
              max="120"
              inputmode="numeric"
              aria-required="true"
              required
            />
          </label>

          <label class="field">
            <span>Sex</span>
            <select bind:value={sex}>
              {#each sexOptions as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
        </div>

        <div class="field-grid">
          <label class="field">
            <span>Clinical Setting</span>
            <select bind:value={setting} aria-required="true" required>
              <option value="">Select a setting</option>
              {#each settingOptions as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>

          <label class="field">
            <span>Case Acuity</span>
            <select bind:value={acuity} aria-required="true" required>
              <option value="">Select acuity</option>
              {#each acuityOptions as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
        </div>

        {#if errorMessage}
          <p class="error-message" role="alert">{errorMessage}</p>
        {/if}

        <div class="actions">
          <button type="button" class="btn btn--ghost" onclick={close} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" class="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting
              ? isEditMode
                ? 'Saving...'
                : 'Creating...'
              : isEditMode
                ? 'Save Changes'
                : 'Create Case'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(3px);
  }

  .modal-card {
    width: min(100%, 34rem);
    background: #171717;
    color: white;
    border: 1px solid #525252;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 22px 44px rgba(0, 0, 0, 0.35);
  }

  .modal-header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .modal-kicker {
    margin: 0 0 0.375rem;
    color: #7dd3a8;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid #525252;
    border-radius: 999px;
    background: transparent;
    color: #d4d4d4;
    cursor: pointer;
    font-size: 1.25rem;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  .modal-form {
    display: grid;
    gap: 1rem;
  }

  .field-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field {
    display: grid;
    gap: 0.4rem;
  }

  .field span {
    margin-bottom: 0.1rem;
    font-size: 0.875rem;
    color: #d4d4d4;
  }

  .field input,
  .field select {
    width: 100%;
    background: #262626;
    color: white;
    border: 1px solid #525252;
  }

  .field input::placeholder {
    color: #a3a3a3;
  }

  .error-message {
    margin: 0;
    padding: 0.75rem 0.875rem;
    border: 1px solid rgba(248, 113, 113, 0.35);
    border-radius: 0.75rem;
    background: rgba(127, 29, 29, 0.28);
    color: #fecaca;
    font-size: 0.875rem;
  }

  .actions {
    display: flex;
    justify-content: end;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .actions :global(.btn--ghost) {
    color: #e5e5e5;
  }

  .actions :global(.btn--ghost:hover) {
    background: rgba(255, 255, 255, 0.08);
  }

  @media (max-width: 640px) {
    .modal-card {
      padding: 1.25rem;
    }

    .field-grid {
      grid-template-columns: 1fr;
    }

    .actions {
      flex-direction: column-reverse;
    }

    .actions :global(.btn) {
      width: 100%;
    }
  }
</style>
