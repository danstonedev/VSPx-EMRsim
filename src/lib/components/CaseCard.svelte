<!--
  CaseCard — Displays a single case in the case library grid.
  Ported from createCaseCard() in app/js/views/student/cases.js
-->
<script lang="ts">
  import type { ManifestCase } from '$lib/manifest';

  interface Props {
    caseItem: ManifestCase;
    draftStatus?: { encounter: string; hasContent: boolean } | null;
  }

  let { caseItem, draftStatus = null }: Props = $props();

  const statusLabel = $derived(draftStatus?.hasContent ? 'In Progress' : 'Not Started');
  const statusClass = $derived(
    draftStatus?.hasContent ? 'status--in-progress' : 'status--not-started',
  );
  const actionLabel = $derived(draftStatus?.hasContent ? 'Continue Working' : 'Start Case');
  const categoryLabel = $derived(caseItem.category ?? '');
</script>

<article class="case-card">
  <div class="case-card__header">
    <h3 class="case-card__title">{caseItem.title ?? caseItem.id}</h3>
    <span class="case-card__status {statusClass}">{statusLabel}</span>
  </div>

  {#if categoryLabel}
    <span class="case-card__category">{categoryLabel}</span>
  {/if}

  <div class="case-card__actions">
    <a class="btn btn--primary" href="/workspace/editor?case={caseItem.id}&encounter=eval">
      {actionLabel}
    </a>
  </div>
</article>

<style>
  .case-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.25rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 8px;
    background: white;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }

  .case-card:hover {
    border-color: var(--color-brand-green, #009a44);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .case-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .case-card__title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.3;
  }

  .case-card__status {
    flex-shrink: 0;
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .status--not-started {
    background: var(--color-neutral-200, #e0e0e0);
    color: var(--color-neutral-600, #616161);
  }

  .status--in-progress {
    background: #fef3c7;
    color: #92400e;
  }

  .case-card__category {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #737373);
    text-transform: capitalize;
  }

  .case-card__actions {
    margin-top: auto;
    padding-top: 0.5rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    min-height: 44px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition:
      background 0.15s,
      box-shadow 0.15s;
  }

  .btn--primary {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .btn--primary:hover {
    background: var(--color-brand-green-dark, #007a35);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }
</style>
