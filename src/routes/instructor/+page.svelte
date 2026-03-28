<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import CaseCreateModal from '$lib/components/CaseCreateModal.svelte';
  import { showConfirmModal } from '$lib/components/ConfirmModal.svelte';
  import InstructorCaseTable from '$lib/components/InstructorCaseTable.svelte';
  import { showToast } from '$lib/components/Toast.svelte';
  import { createCase, deleteCase, updateCase, type CaseObj, type CaseWrapper } from '$lib/store';
  import { canCreateCase, requestFacultyAccess, hasPendingFacultyRequest } from '$lib/stores/auth';
  import { cases, isLoading, loadAllCases } from '$lib/stores/cases';

  let search = $state('');
  let debouncedSearch = $state('');
  let showCreateModal = $state(false);
  let editingCase = $state<CaseWrapper | null>(null);
  let debounceTimer: number | undefined;
  let requestingAccess = $state(false);
  let requestSent = $state(hasPendingFacultyRequest());

  const hasAccess = $derived($canCreateCase);

  async function handleRequestFaculty() {
    requestingAccess = true;
    const ok = await requestFacultyAccess();
    requestingAccess = false;
    if (ok) {
      requestSent = true;
      showToast('Faculty access requested. An administrator will review your request.', {
        type: 'success',
      });
    } else {
      showToast('Unable to submit request. Please try again.', { type: 'error' });
    }
  }

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

  $effect(() => {
    const nextSearch = search;
    debounceTimer = window.setTimeout(() => {
      debouncedSearch = nextSearch.trim();
    }, 200);

    return () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
    };
  });

  const filteredCases = $derived.by(() => {
    const query = debouncedSearch.toLowerCase();
    return $cases.filter((caseWrapper) => {
      if (!query) {
        return true;
      }

      const title = getCaseTitle(caseWrapper).toLowerCase();

      return title.includes(query);
    });
  });

  onMount(async () => {
    await loadAllCases();
  });

  async function handleCreate(caseObj: CaseObj): Promise<void> {
    try {
      const wrapper = createCase(caseObj);
      const createdTitle =
        typeof caseObj.title === 'string' && caseObj.title.trim()
          ? caseObj.title.trim()
          : typeof caseObj.meta?.title === 'string' && caseObj.meta.title.trim()
            ? caseObj.meta.title.trim()
            : 'Untitled';

      await loadAllCases();
      showToast(`Case "${createdTitle}" created`, {
        type: 'success',
      });
      showCreateModal = false;
      await goto(`/workspace/editor?case=${encodeURIComponent(wrapper.id)}&encounter=eval`);
    } catch (error) {
      showToast('Unable to create case right now.', { type: 'error' });
      throw error;
    }
  }

  async function handleDelete(caseWrapper: CaseWrapper): Promise<void> {
    const title = getCaseTitle(caseWrapper);

    const confirmed = await showConfirmModal({
      title: 'Delete Case',
      message: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      confirmText: title,
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    const deleted = deleteCase(caseWrapper.id);
    if (!deleted) {
      showToast(`Unable to delete "${title}".`, { type: 'error' });
      return;
    }

    await loadAllCases();
    showToast(`Case "${title}" deleted`, { type: 'success' });
  }

  function handleEdit(caseWrapper: CaseWrapper): void {
    goto(`/workspace/editor?case=${encodeURIComponent(caseWrapper.id)}&encounter=eval`);
  }

  function handleStudentView(caseWrapper: CaseWrapper): void {
    goto(`/workspace/editor?case=${encodeURIComponent(caseWrapper.id)}&encounter=eval`);
  }

  function handleAnswerKey(caseWrapper: CaseWrapper): void {
    goto(`/workspace/editor?case=${encodeURIComponent(caseWrapper.id)}&encounter=eval&key=true`);
  }

  function handleEditProperties(caseWrapper: CaseWrapper): void {
    editingCase = caseWrapper;
    showCreateModal = true;
  }

  async function handleUpdate(id: string, caseObj: CaseObj): Promise<void> {
    const ok = updateCase(id, caseObj);
    if (!ok) {
      showToast('Unable to save changes.', { type: 'error' });
      return;
    }
    await loadAllCases();
    const savedTitle = caseObj.title ?? caseObj.meta?.title ?? 'Case';
    showToast(`"${savedTitle}" updated`, { type: 'success' });
    editingCase = null;
    showCreateModal = false;
  }

  async function handleShare(caseWrapper: CaseWrapper): Promise<void> {
    try {
      const url = `${window.location.origin}/workspace/editor?case=${encodeURIComponent(caseWrapper.id)}&encounter=eval`;
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard', { type: 'success' });
    } catch {
      showToast('Clipboard access failed. Please copy the link manually.', { type: 'error' });
    }
  }
</script>

<svelte:head>
  <title>Instructor Case Library | UND EMR-Sim</title>
</svelte:head>

<section class="instructor-page">
  {#if !hasAccess}
    <div class="access-card">
      <h1>Instructor Case Library</h1>
      <p>You need faculty or admin access to manage cases from this dashboard.</p>
      <div class="access-card__actions">
        <a href="/workspace" class="btn btn--primary">Back to Workspace</a>
        {#if requestSent}
          <span class="access-card__pending">Faculty access request pending</span>
        {:else}
          <button
            type="button"
            class="btn btn--ghost"
            disabled={requestingAccess}
            onclick={handleRequestFaculty}
          >
            {requestingAccess ? 'Requesting...' : 'Request Faculty Access'}
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <div class="dashboard-shell">
      <header class="dashboard-header">
        <div class="dashboard-copy">
          <p class="eyebrow">Faculty Tools</p>
          <h1>Instructor Case Library</h1>
          <p class="header-text">
            Create, organize, and distribute PT simulator cases from one place.
          </p>
        </div>

        <div class="dashboard-controls">
          <label class="search-field" for="case-search">
            <span class="search-field__label">Search cases</span>
            <input
              id="case-search"
              type="search"
              bind:value={search}
              placeholder="Filter by title..."
              aria-label="Search cases by title"
            />
          </label>

          <button
            type="button"
            class="btn btn--primary"
            onclick={() => {
              showCreateModal = true;
            }}
          >
            Create Case
          </button>
        </div>
      </header>

      <div class="table-shell">
        {#if $isLoading}
          <p class="status-text">Loading cases...</p>
        {:else}
          <InstructorCaseTable
            cases={filteredCases}
            onEdit={handleEdit}
            onEditProperties={handleEditProperties}
            onDelete={handleDelete}
            onShare={handleShare}
            onStudentView={handleStudentView}
            onAnswerKey={handleAnswerKey}
          />
        {/if}
      </div>
    </div>
  {/if}
</section>

<CaseCreateModal
  open={showCreateModal}
  editCase={editingCase}
  onclose={() => {
    showCreateModal = false;
    editingCase = null;
  }}
  oncreate={handleCreate}
  onupdate={handleUpdate}
/>

<style>
  .instructor-page {
    min-height: calc(100vh - 4rem);
    padding: 1.5rem;
    background:
      radial-gradient(circle at top left, rgba(0, 154, 68, 0.14), transparent 24rem),
      linear-gradient(180deg, #141414 0%, #0f0f0f 100%);
    color: white;
  }

  .dashboard-shell,
  .access-card {
    max-width: 1280px;
    margin: 0 auto;
  }

  .access-card {
    display: grid;
    gap: 1rem;
    max-width: 42rem;
    margin-top: 4rem;
    padding: 2rem;
    background: rgba(26, 26, 26, 0.92);
    border: 1px solid rgba(82, 82, 82, 0.9);
    border-radius: 1.25rem;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.28);
  }

  .access-card h1,
  .dashboard-copy h1 {
    margin: 0;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    line-height: 1.1;
  }

  .access-card p,
  .header-text {
    margin: 0;
    color: #d4d4d4;
    max-width: 42rem;
  }

  .access-card__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .access-card__pending {
    font-size: 0.8125rem;
    color: #fbbf24;
    font-weight: 600;
  }

  .btn--ghost {
    background: transparent;
    color: #d4d4d4;
    border: 1px solid #525252;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn--ghost:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: #737373;
    color: white;
  }

  .btn--ghost:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dashboard-shell {
    display: grid;
    gap: 1.5rem;
  }

  .dashboard-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1.25rem;
    flex-wrap: wrap;
    padding: 1.75rem;
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.96), rgba(15, 15, 15, 0.98));
    border: 1px solid rgba(82, 82, 82, 0.92);
    border-radius: 1.25rem;
    box-shadow: 0 22px 40px rgba(0, 0, 0, 0.22);
  }

  .dashboard-copy {
    display: grid;
    gap: 0.5rem;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #7dd3a8;
  }

  .dashboard-controls {
    display: flex;
    align-items: end;
    gap: 0.875rem;
    flex-wrap: wrap;
  }

  .search-field {
    display: grid;
    gap: 0.4rem;
    min-width: min(100%, 21rem);
    color: #e5e5e5;
  }

  .search-field__label {
    font-size: 0.8125rem;
    color: #d4d4d4;
  }

  .search-field input {
    min-width: 18rem;
    background: rgba(38, 38, 38, 0.95);
    color: white;
    border: 1px solid #525252;
  }

  .table-shell {
    overflow: hidden;
    background: rgba(20, 20, 20, 0.94);
    border: 1px solid rgba(82, 82, 82, 0.92);
    border-radius: 1.25rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .status-text {
    margin: 0;
    padding: 2.5rem 1.5rem;
    text-align: center;
    color: #d4d4d4;
  }

  @media (max-width: 768px) {
    .instructor-page {
      padding: 1rem;
    }

    .dashboard-header {
      padding: 1.25rem;
    }

    .dashboard-controls,
    .search-field,
    .search-field input,
    .dashboard-controls .btn {
      width: 100%;
    }

    .dashboard-controls {
      align-items: stretch;
    }
  }
</style>
