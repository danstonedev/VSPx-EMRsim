<!--
  DevDisciplineSwitcher — localhost-only floating pill for quick discipline toggling.
  Only renders when running on localhost/127.0.0.1.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { userDiscipline, setDiscipline, type DisciplineId } from '$lib/stores/auth';
  import { DISCIPLINE_DEFAULTS } from '$lib/config/disciplineDefaults';

  let visible = $state(false);

  onMount(() => {
    visible = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  });

  const options = Object.entries(DISCIPLINE_DEFAULTS) as [
    DisciplineId,
    (typeof DISCIPLINE_DEFAULTS)[DisciplineId],
  ][];

  function toggle() {
    const next: DisciplineId = $userDiscipline === 'pt' ? 'dietetics' : 'pt';
    setDiscipline(next);
  }
</script>

{#if visible}
  <div class="dev-switcher">
    <button
      type="button"
      class="dev-switcher__pill"
      onclick={toggle}
      title="Dev: click to switch discipline"
    >
      <span class="dev-switcher__label">DEV</span>
      <span class="dev-switcher__value"
        >{DISCIPLINE_DEFAULTS[$userDiscipline]?.abbreviation ?? 'PT'}</span
      >
    </button>
  </div>
{/if}

<style>
  .dev-switcher {
    position: fixed;
    bottom: 36px;
    left: 12px;
    z-index: 9999;
  }

  .dev-switcher__pill {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    background: rgba(20, 20, 20, 0.92);
    border: 1px solid rgba(82, 82, 82, 0.7);
    border-radius: 999px;
    color: white;
    font-size: 0.6875rem;
    font-family: monospace;
    cursor: pointer;
    transition: border-color 0.15s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  .dev-switcher__pill:hover {
    border-color: var(--color-brand-green, #009a44);
  }

  .dev-switcher__label {
    color: #f59e0b;
    font-weight: 700;
    font-size: 0.5625rem;
    letter-spacing: 0.06em;
  }

  .dev-switcher__value {
    color: var(--color-brand-green, #009a44);
    font-weight: 700;
  }
</style>
