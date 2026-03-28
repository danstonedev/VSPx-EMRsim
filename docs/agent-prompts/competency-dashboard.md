# Agent Prompt — Competency Tracking Dashboard

## Context

The grading system stores `NoteGrade` records per student. The service layer already has
`buildCompetencyRecord()` which aggregates a student's grades into averages by category and
by SOAP/ADIME section. There is **no UI** for viewing this aggregated data — neither for
students (to see their own progress) nor for faculty (to see class-wide performance).

### What Exists (DO NOT rebuild these)

| Layer       | File                                                                          | Key exports                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Types       | `src/lib/types/grading.ts`                                                    | `CompetencyRecord { studentId, discipline, grades: NoteGrade[], averageByCategory, averageBySection, overallAverage, noteCount }` |
| Aggregation | `src/lib/services/gradingRecords.ts`                                          | `buildCompetencyRecord(studentId, discipline, rubric)` — computes averages from all non-draft grades                              |
| Query       | `src/lib/services/gradingRecords.ts`                                          | `listGradesForStudent(studentId)`, `listGradesByRubric(rubricTemplateId)`                                                         |
| Store       | `src/lib/stores/gradingRecords.ts`                                            | `allGrades`, `gradesForStudent()`, `gradeStatusMap`                                                                               |
| Rubrics     | `src/lib/config/ptRubricConfig.ts`, `src/lib/config/dieteticsRubricConfig.ts` | `PT_EVAL_RUBRIC`, `DIETETICS_NCP_RUBRIC` — full rubric templates with criteria, categories, sections                              |

### What Needs To Be Built

**1. `src/lib/components/CompetencyDashboard.svelte`** — Student-facing progress view

Shows a single student their own competency trajectory. This component:

- Calls `buildCompetencyRecord()` with the current user's ID and discipline
- Displays:
  - **Overall average** as a large percentage with a circular progress ring or bar
  - **Category breakdown** — one bar per rubric category (e.g., "Documentation Completeness", "Clinical Reasoning", "Professional Communication", "Billing Accuracy") showing average percentage
  - **Section breakdown** — one bar per SOAP section (S/O/A/P) or ADIME section showing average percentage
  - **Grade history** — simple table/list of graded notes: case title, date, score/max, status
  - **Note count** — "Based on N graded notes"
- If no grades exist yet, show an encouraging empty state: "Complete and submit notes to start tracking your competency growth."
- Discipline-aware: PT students see SOAP section labels, dietetics students see ADIME labels

**2. `src/lib/components/CompetencyOverviewTable.svelte`** — Faculty class overview

Faculty see aggregated performance across all students. This component:

- Takes a `rubric: RubricTemplate` prop
- Iterates over all grades grouped by `studentId`
- Builds a `CompetencyRecord` per student
- Displays a table: Student ID | Notes Graded | Overall Avg | Weakest Category | Trend indicator
- Sortable by any column
- Click a student row to see their detailed `CompetencyDashboard`

**3. Integration points** (modify existing files)

- `src/routes/workspace/+page.svelte` — Add a "My Progress" card/link that opens the student's competency dashboard. Only show when the student has at least one returned grade.
- `src/routes/workspace/drafts/+page.svelte` — Add a compact competency summary strip at the top of the page (overall average + note count).
- `src/routes/instructor/+page.svelte` — Add a "Competency Overview" tab/section alongside the case table. Renders `CompetencyOverviewTable` with the appropriate rubric for the discipline.

### Design Guidance

- Progress bars: Use simple horizontal bars with the brand green `#009a44` fill on dark backgrounds
- Percentages: Display as whole numbers (e.g., "78%"), color-code: green ≥80%, amber 60-79%, red <60%
- Dark chrome theme: `#141414`/`#1a1a1a` backgrounds, `#525252` borders, white/`#d4d4d4` text
- Cards with `border-radius: 1.25rem`, `box-shadow: 0 20px 40px rgba(0,0,0,0.2)`
- Mobile: Stack cards vertically, table becomes card list on narrow screens

### Technical Requirements

- **Svelte 5 runes only** — `$state()`, `$derived()`, `$effect()`, `$props()`. NO `$:` syntax.
- **No `export let`** — use `let { prop } = $props()`.
- **Scoped `<style>`** blocks, no global CSS.
- **`$lib/` import aliases**.
- Run `npx svelte-check --tsconfig ./tsconfig.json` after — must not add new errors.

### How To Verify

1. Create 2-3 signed notes for a student
2. Grade them via the grading panel (may need grading-system-ui built first)
3. Open workspace as the student — "My Progress" link appears
4. Dashboard shows overall average, category bars, section bars, grade history
5. Switch to instructor view — competency overview table shows student rows
6. Click a student — detailed dashboard renders
7. Verify both PT and dietetics students see correct section labels
