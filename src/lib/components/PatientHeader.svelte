<!--
  PatientHeader — Sticky bar showing patient identity, encounter context, and actions.
  Ported from the header section of pt_workspace_v2.js
-->
<script lang="ts">
  import type { CaseObj } from '$lib/store';

  interface Props {
    caseObj: CaseObj;
    onBack?: () => void;
  }

  let { caseObj, onBack }: Props = $props();

  const patientName = $derived(
    caseObj?.snapshot?.name ?? caseObj?.patientName ?? 'Unknown Patient',
  );
  const setting = $derived(caseObj?.meta?.setting ?? '');
  const diagnosis = $derived(caseObj?.meta?.diagnosis ?? caseObj?.diagnosis ?? '');
  const sex = $derived(caseObj?.snapshot?.sex ?? '');
  const age = $derived(caseObj?.snapshot?.age ?? '');
  const teaser = $derived(caseObj?.snapshot?.teaser ?? '');

  function getAvatarSrc(sex: string): string {
    const s = (sex ?? '').toLowerCase();
    if (s === 'female') return '/img/icon_female_light.png';
    if (s === 'male') return '/img/icon_male_light.png';
    return '/img/icon_unknown_light.png';
  }
</script>

<header class="patient-header">
  <div class="patient-header__row">
    {#if onBack}
      <button class="patient-header__back" onclick={onBack} type="button" aria-label="Back">
        ← Back
      </button>
    {/if}

    <div class="patient-header__identity">
      <img
        class="patient-header__avatar"
        src={getAvatarSrc(sex)}
        alt=""
        width="36"
        height="36"
        aria-hidden="true"
      />
      <div class="patient-header__info">
        <span class="patient-header__name">{patientName}</span>
        {#if age || sex}
          <span class="patient-header__demo">
            {age}{age && sex ? ', ' : ''}{sex}
          </span>
        {/if}
      </div>
    </div>

    <div class="patient-header__context">
      {#if setting}
        <span class="patient-header__chip">{setting}</span>
      {/if}
      {#if diagnosis}
        <span class="patient-header__chip">{diagnosis}</span>
      {/if}
    </div>
  </div>

  {#if teaser}
    <p class="patient-header__teaser">{teaser}</p>
  {/if}
</header>

<style>
  .patient-header {
    background: var(--color-brand-800, #166534);
    color: white;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .patient-header__row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .patient-header__back {
    border: none;
    background: rgba(255, 255, 255, 0.12);
    color: white;
    font-size: 0.8125rem;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
  }

  .patient-header__back:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .patient-header__identity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .patient-header__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    object-fit: cover;
  }

  .patient-header__info {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .patient-header__name {
    font-weight: 600;
    font-size: 1rem;
  }

  .patient-header__demo {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .patient-header__context {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .patient-header__chip {
    background: rgba(255, 255, 255, 0.15);
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .patient-header__teaser {
    margin: 0.375rem 0 0;
    font-size: 0.8125rem;
    opacity: 0.85;
    line-height: 1.4;
  }
</style>
