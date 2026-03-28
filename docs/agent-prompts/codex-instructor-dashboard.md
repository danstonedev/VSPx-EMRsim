# Codex Agent Prompt — Instructor Dashboard (Tier 2.1)

## Context

Copy everything below the `---` line into a Codex session with codebase access:

---

````
You are building the Instructor Dashboard for a PT EMR Simulator.
The project is at c:\Users\danst\VSPx-EMRsim on branch sveltekit-migration.
Stack: SvelteKit 2, Svelte 5 (runes), Tailwind v4, TypeScript 5.7 strict, Vitest 4.

## YOUR TASK

Replace the placeholder instructor page with a full case management dashboard.
Faculty users need to: view all cases in a sortable/searchable table, create new
cases via a modal form, edit cases (navigate to editor), delete cases with typed
confirmation, share case links with students, and view answer keys.

You will rewrite 1 existing file and create 2 new component files. You will NOT
modify any other files.

## STEP 1: Read these files first (DO NOT MODIFY)

Legacy source (what you're porting FROM):
  app/js/views/instructor/cases.js           — Full 1,151-line instructor view
  app/js/views/instructor/InstructorCasesUtils.js — Sort/validate helpers (260 lines)

Pattern files (match the conventions OF):
  src/routes/workspace/cases/+page.svelte    — Example of a case list page with search
  src/lib/components/ConfirmModal.svelte      — showConfirmModal() API for delete confirmation
  src/lib/components/Toast.svelte             — showToast() API for notifications
  src/lib/stores/cases.ts                     — loadAllCases, cases store, manifestCases
  src/lib/store.ts                            — createCase(), deleteCase(), listCases(), CaseObj type
  src/lib/stores/auth.ts                      — ROLES, canCreateCase, canDeleteCase derived stores

Integration references (understand these APIs):
  src/lib/components/SearchableSelect.svelte  — Reusable filtered dropdown
  src/lib/components/ConfirmModal.svelte      — Read the showConfirmModal export signature

## STEP 2: Rewrite src/routes/instructor/+page.svelte

Replace the current 28-line placeholder with a full instructor dashboard.

### Page structure:

A) ACCESS GATE
   Import canCreateCase from '$lib/stores/auth'.
   If user lacks faculty/admin role, show an access denied message with a
   link back to /workspace. Use $derived to reactively check.

B) HEADER BAR
   - Page title: "Instructor Case Library"
   - Search input (real-time filter by title, debounced)
   - "Create Case" button (opens CaseCreateModal)

C) CASE TABLE (use InstructorCaseTable component)
   - Sortable columns: Title, Setting, Acuity, Created, Actions
   - Each row shows case data with action buttons
   - Empty state: "No cases yet. Create your first case."

D) INTEGRATION
   On mount: call loadAllCases() to populate the cases store.
   Filter logic: filter $cases by search term (case-insensitive title match).
   All case CRUD goes through the existing store.ts functions.

### Script block pattern:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { cases, loadAllCases } from '$lib/stores/cases';
  import { createCase, deleteCase } from '$lib/store';
  import { canCreateCase } from '$lib/stores/auth';
  import { showConfirmModal } from '$lib/components/ConfirmModal.svelte';
  import { showToast } from '$lib/components/Toast.svelte';
  import InstructorCaseTable from '$lib/components/InstructorCaseTable.svelte';
  import CaseCreateModal from '$lib/components/CaseCreateModal.svelte';

  let search = $state('');
  let showCreateModal = $state(false);

  const filtered = $derived(
    $cases.filter((c) => {
      if (!search) return true;
      const title = (c.caseObj?.meta?.title ?? c.caseObj?.patientName ?? '').toLowerCase();
      return title.includes(search.toLowerCase());
    })
  );

  onMount(() => { loadAllCases(); });
  // ... handlers
</script>
````

## STEP 3: Create src/lib/components/InstructorCaseTable.svelte

A sortable data table component for case management.

### Props:

```typescript
interface Props {
  cases: CaseWrapper[];
  onEdit: (caseWrapper: CaseWrapper) => void;
  onDelete: (caseWrapper: CaseWrapper) => void;
  onShare: (caseWrapper: CaseWrapper) => void;
  onStudentView: (caseWrapper: CaseWrapper) => void;
  onAnswerKey: (caseWrapper: CaseWrapper) => void;
}
```

### Columns:

| Column  | Content                             | Sortable                      |
| ------- | ----------------------------------- | ----------------------------- |
| Title   | caseObj.meta?.title or 'Untitled'   | Yes                           |
| Setting | caseObj.meta?.setting or '—'        | Yes                           |
| Acuity  | caseObj.meta?.acuity or '—'         | Yes (capitalize first letter) |
| Created | caseObj.createdAt formatted as date | Yes                           |
| Actions | Button group                        | No                            |

### Sort logic:

- Track sortColumn and sortDirection as $state
- Toggle direction on column click (asc → desc → asc)
- Sort using localeCompare for strings, getTime() for dates
- Show sort indicator arrow (▲/▼) on active column

### Action buttons per row (in a flex row, gap-2):

1. "Edit" — primary small button, calls onEdit
2. "Student View" — secondary small button, calls onStudentView
3. "Answer Key" — secondary small button, calls onAnswerKey
4. "Share" — ghost small button, calls onShare
5. "Delete" — danger ghost small button, calls onDelete

### Styling:

