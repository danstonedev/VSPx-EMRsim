# Agent Prompt — Grading System UI

## Context

The grading/rubric system has complete backend infrastructure but **zero UI**. All types,
services, stores, and rubric configs exist and are tested. A faculty member has no way to
actually grade a student note — no component renders the rubric, no page hosts it.

### What Exists (DO NOT rebuild these)

| Layer            | File                                      | What it does                                                                                                                                                                               |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Types            | `src/lib/types/grading.ts`                | `RubricCriterion`, `RubricTemplate`, `GradeEntry`, `NoteGrade`, `GradeStatus`, `CompetencyRecord`                                                                                          |
| Service          | `src/lib/services/gradingRecords.ts`      | Full localStorage CRUD: `createGrade()`, `saveGrade()`, `updateGradeEntry()`, `submitGrade()`, `returnGrade()`, `listGradesForCase()`, `listGradesForStudent()`, `buildCompetencyRecord()` |
| Store            | `src/lib/stores/gradingRecords.ts`        | Reactive wrapper: `allGrades`, `refreshGrades()`, `gradeForNote()`, `gradesForCase()`, `gradeStatusMap` derived store                                                                      |
| PT Rubric        | `src/lib/config/ptRubricConfig.ts`        | 22 criteria, 80pt max, mapped to SOAP sections. Categories: Documentation Completeness, Clinical Reasoning, Professional Communication, Billing Accuracy                                   |
| Dietetics Rubric | `src/lib/config/dieteticsRubricConfig.ts` | 14 criteria, mapped to ADIME sections. Categories: Documentation Completeness, Clinical Reasoning, Professional Communication, Billing Accuracy                                            |
| Tests            | `src/tests/grading-records.test.ts`       | Service-level tests passing                                                                                                                                                                |

### What Needs To Be Built

**1. `src/lib/components/GradingPanel.svelte`** — The main grading interface

Faculty opens a student's signed note and grades it against the rubric. This component:

- Receives a `noteId`, `caseId`, `encounterId`, `studentId`, and `discipline` as props
- Looks up or creates a `NoteGrade` for that note (via `gradeForNote()` / `createGrade()`)
- Displays the rubric criteria grouped by `category` (4 category groups)
- Each criterion shows: label, description, a score input (0 to maxPoints), and a feedback textarea
- Scores update in real-time via `updateGradeEntry()`
- Shows running total score / max score at the top
- Has an "Overall Feedback" textarea at the bottom
- Three action buttons: Save Draft, Submit Grade, Return to Student
- Status badge showing current `GradeStatus` (draft/submitted/returned)
- The rubric template is determined by discipline: import `PT_EVAL_RUBRIC` or `DIETETICS_NCP_RUBRIC` from the config files

Design guidance:

- Dark chrome theme matching the app (backgrounds `#141414`/`#1a1a1a`, borders `#525252`, text white/`#d4d4d4`)
- UND brand green `#009a44` for primary actions
- Score inputs should be compact number inputs with min/max validation
- Group criteria under collapsible category headers
- Mobile-responsive — stack on small screens

**2. `src/lib/components/GradeStatusBadge.svelte`** — Small pill badge

Shows grade status on note cards. Props: `status: GradeStatus`, `score?: number`, `maxScore?: number`.

- draft = gray pill "Draft"
- submitted = amber pill "Graded"
- returned = green pill "Returned" with score fraction

**3. Integration points** (modify existing files)

- `src/routes/workspace/drafts/+page.svelte` — Add `GradeStatusBadge` to signed note cards using `gradeStatusMap` store. Faculty sees "Grade" button on signed notes. Students see grade status/score when returned.
- `src/routes/instructor/+page.svelte` — Add a "Grade Notes" section or tab below the case table. Shows list of submitted notes pending grading, with links to open the grading panel.

### Technical Requirements

- **Svelte 5 runes only** — use `$state()`, `$derived()`, `$effect()`, `$props()`. NO `$:` reactive declarations.
- **No `export let`** — use `let { prop } = $props()` pattern.
- **Scoped `<style>`** — all styles in component `<style>` blocks, no global CSS.
- **Import paths** use `$lib/` aliases.
- **Material Symbols Outlined** icons via `<span class="material-symbols-outlined">icon_name</span>`.
- After building, run `npx svelte-check --tsconfig ./tsconfig.json` — your changes must not add new errors (8 pre-existing errors are acceptable).

### How To Verify

1. Open a case as a student, write a note, sign it
2. Switch to faculty view (instructor page)
3. Find the signed note, click "Grade"
4. Rubric loads with all criteria grouped by category
5. Enter scores and feedback for each criterion
6. Running total updates in real-time
7. Save as draft, reopen — draft persists
8. Submit grade — status changes to "submitted"
9. Return to student — student sees score on their drafts page
