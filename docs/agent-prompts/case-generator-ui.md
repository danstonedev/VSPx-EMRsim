# Agent Prompt — Case Generator UI

## Context

The case generator service (`src/lib/services/caseGenerator.ts`, ~790 lines) is fully
functional — it takes a `CaseAnchors` object and deterministically builds a complete PT
case with realistic ROM/MMT/PROM findings, HPI narratives, billing codes, and SMART goals.
The service uses region data from `src/lib/config/regionalAssessments.ts` (shoulder,
cervical-spine, lumbar-spine, knee, ankle, etc.).

**The problem**: There is no UI. Faculty cannot use the generator without writing code.
The `CaseCreateModal` component (`src/lib/components/CaseCreateModal.svelte`) exists for
manual case creation but does NOT use the generator service.

### What Exists (DO NOT rebuild these)

| Layer        | File                                        | Key exports                                                                                                       |
| ------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Generator    | `src/lib/services/caseGenerator.ts`         | `generateCase(anchors)` → `GeneratedCase`, `CaseAnchors` interface, `getRegionTemplate()`, `generateSmartGoals()` |
| Regions      | `src/lib/config/regionalAssessments.ts`     | `REGIONS` object with ROM/MMT/special test definitions per body region                                            |
| Case Store   | `src/lib/store.ts`                          | `createCase(caseObj)`, `updateCase(id, caseObj)`, `deleteCase(id)`                                                |
| Case Library | `src/routes/workspace/cases/+page.svelte`   | Student case browsing                                                                                             |
| Instructor   | `src/routes/instructor/+page.svelte`        | Faculty case management with create/edit/delete                                                                   |
| Create Modal | `src/lib/components/CaseCreateModal.svelte` | Manual case creation form (title, setting, patient demographics)                                                  |

### `CaseAnchors` interface (the generator's input)

```typescript
interface CaseAnchors {
  title?: string; // Case display name
  region?: string; // Body region: 'shoulder', 'cervical-spine', 'lumbar-spine', 'knee', 'ankle', etc.
  condition?: string; // Diagnosis text: 'Rotator cuff tendinopathy', 'Cervical strain', etc.
  age?: number | string; // Patient age (defaults to 45)
  sex?: string; // 'male', 'female', 'other', 'unspecified'
  pain?: number; // Pain scale 0-10 (defaults to 5)
  acuity?: string; // 'acute', 'subacute', 'chronic'
  setting?: string; // 'Outpatient', 'Inpatient', 'SNF', 'Home Health'
  prompt?: string; // Additional HPI narrative to prepend
  goal?: string; // Patient's stated goal
}
```

### What Needs To Be Built

**1. `src/lib/components/CaseGeneratorForm.svelte`** — Interactive generator form

A form that lets faculty configure `CaseAnchors` and preview/save the generated case:

- **Region selector**: Dropdown or button group populated from the available regions in `REGIONS`. Show region names in human-readable form (e.g., "Shoulder", "Cervical Spine", "Lumbar Spine").
- **Condition input**: Text field with sensible defaults per region (e.g., selecting "shoulder" pre-fills "Rotator cuff tendinopathy"). Can be overridden.
- **Acuity selector**: Three-option toggle — Acute / Subacute / Chronic
- **Patient demographics**: Age (number input, default 45), Sex (dropdown), Pain level (slider 0-10, default 5)
- **Setting**: Dropdown — Outpatient, Inpatient, SNF, Home Health
- **Optional fields** (collapsed by default): Title override, additional HPI prompt, patient goal
- **"Generate Preview" button**: Calls `generateCase(anchors)` and displays a summary preview showing the generated case's key elements: patient snapshot, chief complaint, ROM findings count, billing codes, goals
- **"Save Case" button**: Takes the `GeneratedCase`, passes it to `createCase()`, and navigates to the editor to view it
- **"Regenerate" button**: Re-runs with same anchors (useful if faculty tweaks one field)

Region-condition mapping suggestions (pre-fill condition when region changes):

- shoulder → "Rotator cuff tendinopathy"
- cervical-spine → "Cervical strain"
- lumbar-spine → "Lumbar strain"
- knee → "Knee osteoarthritis"
- ankle → "Ankle sprain"

**2. Integration into `src/routes/instructor/+page.svelte`**

Add a "Generate Case" button alongside the existing "Create Case" button. Clicking it opens the `CaseGeneratorForm` — either as a modal or as a new section that replaces the table temporarily.

The existing "Create Case" button opens `CaseCreateModal` for manual creation. The new "Generate Case" button uses the generator for quick, realistic case scaffolding.

**3. Preview component: `src/lib/components/CasePreview.svelte`** (optional but recommended)

A read-only summary card showing the generated case before saving:

- Patient: age, sex, acuity, setting
- Chief complaint + HPI excerpt (first 200 chars)
- Findings: N ROM measurements, N MMT grades, N special tests
- Billing: ICD-10 code + CPT codes
- Goals: STG and LTG text

### Design Guidance

- The form should feel like a wizard, not a wall of inputs. Group related fields visually.
- Acuity toggle: Three horizontally-arranged buttons (Acute highlighted = amber, Subacute = blue, Chronic = gray)
- Pain slider: Show the numeric value beside the slider, color-grade from green (0) to red (10)
- Region selector: Large clickable cards with region names, or a clean dropdown — your call
- Dark chrome: `#141414`/`#1a1a1a` backgrounds, `#525252` borders, white/`#d4d4d4` text, `#009a44` green accents
- Cards: `border-radius: 1.25rem`, `box-shadow: 0 20px 40px rgba(0,0,0,0.2)`

### Technical Requirements

- **Svelte 5 runes only** — `$state()`, `$derived()`, `$effect()`, `$props()`. NO `$:`.
- **No `export let`** — use `let { prop } = $props()`.
- **Scoped `<style>`** blocks.
- **`$lib/` import aliases**.
- The generator is synchronous — `generateCase()` returns immediately, no async needed.
- Run `npx svelte-check --tsconfig ./tsconfig.json` after — must not add new errors.

### How To Verify

1. Open instructor page as faculty
2. Click "Generate Case"
3. Select "Shoulder" region — condition pre-fills "Rotator cuff tendinopathy"
4. Set acuity to "Acute", pain to 7
5. Click "Generate Preview" — see patient snapshot, chief complaint, findings summary
6. Click "Save Case" — case appears in the case library
7. Open the saved case in the editor — all SOAP sections pre-filled with generated data
8. Go back, change region to "Lumbar Spine", generate again — different case with appropriate findings
9. Verify the case works for students too — they can open and document against the generated case