- Table: w-full, text-sm, border-collapse
- Header: bg-neutral-800 text-neutral-300, sticky top-0
- Rows: border-b border-neutral-700, hover:bg-neutral-800/50
- Action buttons: flex gap-1, small buttons matching existing btn--sm pattern
- Responsive: on mobile (< 768px), hide Setting and Created columns

### Accessibility:

- th elements: scope="col", aria-sort="ascending"/"descending"/"none"
- Sort buttons: aria-label="Sort by {column}"
- Action buttons: aria-label="{action} {caseTitle}"

## STEP 4: Create src/lib/components/CaseCreateModal.svelte

A modal form for creating new PT cases.

### Props:

```typescript
interface Props {
  open: boolean;
  onclose: () => void;
  oncreate: (caseObj: CaseObj) => void;
}
```

### Form fields:

1. **Case Title** — text input, required, placeholder "e.g., Shoulder Impingement (R)"
2. **Patient Age** — number input, required, min=1, max=120
3. **Sex** — select: Male, Female, Other, Prefer not to say
4. **Clinical Setting** — select: Outpatient, Inpatient, Home Health, SNF, Acute Rehab, Other
5. **Case Acuity** — select: Acute, Subacute, Chronic, Unspecified

### Behavior:

- Modal overlay with card (match ConfirmModal styling pattern)
- "Create Case" submit button + "Cancel" button
- Validate: title required, age 1-120, setting required, acuity required
- On submit, build CaseObj:
  ```typescript
  {
    title, setting, patientAge: age, patientGender: sex, acuity,
    createdBy: 'faculty', createdAt: new Date().toISOString(),
    meta: { title, setting, patientAge: age, patientGender: sex, acuity },
    snapshot: { age: String(age), sex },
    history: {},
    encounters: { eval: { subjective: {}, objective: {}, assessment: {}, plan: {}, billing: {} } }
  }
  ```
- Call oncreate(caseObj)
- Show loading state on submit button ("Creating...")
- On success: close modal, show toast "Case created"
- On error: show inline error message, re-enable submit

### Styling:

- Modal overlay: fixed inset-0, bg-black/50, z-50, flex items-center justify-center
- Card: bg-neutral-900, border border-neutral-700, rounded-lg, p-6, max-w-lg, w-full
- Form fields: vertical stack gap-4
- Labels: text-sm text-neutral-300, mb-1
- Inputs: bg-neutral-800, border border-neutral-600, rounded, px-3 py-2, text-white
- Buttons: match existing btn patterns from the codebase

### Accessibility:

- Modal: role="dialog", aria-modal="true", aria-labelledby="create-case-title"
- Focus trap: on open, focus first input; on Escape, close
- Submit button: disabled during submission
- Required fields: aria-required="true"

## STEP 5: Wire up handlers in +page.svelte

In the instructor page, implement these handlers:

```typescript
async function handleCreate(caseObj: CaseObj) {
  const wrapper = createCase(caseObj);
  await loadAllCases(); // refresh list
  showToast({ message: `Case "${caseObj.title}" created`, type: 'success' });
  // Navigate to editor
  goto(`/workspace/editor?case=${wrapper.id}&encounter=eval`);
}

async function handleDelete(caseWrapper: CaseWrapper) {
  const title = caseWrapper.caseObj?.meta?.title ?? 'Untitled';
  const confirmed = await showConfirmModal({
    title: 'Delete Case',
    message: `Are you sure you want to delete "${title}"? This cannot be undone.`,
    confirmText: title,
    confirmLabel: 'Type the case name to confirm',
    confirmButton: 'Delete Case',
    danger: true,
  });
  if (!confirmed) return;
  deleteCase(caseWrapper.id);
  await loadAllCases();
  showToast({ message: `Case "${title}" deleted`, type: 'success' });
}

function handleEdit(caseWrapper: CaseWrapper) {
  goto(`/workspace/editor?case=${caseWrapper.id}&encounter=eval`);
}

function handleStudentView(caseWrapper: CaseWrapper) {
  goto(`/workspace/editor?case=${caseWrapper.id}&encounter=eval`);
}

function handleAnswerKey(caseWrapper: CaseWrapper) {
  goto(`/workspace/editor?case=${caseWrapper.id}&encounter=eval&key=true`);
}

function handleShare(caseWrapper: CaseWrapper) {
  const url = `${window.location.origin}/workspace/editor?case=${caseWrapper.id}&encounter=eval`;
  navigator.clipboard.writeText(url).then(() => {
    showToast({ message: 'Link copied to clipboard', type: 'success' });
  });
}
```

## CONSTRAINTS

- Do NOT install any npm packages
- Do NOT modify any file other than the 3 listed (rewrite 1, create 2)
- Do NOT create test files for this task (UI components are tested separately)
- Do NOT use Svelte 4 patterns ($:, auto-subscribed $store in script blocks)
- Use $state, $derived, $derived.by for all reactivity
- Use let { props }: Props = $props() for component props
- All TypeScript, no `any` types
- Semicolons, 2-space indent, single quotes
- Follow the dark-chrome clinical theme (bg-neutral-900, text-white, border-neutral-700, brand-green accents)
- Verify: the page renders at /instructor with case list, create modal works, delete with confirmation works

```

---

## Verification

After Codex completes, verify:
1. Navigate to `/instructor` — see case table (or empty state if no cases)
2. Click "Create Case" — modal opens with all form fields
3. Submit a case — navigates to editor, toast shown
4. Return to `/instructor` — new case appears in table
5. Sort by clicking column headers
6. Search filters cases by title
7. Delete with typed confirmation works
8. Share copies link to clipboard
```
