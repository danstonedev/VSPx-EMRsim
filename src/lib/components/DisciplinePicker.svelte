<!--
  DisciplinePicker — one-time discipline selection shown after first login.
  Appears as a modal overlay when the user's discipline is not yet set.
-->
<script lang="ts">
  import { needsDisciplinePick, setDiscipline, type DisciplineId } from '$lib/stores/auth';
  import { DISCIPLINE_DEFAULTS } from '$lib/config/disciplineDefaults';

  let picking = $state(false);

  const show = $derived($needsDisciplinePick);

  async function pick(discipline: DisciplineId) {
    picking = true;
    await setDiscipline(discipline);
    picking = false;
  }
</script>

{#if show}
  <div class="dp-overlay" role="dialog" aria-modal="true" aria-label="Select your program">
    <div class="dp-card">
      <h1 class="dp-title">Welcome to EMR-Sim</h1>
      <p class="dp-subtitle">Which program are you in?</p>

      <div class="dp-options">
        {#each Object.entries(DISCIPLINE_DEFAULTS) as [id, def]}
          <button
            type="button"
            class="dp-option"
            disabled={picking}
            onclick={() => pick(id as DisciplineId)}
          >
            <span class="dp-option__abbr">{def.abbreviation}</span>
            <span class="dp-option__label">{def.label}</span>
            <span class="dp-option__format">{def.noteFormat} documentation</span>
          </button>
        {/each}
      </div>

      <p class="dp-hint">
        You can explore other disciplines anytime — this just sets your default.
      </p>
    </div>
  </div>
{/if}

<style>
  .dp-overlay {
    position: fixed;
    inset: 0;
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
  }

  .dp-card {
    background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
    border: 1px solid rgba(82, 82, 82, 0.9);
    border-radius: 1.25rem;
    padding: 2.5rem;
    max-width: 480px;
    width: 90vw;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
    text-align: center;
    color: white;
  }

  .dp-title {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .dp-subtitle {
    margin: 0 0 1.75rem;
    font-size: 0.9375rem;
    color: #d4d4d4;
  }

  .dp-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .dp-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem 1rem;
    background: rgba(38, 38, 38, 0.9);
    border: 2px solid rgba(82, 82, 82, 0.6);
    border-radius: 0.75rem;
    color: white;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .dp-option:hover:not(:disabled) {
    border-color: var(--color-brand-green, #009a44);
    background: rgba(0, 154, 68, 0.1);
  }

  .dp-option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dp-option__abbr {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--color-brand-green, #009a44);
  }

  .dp-option__label {
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .dp-option__format {
    font-size: 0.75rem;
    color: #a3a3a3;
  }

  .dp-hint {
    margin: 0;
    font-size: 0.75rem;
    color: #737373;
  }
</style>
