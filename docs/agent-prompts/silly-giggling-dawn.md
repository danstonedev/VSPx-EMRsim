# Plan: GPT-5.4 Agent Prompt for Standardized Assessment Tools (Tier 1.2)

## Context

The EMR Sim modernization has completed the core PT SOAP workflow, but **Standardized Assessment Tools** (Berg Balance Scale, PHQ-9, MMSE, etc.) are at 0% — a Tier 1 blocker. This is the highest-priority remaining gap for PT clinical competency.

The task is a bounded, pattern-following port — ideal for GPT-5.4. This plan defines the exact prompt to hand off, validated against the actual codebase files and integration points.

## What Claude Already Completed (This Session)

- **Tier 1.1**: Fixed vitest infrastructure (`src/tests/setup.ts`) — all 166 tests green
- **Tier 1.3**: Created `src/lib/services/attachments.ts` (IndexedDB blob storage) + 9 passing tests

## GPT-5.4 Prompt

Copy everything below the `---` line into a GPT-5.4 session with access to the codebase:

---

```
You are porting the Standardized Assessment Tools feature for a PT EMR Simulator.
The project is at c:\Users\danst\VSPx-EMRsim on branch sveltekit-migration.
Stack: SvelteKit 2, Svelte 5 (runes), Tailwind v4, TypeScript 5.7 strict, Vitest 4.

## YOUR TASK

Port the standardized clinical assessment instruments (currently only Berg Balance
Scale, but architectured for future instruments) from the legacy vanilla-JS codebase
to the new SvelteKit stack. You will create 2 new files, modify 2 existing files,
and create 1 test file.

## STEP 1: Read these files first (DO NOT MODIFY)

Legacy source (what you're porting FROM):
  app/js/features/soap/objective/standardized-assessment-definitions.js
  app/js/features/soap/objective/StandardizedAssessmentsPanel.js

Pattern files (match the conventions OF):
  src/lib/config/regionalAssessments.ts    — typed config data pattern
  src/lib/config/medicationDb.ts           — search function + typed DB pattern
  src/lib/components/RegionalAssessmentPicker.svelte — multi-section assessment component
  src/lib/components/NeuroscreenPanel.svelte — inline table assessment component
  src/lib/components/CollapsibleSubsection.svelte — reusable collapsible wrapper
  src/lib/components/ObjectiveSection.svelte — WHERE your panel gets integrated
  src/lib/stores/noteSession.ts            — updateField() is how data persists
  src/lib/types/sections.ts                — ObjectiveData interface you'll extend

## STEP 2: Create src/lib/config/standardizedAssessments.ts

Port ALL definitions and logic from standardized-assessment-definitions.js.

TypeScript interfaces to define:
  - AssessmentItem { id: string; label: string }
  - ItemRubricScores: Record<number, string>
  - ItemRubric { instructions: string; scores: ItemRubricScores }
  - RubricScaleEntry { score: string; description: string }
  - ScoreRange { min: number; max: number }
  - AssessmentScores { total: number; max: number; completedItems: number; totalItems: number }
  - AssessmentInstance {
      id: string; discipline: string; instrumentKey: string; version: number;
      title: string; status: 'complete' | 'in-progress';
      responses: Record<string, number | ''>;
      scores: AssessmentScores; interpretation: string;
      notes: string; performedAt: string; assessor: string;
    }
  - AssessmentDefinition {
      key: string; version: number; name: string; disciplines: string[];
      instructions: string; scoringGuide: RubricScaleEntry[];
      scoreRange: ScoreRange; maxScore: number;
      items: AssessmentItem[]; rubricScale: RubricScaleEntry[];
      itemRubrics: Record<string, ItemRubric>;
      interpret: (total: number) => string;
    }

Port VERBATIM from legacy:
  - BERG_ITEMS array (14 items with exact ids and labels)
  - BERG_RUBRIC_SCALE array (5 entries, scores 4→0)
  - BERG_ITEM_RUBRICS object (14 entries, each with instructions + scores 0-4)
  - The berg-balance-scale definition object
  - interpret function: >=45 "Low fall risk", >=41 "Increased fall risk", else "High fall risk"

Export these functions (port logic from legacy):
  - getAssessmentDefinition(key: string): AssessmentDefinition | null
  - listAssessmentDefinitions(): AssessmentDefinition[]
  - createAssessmentId(): string
  - normalizeScoreValue(raw: unknown, min: number, max: number): number | ''
  - normalizeAssessmentResponses(def, responses): Record<string, number | ''>
  - countCompletedItems(def, responses): number
  - computeTotal(def, responses): number
  - createAssessmentInstance(key: string, overrides?: Partial<AssessmentInstance>): AssessmentInstance | null
  - normalizeAssessmentInstance(raw: Partial<AssessmentInstance>): AssessmentInstance | null
  - normalizeStandardizedAssessments(list: unknown[]): AssessmentInstance[]
  - formatAssessmentScoreSummary(a: AssessmentInstance): string

## STEP 3: Create src/lib/components/StandardizedAssessmentsPanel.svelte

A Svelte 5 component using ONLY runes ($state, $derived, $derived.by, $effect).
NO Svelte 4 patterns (no $: reactive, no store auto-subscriptions in script).

Props interface:
  interface Props {
    assessments: AssessmentInstance[];
    onchange: (updated: AssessmentInstance[]) => void;
  }

Destructure as: let { assessments, onchange }: Props = $props();

### Component sections:

A) INSTRUMENT PICKER (top toolbar)
   - <select> dropdown populated from listAssessmentDefinitions()
   - "Add Assessment" button that calls createAssessmentInstance(selectedKey),
     appends to array, normalizes, and calls onchange()

B) ASSESSMENT CARDS (one per added assessment)
   Each card shows:
   - Title (h4) + Remove button (top-right)
   - Status pill: "Complete" (green) or "In Progress" (amber)
   - Score pill: "Score 42/56" (if any items scored)
   - Items pill: "12/14 items"
   - Interpretation text when complete (e.g. "Low fall risk")
   - "Open Detailed Scoring" button that expands inline scoring

C) INLINE SCORING (expanded per-card, NOT a modal)
   Use a collapsible div (toggled by state) instead of the legacy modal.
   Contains:
   - Help text: "Select a score chip for each item. Hover for rubric cues."
   - Table with columns: Item | Score
   - Each row: item label + info tooltip (title attr with rubric instructions)
   - Score chips: buttons 0-4 in a row. Behavior:
     * Click unselected chip → select it (set aria-pressed="true", add active class)
     * Click already-selected chip → deselect (clear to '')
     * Only one chip active per item
     * Each chip title attribute = item-specific rubric text if available,
       else general rubric scale text. Format: "Score {n}: {description}"
   - Notes textarea at bottom
   - Live score summary updates on every change

D) DATA FLOW
   On every mutation (score change, note change, add, remove):
   1. Clone the assessments array
   2. Apply the change
   3. Run normalizeStandardizedAssessments() on the full array
   4. Call onchange(normalizedArray)

### Styling:
Use Tailwind utility classes + scoped <style> block. Match existing clinical theme:
  - Card: border border-neutral-200, rounded-lg, p-4, bg-white
  - Pills: inline-flex, px-2, py-0.5, text-xs, rounded-full
    * Complete: bg-green-100 text-green-800
    * In Progress: bg-amber-100 text-amber-800
    * Score: bg-teal-100 text-teal-800
  - Score chips: w-8 h-8 rounded-full border text-sm font-semibold
    * Default: border-neutral-300 bg-white text-neutral-600
    * Active: border-brand-green bg-brand-green text-white (use var(--color-brand-green, #009a44))
    * Hover: bg-neutral-100
  - Table: w-full text-sm, alternating row bg via even:bg-neutral-50
  - Toolbar: flex items-center gap-3 mb-4
  - Use existing CSS vars: --color-brand-green, --color-neutral-200, --color-neutral-400, etc.

### Accessibility:
  - Score chip group: role="group" aria-label="{item.label} score selection"
  - Each chip: aria-pressed="true"/"false", aria-label="{item.label} score {n}"
  - Tooltip text via title attribute on chips and info indicators
  - Remove button: aria-label="Remove {title}"

## STEP 4: Modify src/lib/types/sections.ts

In the ObjectiveData interface, add this field BETWEEN the `functional` and
`treatmentPerformed` fields (around line 136-138):

  // Standardized functional assessments
  standardizedAssessments?: AssessmentInstance[];

Add the import at the top of the file (with the other config imports around line 27-94):

  import type { AssessmentInstance } from '$lib/config/standardizedAssessments';

## STEP 5: Modify src/lib/components/ObjectiveSection.svelte

### Add import (around line 14, after NeuroscreenPanel import):
  import StandardizedAssessmentsPanel from './StandardizedAssessmentsPanel.svelte';
  import { normalizeStandardizedAssessments } from '$lib/config/standardizedAssessments';
  import type { AssessmentInstance } from '$lib/config/standardizedAssessments';

### Add handler function (in the script block, around line 85):
  function handleAssessmentsChange(updated: AssessmentInstance[]) {
    updateField('objective', 'standardizedAssessments', updated);
  }

### Add CollapsibleSubsection (between line 197 and line 199 — after the closing
tag of "Neuromuscular" section, BEFORE the "Treatment Performed" section):

  <!-- 7b. STANDARDIZED FUNCTIONAL ASSESSMENTS -->
  <CollapsibleSubsection title="Standardized Functional Assessments" open={!isCollapsed('standardized-assessments')} onToggle={() => toggleCollapse('standardized-assessments')} dataSubsection="standardized-assessments">
    <StandardizedAssessmentsPanel
      assessments={section.standardizedAssessments ?? []}
      onchange={handleAssessmentsChange}
    />
  </CollapsibleSubsection>

## STEP 6: Create src/tests/standardized-assessments.test.ts

Test the pure functions from src/lib/config/standardizedAssessments.ts.
Import pattern: import { ... } from '$lib/config/standardizedAssessments';
Import { describe, it, expect } from 'vitest';

Test cases (minimum):
  1. getAssessmentDefinition('berg-balance-scale') returns definition with 14 items
  2. getAssessmentDefinition('nonexistent') returns null
  3. listAssessmentDefinitions() returns array with at least 1 entry
  4. normalizeScoreValue('3', 0, 4) returns 3
  5. normalizeScoreValue('', 0, 4) returns ''
  6. normalizeScoreValue('5', 0, 4) returns '' (out of range)
  7. normalizeScoreValue(null, 0, 4) returns ''
  8. normalizeScoreValue(NaN, 0, 4) returns ''
  9. createAssessmentInstance('berg-balance-scale') returns object with all required fields
  10. createAssessmentInstance('berg-balance-scale') has status 'in-progress' and 14 totalItems
  11. computeTotal with all 4s returns 56
  12. computeTotal with mixed scores sums correctly
  13. countCompletedItems with all filled returns 14
  14. countCompletedItems with some empty returns correct count
  15. normalizeAssessmentInstance with all 4s → status 'complete', interpretation 'Low fall risk'
  16. normalizeAssessmentInstance with total 42 → 'Increased fall risk'
  17. normalizeAssessmentInstance with total 30 → 'High fall risk'
  18. formatAssessmentScoreSummary returns "42/56 - Increased fall risk" format
  19. formatAssessmentScoreSummary returns "0/56" when no interpretation
  20. normalizeStandardizedAssessments filters out entries with bad instrumentKey

## CONSTRAINTS

- Do NOT install any npm packages
- Do NOT modify any file other than the 5 listed (create 3, modify 2)
- Do NOT use Svelte 4 patterns ($:, auto-subscribed $store in script blocks)
- All TypeScript, no `any` types
- Semicolons at end of statements (match existing codebase style)
- 2-space indentation
- Single quotes for strings
- Verify: run `npx vitest run` — all tests must pass (currently 166, expect 186+)
```

---

## Verification

After GPT-5.4 completes, verify:

1. `npx vitest run` — all tests pass (166 existing + ~20 new)
2. `npx vite dev` — open editor, go to Objective section, Standardized Functional Assessments subsection appears
3. Can add a Berg Balance Scale assessment
4. Can score individual items with chip UI
5. Live score total updates, interpretation shows at completion
6. Data persists (navigate away and back)
7. Can remove an assessment
