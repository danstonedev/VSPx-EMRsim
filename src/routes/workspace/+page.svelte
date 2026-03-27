<script lang="ts">
  // Workspace — the unified note launcher / case selector
  // This will be the main workspace shell ported from pt_workspace_v2.js
</script>

<svelte:head>
  <title>Workspace | UND EMR-Sim</title>
</svelte:head>

<section class="workspace">
  <h1>Workspace</h1>
  <p class="placeholder">
    Workspace shell will be ported here. Select a patient, discipline, and encounter type to begin
    documentation.
  </p>

  <div class="quick-actions">
    <a href="/workspace/note/new" class="action-card">
      <span class="action-icon">📝</span>
      <span class="action-label">New Note</span>
    </a>
    <a href="/workspace/cases" class="action-card">
      <span class="action-icon">📋</span>
      <span class="action-label">Case Library</span>
    </a>
  </div>
</section>

<style>
  .workspace {
    padding: 2rem;
    max-width: 960px;
    margin: 0 auto;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .placeholder {
    color: var(--color-neutral-500, #737373);
    margin-bottom: 2rem;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem;
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 0.5rem;
    text-decoration: none;
    color: var(--color-neutral-800, #262626);
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }

  .action-card:hover {
    border-color: var(--color-brand-400, #4ade80);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .action-icon {
    font-size: 2rem;
  }

  .action-label {
    font-weight: 500;
  }
</style>
