<script lang="ts">
  import type { CaseWrapper } from '$lib/store';

  interface Props {
    cases: CaseWrapper[];
    onEdit: (caseWrapper: CaseWrapper) => void;
    onEditProperties?: (caseWrapper: CaseWrapper) => void;
    onDelete: (caseWrapper: CaseWrapper) => void;
    onShare: (caseWrapper: CaseWrapper) => void | Promise<void>;
    onStudentView: (caseWrapper: CaseWrapper) => void;
    onAnswerKey: (caseWrapper: CaseWrapper) => void;
  }

  type SortColumn = 'title' | 'setting' | 'acuity' | 'created';
  type SortDirection = 'asc' | 'desc';

  let { cases, onEdit, onEditProperties, onDelete, onShare, onStudentView, onAnswerKey }: Props =
    $props();

  let sortColumn = $state<SortColumn>('created');
  let sortDirection = $state<SortDirection>('desc');

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const sortedCases = $derived.by(() => {
    return [...cases].sort((a, b) => {
      if (sortColumn === 'created') {
        const comparison = getCreatedSortValue(a) - getCreatedSortValue(b);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const aValue = getTextSortValue(a, sortColumn);
      const bValue = getTextSortValue(b, sortColumn);
      const comparison = String(aValue).localeCompare(String(bValue), undefined, {
        sensitivity: 'base',
      });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  });

  function getCaseTitle(caseWrapper: CaseWrapper): string {
    const rawTitle =
      caseWrapper.caseObj?.meta?.title ??
      caseWrapper.caseObj?.title ??
      caseWrapper.caseObj?.patientName;

    if (typeof rawTitle === 'string' && rawTitle.trim()) {
      return rawTitle.trim();
    }

    return 'Untitled';
  }

  function getCreatedSortValue(caseWrapper: CaseWrapper): number {
    const raw = caseWrapper.caseObj?.createdAt;
    const parsed = typeof raw === 'string' ? new Date(raw).getTime() : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function getTextSortValue(
    caseWrapper: CaseWrapper,
    column: Exclude<SortColumn, 'created'>,
  ): string {
    if (column === 'title') {
      return getCaseTitle(caseWrapper);
    }

    const rawValue = caseWrapper.caseObj?.meta?.[column];
    return typeof rawValue === 'string' ? rawValue : '';
  }

  function toggleSort(column: SortColumn): void {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }

    sortColumn = column;
    sortDirection = column === 'created' ? 'desc' : 'asc';
  }

  function getAriaSort(column: SortColumn): 'ascending' | 'descending' | 'none' {
    if (sortColumn !== column) {
      return 'none';
    }
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  function formatAcuity(value: unknown): string {
    if (typeof value !== 'string' || !value) {
      return '-';
    }
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  }

  function formatCreated(caseWrapper: CaseWrapper): string {
    const raw = caseWrapper.caseObj?.createdAt;
    if (typeof raw !== 'string') {
      return '-';
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return dateFormatter.format(date);
  }

  function indicatorFor(column: SortColumn): string {
    if (sortColumn !== column) {
      return '';
    }
    return sortDirection === 'asc' ? '^' : 'v';
  }
</script>

{#if sortedCases.length === 0}
  <p class="empty-state">No cases yet. Create your first case.</p>
{:else}
  <div class="ct-wrap">
    <table class="ct-table case-table">
      <thead>
        <tr>
          <th scope="col" class="ct-th" aria-sort={getAriaSort('title')}>
            <button
              type="button"
              class="sort-button"
              aria-label="Sort by Title"
              onclick={() => toggleSort('title')}
            >
              <span>Title</span>
              <span class="sort-indicator">{indicatorFor('title')}</span>
            </button>
          </th>
          <th scope="col" class="ct-th column--setting" aria-sort={getAriaSort('setting')}>
            <button
              type="button"
              class="sort-button"
              aria-label="Sort by Setting"
              onclick={() => toggleSort('setting')}
            >
              <span>Setting</span>
              <span class="sort-indicator">{indicatorFor('setting')}</span>
            </button>
          </th>
          <th scope="col" class="ct-th" aria-sort={getAriaSort('acuity')}>
            <button
              type="button"
              class="sort-button"
              aria-label="Sort by Acuity"
              onclick={() => toggleSort('acuity')}
            >
              <span>Acuity</span>
              <span class="sort-indicator">{indicatorFor('acuity')}</span>
            </button>
          </th>
          <th scope="col" class="ct-th column--created" aria-sort={getAriaSort('created')}>
            <button
              type="button"
              class="sort-button"
              aria-label="Sort by Created"
              onclick={() => toggleSort('created')}
            >
              <span>Created</span>
              <span class="sort-indicator">{indicatorFor('created')}</span>
            </button>
          </th>
          <th scope="col" class="ct-th actions-heading">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each sortedCases as caseWrapper (caseWrapper.id)}
          {@const caseTitle = getCaseTitle(caseWrapper)}
          <tr class="ct-row">
            <td class="ct-td">
              <div class="title-cell">
                <span class="title-text">{caseTitle}</span>
                <span class="title-id">{caseWrapper.id}</span>
              </div>
            </td>
            <td class="ct-td column--setting">{caseWrapper.caseObj?.meta?.setting ?? '-'}</td>
            <td class="ct-td">{formatAcuity(caseWrapper.caseObj?.meta?.acuity)}</td>
            <td class="ct-td column--created">{formatCreated(caseWrapper)}</td>
            <td class="ct-td">
              <div class="actions">
                <button
                  type="button"
                  class="btn btn--primary btn--sm"
                  aria-label={`Edit ${caseTitle}`}
                  onclick={() => onEdit(caseWrapper)}
                >
                  Edit
                </button>
                {#if onEditProperties}
                  <button
                    type="button"
                    class="btn btn--secondary btn--sm"
                    aria-label={`Properties for ${caseTitle}`}
                    onclick={() => onEditProperties(caseWrapper)}
                  >
                    Properties
                  </button>
                {/if}
                <button
                  type="button"
                  class="btn btn--secondary btn--sm"
                  aria-label={`Student View ${caseTitle}`}
                  onclick={() => onStudentView(caseWrapper)}
                >
                  Student View
                </button>
                <button
                  type="button"
                  class="btn btn--secondary btn--sm"
                  aria-label={`Answer Key ${caseTitle}`}
                  onclick={() => onAnswerKey(caseWrapper)}
                >
                  Answer Key
                </button>
                <button
                  type="button"
                  class="btn btn--ghost btn--sm"
                  aria-label={`Share ${caseTitle}`}
                  onclick={() => onShare(caseWrapper)}
                >
                  Share
                </button>
                <button
                  type="button"
                  class="btn btn--ghost btn--sm btn--danger-ghost ct-btn-remove"
                  aria-label={`Delete ${caseTitle}`}
                  onclick={() => onDelete(caseWrapper)}
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .empty-state {
    margin: 0;
    padding: 2.5rem 1.5rem;
    text-align: center;
    color: var(--color-neutral-400, #a3a3a3);
  }

  /* Scoped overrides — skeleton handled by .ct-table / .ct-th / .ct-td / .ct-row globals */

  .case-table {
    font-size: 0.875rem;
    color: var(--color-neutral-900, #1a1a1a);
  }

  .case-table thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 0;
  }

  .sort-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    padding: 0.9rem 0.85rem;
    background: transparent;
    border: 0;
    color: inherit;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
  }

  .sort-button:hover {
    color: var(--ct-header-text);
  }

  .sort-button:focus-visible {
    outline: 2px solid var(--ct-focus-color);
    outline-offset: -2px;
  }

  .sort-indicator {
    min-width: 0.85rem;
    color: var(--ct-focus-color);
    text-align: right;
  }

  .title-cell {
    display: grid;
    gap: 0.25rem;
  }

  .title-text {
    font-weight: 600;
    color: var(--color-neutral-900, #1a1a1a);
  }

  .title-id {
    color: var(--color-neutral-400, #a3a3a3);
    font-size: 0.75rem;
    letter-spacing: 0.02em;
  }

  .actions-heading {
    padding: 0.9rem 0.85rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    min-width: 19rem;
  }

  .actions :global(.btn--secondary) {
    background: var(--ct-header-bg);
    color: var(--ct-header-text);
  }

  .actions :global(.btn--secondary:hover) {
    background: var(--ct-header-sub-bg);
  }

  .actions :global(.btn--ghost) {
    color: var(--color-neutral-200, #e5e5e5);
  }

  .actions :global(.btn--ghost:hover) {
    background: rgba(255, 255, 255, 0.08);
  }

  .btn--danger-ghost {
    color: #fca5a5;
  }

  .btn--danger-ghost:hover {
    background: rgba(220, 38, 38, 0.12);
    color: #fecaca;
  }

  @media (max-width: 768px) {
    .column--setting,
    .column--created {
      display: none;
    }

    .actions {
      min-width: 14rem;
    }
  }
</style>
