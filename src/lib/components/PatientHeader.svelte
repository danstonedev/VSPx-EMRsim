<!--
  PatientHeader — sticky identity bar for the unified note workspace.
-->
<script lang="ts">
  import type { CaseObj } from '$lib/store';
  import { displayName, type VspRecord } from '$lib/services/vspRegistry';

  interface Props {
    caseObj: CaseObj;
    vspPatient?: VspRecord | null;
    onBack?: () => void;
    noteTypeLabel?: string;
    isDirty?: boolean;
    isSigning?: boolean;
    isExporting?: boolean;
    isNoteLocked?: boolean;
    isAmending?: boolean;
    onDiscard?: () => void;
    onSave?: () => void;
    onSign?: () => void;
    onExport?: () => void;
  }

  let {
    caseObj,
    vspPatient = null,
    onBack,
    noteTypeLabel = 'Clinical Note',
    isDirty = false,
    isSigning = false,
    isExporting = false,
    isNoteLocked = false,
    isAmending = false,
    onDiscard,
    onSave,
    onSign,
    onExport,
  }: Props = $props();

  const patientName = $derived(
    vspPatient
      ? displayName(vspPatient)
      : (caseObj?.snapshot?.name ?? caseObj?.patientName ?? 'Unknown Patient'),
  );
  const sex = $derived(vspPatient?.sex ?? caseObj?.snapshot?.sex ?? '');
  const age = $derived(caseObj?.snapshot?.age ?? '');
  const mrn = $derived(vspPatient?.mrn ?? caseObj?.snapshot?.mrn ?? '');

  function getAvatarSrc(patientSex: string): string {
    const normalized = (patientSex ?? '').toLowerCase();
    if (normalized === 'female') return '/img/icon_female_light.png';
    if (normalized === 'male') return '/img/icon_male_light.png';
    return '/img/icon_unknown_light.png';
  }
</script>

<header class="patient-header">
  <div class="patient-header__row">
    {#if onBack}
      <button class="patient-header__back" onclick={onBack} type="button" aria-label="Back">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        <span>Back</span>
      </button>
    {/if}

    <div class="patient-header__identity">
      <img
        class="patient-header__avatar"
        src={getAvatarSrc(sex)}
        alt=""
        width="44"
        height="44"
        aria-hidden="true"
      />
      <div class="patient-header__info">
        <span class="patient-header__name">{patientName}</span>
        <span class="patient-header__demo">
          {#if age || sex}{age}{age && sex ? ', ' : ''}{sex}{/if}
          {#if mrn}<span class="patient-header__mrn">{mrn}</span>{/if}
        </span>
      </div>
    </div>

    <div class="patient-header__context">
      <span class="patient-header__note-type" aria-label="Active note type">{noteTypeLabel}</span>
      {#if isNoteLocked}
        <span class="patient-header__status patient-header__status--locked"
          >Signed &amp; Locked</span
        >
      {:else if isAmending}
        <span class="patient-header__status patient-header__status--amending">Amending</span>
      {:else}
        <span
          class="patient-header__status"
          class:patient-header__status--unsaved={isDirty}
          class:patient-header__status--saved={!isDirty}
        >
          {isDirty ? 'Unsaved changes' : 'Saved'}
        </span>
      {/if}
      <div class="patient-header__actions">
        {#if !isNoteLocked}
          <button
            class="patient-header__action patient-header__action--ghost"
            onclick={onDiscard}
            type="button"
          >
            Discard
          </button>
          <button
            class="patient-header__action patient-header__action--primary"
            onclick={onSave}
            type="button"
            disabled={isNoteLocked}
          >
            Save Draft
          </button>
          <button
            class="patient-header__action patient-header__action--sign"
            onclick={onSign}
            type="button"
            disabled={isSigning || isNoteLocked}
          >
            {#if isSigning}Signing...{:else if isAmending}Review &amp; Sign Amendment{:else}Review
              &amp; Sign{/if}
          </button>
        {/if}
        <button
          class="patient-header__action patient-header__action--ghost"
          onclick={onExport}
          type="button"
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export .docx'}
        </button>
      </div>
    </div>
  </div>
</header>

<style>
  .patient-header {
    background:
      radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 32%),
      linear-gradient(180deg, #3e3e40 0%, #545456 100%);
    color: white;
    padding: 0.5rem 1.1rem;
    border-bottom: 2px solid var(--color-brand-green, #009a44);
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
    flex-shrink: 0;
  }

  .patient-header__row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    min-height: 3.5rem;
  }

  .patient-header__back {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.82rem;
    padding: 0.42rem 0.75rem;
    border-radius: 12px;
    cursor: pointer;
    white-space: nowrap;
    font-weight: 600;
  }

  .patient-header__back:hover {
    background: rgba(255, 255, 255, 0.16);
  }

  .patient-header__identity {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-shrink: 0;
    min-width: 0;
  }

  .patient-header__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    object-fit: cover;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  }

  .patient-header__info {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    min-width: 0;
  }

  .patient-header__name {
    font-weight: 700;
    font-size: clamp(1rem, 1.7vw, 1.35rem);
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .patient-header__demo {
    margin-top: 0.1rem;
    font-size: 0.76rem;
    opacity: 0.8;
  }

  .patient-header__mrn {
    margin-left: 0.5em;
    padding: 0.05rem 0.4rem;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .patient-header__context {
    display: flex;
    gap: 0.55rem;
    align-items: center;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .patient-header__note-type,
  .patient-header__status {
    display: inline-flex;
    align-items: center;
    min-height: 1.8rem;
    padding: 0.15rem 0.65rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .patient-header__note-type {
    color: rgba(255, 255, 255, 0.96);
    background: rgba(0, 154, 68, 0.38);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .patient-header__status {
    color: rgba(255, 255, 255, 0.88);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .patient-header__status--unsaved {
    color: #ffb347;
    background: rgba(255, 179, 71, 0.15);
  }

  .patient-header__status--saved {
    color: rgba(255, 255, 255, 0.72);
  }

  .patient-header__actions {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .patient-header__action {
    min-height: 2rem;
    padding: 0.42rem 0.9rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 0.8rem;
    font-weight: 700;
    color: white;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      opacity 0.12s ease;
  }

  .patient-header__action:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .patient-header__action--ghost {
    background: rgba(255, 255, 255, 0.08);
  }

  .patient-header__action--ghost:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.14);
  }

  .patient-header__action--primary {
    background: var(--color-brand-green, #009a44);
    border-color: transparent;
  }

  .patient-header__action--primary:hover:not(:disabled) {
    background: #007f38;
  }

  .patient-header__action--sign {
    background: #1d4ed8;
    border-color: transparent;
  }

  .patient-header__action--sign:hover:not(:disabled) {
    background: #1e40af;
  }

  @media (max-width: 760px) {
    .patient-header {
      padding-inline: 0.85rem;
    }

    .patient-header__context {
      margin-left: 0;
    }

    .patient-header__row {
      min-height: auto;
    }

    .patient-header__actions {
      width: 100%;
    }
  }
</style>
