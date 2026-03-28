<script lang="ts">
  import { onMount } from 'svelte';
  import { manifestCases, isLoading, loadAllCases, getDraftStatusMap } from '$lib/stores/cases';
  import { userDiscipline } from '$lib/stores/auth';
  import CaseCard from '$lib/components/CaseCard.svelte';

  let search = $state('');
  let draftMap = $state(new Map<string, { encounter: string; hasContent: boolean }>());

  onMount(async () => {
    await loadAllCases();
    draftMap = getDraftStatusMap();
  });

  const filtered = $derived.by(() => {
    const disc = $userDiscipline;
    return $manifestCases
      .filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const name = (c.title ?? c.id ?? '').toLowerCase();
        const cat = (c.category ?? '').toLowerCase();
        return name.includes(q) || cat.includes(q);
      })
      .sort((a, b) => {
        // Prioritize cases matching the user's discipline
        const aMatch = a.discipline === disc ? 0 : 1;
        const bMatch = b.discipline === disc ? 0 : 1;
        return aMatch - bMatch;
      });
  });
</script>

<svelte:head>
  <title>Case Library | UND EMR-Sim</title>
</svelte:head>

<section class="case-library">
  <div class="case-library__header">
    <h1>Case Library</h1>
    <div class="case-library__search">
      <input
        type="search"
        placeholder="Search cases..."
        bind:value={search}
        class="search-input"
        aria-label="Search cases"
      />
    </div>
  </div>

  {#if $isLoading}
    <p class="case-library__status">Loading cases...</p>
  {:else if filtered.length === 0}
    <p class="case-library__status">
      {search ? `No cases matching "${search}"` : 'No cases available.'}
    </p>
  {:else}
    <div class="case-grid">
      {#each filtered as caseItem (caseItem.id)}
        <CaseCard {caseItem} draftStatus={draftMap.get(caseItem.id) ?? null} />
      {/each}
    </div>
  {/if}
</section>

<style>
  .case-library {
    padding: 1.5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .case-library__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .search-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    min-width: 220px;
    background: var(--color-surface, #ffffff);
  }

  .search-input:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: -1px;
    border-color: var(--color-brand-green, #009a44);
  }

  .case-library__status {
    color: var(--color-neutral-500, #737373);
    text-align: center;
    padding: 3rem 0;
  }

  .case-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
</style>
