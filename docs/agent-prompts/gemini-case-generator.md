# Plan: Gemini 3.1 Pro Agent Prompt — Case Generator Service (Tier 2.3)

## Why This Task for Gemini

The Case Generator is a **730-line deterministic algorithm** that transforms user-specified
anchors (region, condition, acuity, pain level) into a complete PT case with realistic
ROM/MMT/PROM findings, HPI text, billing codes, and SMART goals. It is:

- **Pure TypeScript service** — no UI components, no Svelte
- **Data transformation heavy** — Gemini's strongest domain
- **Self-contained** — one service file + one test file + zero modifications to existing code
- **Clearly bounded** — input shape (anchors object), output shape (CaseObj), existing
  config data to consume (REGIONS from regionalAssessments.ts)
- **Unblocks instructor workflow** — faculty need this to generate cases without hand-writing JSON

## Gemini 3.1 Pro Prompt

Copy everything below the `---` line into a Gemini 3.1 Pro session with codebase access:

---

```
You are porting the Case Generator service for a PT EMR Simulator.
The project is at c:\Users\danst\VSPx-EMRsim on branch sveltekit-migration.
Stack: SvelteKit 2, Svelte 5, Tailwind v4, TypeScript 5.7 strict, Vitest 4.

## YOUR TASK

Port the deterministic case generator from legacy vanilla JS to a typed TypeScript
service. This generates realistic PT evaluation cases from a set of anchors (region,
condition, acuity, pain, etc.) using the existing regional assessment config data.

You will create 1 service file and 1 test file. You will NOT modify any existing files.

## STEP 1: Read these files first (DO NOT MODIFY)

Legacy source (what you're porting FROM):
  app/js/services/case-generator.js          — The full 730-line generator

New stack files (understand the types and data your service must consume/produce):
  src/lib/config/regionalAssessments.ts      — REGIONS record with ROM, MMT, PROM,
                                                special tests per body region. Your
                                                service imports REGIONS from here.
  src/lib/store.ts                           — CaseObj, CaseWrapper, CaseMeta,
                                                CaseSnapshot, CaseHistory interfaces.
                                                Your output must be compatible with
                                                createCase(caseObj: CaseObj).
  src/lib/types/sections.ts                  — TypedNoteDraft with SubjectiveData,
                                                ObjectiveData, AssessmentData, PlanData,
                                                BillingData. The encounter eval object
                                                your generator builds must match these.
  src/lib/config/ptCodes.ts                  — ICD-10 and CPT code definitions (if it
                                                exists; otherwise embed the code maps
                                                from the legacy file directly)

## STEP 2: Create src/lib/services/caseGenerator.ts

Port ALL logic from app/js/services/case-generator.js with full TypeScript typing.

### Types to define:

  interface CaseAnchors {
    title?: string;
    region?: string;         // e.g. 'shoulder', 'low back', 'cervical'
    condition?: string;      // e.g. 'Rotator cuff tendinopathy'
    age?: number | string;
    sex?: string;            // 'male' | 'female' | 'other' | 'unspecified'
    pain?: number;           // 0-10
    acuity?: string;         // 'acute' | 'subacute' | 'chronic'
    setting?: string;        // 'Outpatient' | 'Inpatient' | etc.
    prompt?: string;         // Additional HPI context
    goal?: string;           // Patient's functional goal
  }

  type Acuity = 'acute' | 'subacute' | 'chronic';

  interface RegionTemplate {
    teaser: string;
    chiefComplaint: string;
    hpi: string;
    rom: Record<string, string>;
    mmt: Record<string, string>;
    prom: Record<string, string>;
    specialTests: Record<string, { name: string; left: string; right: string; notes: string }>;
    impairments: string[];
    prognosis: string;
    defaultGoal: string;
    plan: {
      frequency: string;
      duration: string;
      interventions: string[];
      stg: string;
      ltg: string;
    };
    icd10: { code: string; desc: string };
    cpt: string[];
    prognosticFactors: string;
  }

  interface GeneratedCase {
    title: string;
    setting: string;
    patientAge: number;
    patientGender: string;
    acuity: string;
    patientDOB: undefined;
    createdBy: 'faculty';
    createdAt: string;
    meta: {
      title: string;
      setting: string;
      patientAge: number;
      patientGender: string;
      acuity: string;
      diagnosis: string;
      regions: string[];
      generated: true;
    };
    snapshot: { age: string; sex: string; teaser: string };
    history: {
      chief_complaint: string;
      hpi: string;
      pmh: string[];
      meds: string[];
      red_flag_signals: string[];
    };
    findings: {
      rom: Record<string, string>;
      mmt: Record<string, string>;
      special_tests: Record<string, unknown>[];
      outcome_options: string[];
    };
    encounters: {
      eval: {
        subjective: Record<string, unknown>;
        objective: Record<string, unknown>;
        assessment: Record<string, unknown>;
        plan: Record<string, unknown>;
        billing: Record<string, unknown>;
        generated: true;
      };
    };
  }

### Primary export:

  export function generateCase(anchors?: CaseAnchors): GeneratedCase

### Internal functions to port (all from legacy, preserve exact logic):

UTILITY FUNCTIONS:
  - capitalize(str: string): string
  - normalizeSex(sex: unknown): string
  - normalizeAge(age: unknown): number
  - normalizeRegionSlug(region: string): string — maps aliases like 'low back' → 'lumbar-spine',
    'neck' → 'cervical-spine', etc.
  - mapFrequencyToEnum(frequency: string): string — regex rules mapping free text to enums
    (FREQUENCY_RULES array: '2x per week' → '2x-week', etc.)
  - mapDurationToEnum(duration: string): string — regex rules mapping to enums
    (DURATION_RULES array: '4 weeks' → '4-weeks', etc.)

CLINICAL CONTENT GENERATORS:
  - generateHPI(condition, acuity, region, painLevel): string — 3 templates by acuity
  - generateImpairments(region, acuity): string[] — base + acuity-specific impairments
  - generatePrognosis(acuity, painLevel): string — 'Good' | 'Fair' | 'Fair to Good'
  - generatePrognosticFactors(acuity, painLevel): string
  - generateSmartGoals(region, condition, patientGoal, acuity, painLevel):
    { shortTerm: string; longTerm: string } — timeframe lookup by acuity

REFERENCE LOOKUPS:
  - getDefaultGoalForRegion(region): string — 8 region-specific goals
  - getFrequencyForAcuity(acuity): string
  - getDurationForAcuity(acuity): string
  - getInterventionsForRegion(region): string[] — base + region-specific
  - getICD10ForCondition(condition): { code: string; desc: string } — 5 condition mappings
    + fallback M79.3
  - getCPTForAcuity(acuity): string[] — base codes + acuity-specific additions

UI DATA PROCESSING (these transform REGIONS config data into clinical findings):
  - processUIRomData(uiRomData, acuity, painLevel, affectedSide): Record<string, RomValues>
    Uses impairment factors by acuity (acute: 60%, subacute: 75%, chronic: 80%) with
    deterministic sin-seeded variation. Groups L/R entries by joint name.
  - processUIMMTData(uiMMTData, acuity, affectedSide): Record<string, MmtValues>
    Grade arrays by acuity: acute ['3-','3','3+'], subacute ['3+','4-','4'],
    chronic ['4','4+','5-']. Unaffected side always '5'.
  - processUIPROMData(uiRomData, acuity, painLevel, affectedSide): Record<string, PromValues>
    PROM slightly better than AROM (+0.1 factor). End-feel patterns by acuity.
  - formatSpecialTestsData(specialTestsArray): Record<string, TestResults>
    Deterministic positive rate (~33%) via charCode seeding.

UI SHAPE BUILDERS (convert clinical data to the shape the UI editor expects):
  - buildUIRomTableData(items, romByJoint): Record<number, string>
  - buildUIMmtTableData(items, mmtByMuscle): Record<number, string>
  - buildUIPromTableData(items, promByJoint, sideLetter): Record<string, PromRow>
  - buildUISpecialTestsTableData(items, specialByName): Record<string, TestRow>

TEMPLATE BUILDER:
  - getRegionTemplate(regionSlug, acuity, condition, painLevel, patientGoal): RegionTemplate
    Main orchestrator — loads REGIONS[regionSlug], runs all processors, assembles template.
    Falls back to getBasicTemplate() if region not found.
  - getBasicTemplate(condition, acuity, painLevel, patientGoal): RegionTemplate
    Fallback with empty ROM/MMT/PROM and generic content.

CASE ASSEMBLERS:
  - buildGenerationContext(anchors): GenerationContext
  - buildMeta(ctx, template): meta object
  - buildHistory(ctx, template): history object
  - buildFindings(template): findings object
  - buildSubjective(ctx, template): subjective section
  - buildObjective(ctx, template): objective section
  - buildAssessment(ctx, template): assessment section
  - buildPlan(template): plan section
  - buildBilling(template): billing section
  - buildEncounterEval(ctx, template): full eval encounter
  - buildCaseFromTemplate(ctx, template): final case object

### Additional exports (match legacy):
  export { normalizeSex, normalizeAge, normalizeRegionSlug, mapFrequencyToEnum,
           mapDurationToEnum, generateSmartGoals, getDefaultGoalForRegion,
           getRegionTemplate };

### Import from existing config:
  import { REGIONS } from '$lib/config/regionalAssessments';
  import type { RomDef, MmtDef, SpecialTestDef } from '$lib/config/regionalAssessments';

### CRITICAL: The import from the LEGACY file is:
  import { regionalAssessments } from '../features/soap/objective/RegionalAssessments.js';

In the NEW stack this becomes:
  import { REGIONS } from '$lib/config/regionalAssessments';

The data shape is the same — REGIONS is a Record<string, RegionDef> where RegionDef has
{ name, rom: RomDef[], rims: RomDef[], mmt: MmtDef[], specialTests: SpecialTestDef[] }.

When the legacy code accesses `regionalAssessments[regionSlug]`, replace with
`REGIONS[regionSlug]`. The sub-arrays (.rom, .mmt, .specialTests) have the same shape.

## STEP 3: Create src/tests/case-generator.test.ts

Test the pure functions. Import from '$lib/services/caseGenerator'.
Import { describe, it, expect } from 'vitest';

Test cases (minimum 20):

UTILITY FUNCTIONS:
  1. normalizeAge(45) returns 45
  2. normalizeAge('thirty') returns 45 (default)
  3. normalizeAge(-5) returns 45 (out of range)
  4. normalizeAge(200) returns 45 (out of range)
  5. normalizeSex('Male') returns 'male' (case insensitive)
  6. normalizeSex('prefer-not-to-say') returns 'unspecified'
  7. normalizeSex(null) returns 'unspecified'
  8. normalizeRegionSlug('low back') returns 'lumbar-spine'
  9. normalizeRegionSlug('neck') returns 'cervical-spine'
  10. normalizeRegionSlug('shoulder') returns 'shoulder' (passthrough)
  11. normalizeRegionSlug('') returns 'shoulder' (default)
  12. mapFrequencyToEnum('2x per week') returns '2x-week'
  13. mapFrequencyToEnum('daily') returns '5x-week'
  14. mapFrequencyToEnum('') returns ''
  15. mapDurationToEnum('6 weeks') returns '6-weeks'
  16. mapDurationToEnum('ongoing') returns 'ongoing'

CLINICAL GENERATORS:
  17. generateSmartGoals('shoulder', 'tendinopathy', '', 'acute', 5) returns object
      with shortTerm and longTerm strings containing '1-2 weeks' and '4-6 weeks'
  18. getDefaultGoalForRegion('knee') includes 'stair' (stair climbing)
  19. getDefaultGoalForRegion('nonexistent') returns generic fallback

FULL CASE GENERATION:
  20. generateCase() with no args returns object with required top-level keys:
      title, setting, meta, snapshot, history, findings, encounters
  21. generateCase({ region: 'shoulder', acuity: 'acute', pain: 7 }) returns case
      where meta.regions includes 'shoulder' and meta.acuity is 'acute'
  22. generateCase({ region: 'lumbar-spine' }) returns case with encounters.eval
      containing subjective, objective, assessment, plan, billing keys
  23. generateCase({ region: 'shoulder' }) returns case where
      encounters.eval.objective.regionalAssessments.selectedRegions includes 'shoulder'
  24. generateCase().encounters.eval.generated is true
  25. generateCase({ age: 30, sex: 'male' }) returns case with patientAge 30
      and patientGender 'male'
  26. generateCase({ condition: 'Knee osteoarthritis' }) returns case where
      encounters.eval.billing.diagnosisCodes[0].code is 'M17.9'
  27. generateCase() returns case where encounters.eval.billing.billingCodes
      is a non-empty array

EDGE CASES:
  28. generateCase({ region: 'nonexistent-region' }) does not throw — falls back
      to basic template
  29. generateCase({ pain: 8 }) generates bilateral findings (painLevel > 6 threshold)
  30. generateCase({ title: 'Custom Title' }) uses the custom title

## CONSTRAINTS

- Do NOT install any npm packages
- Do NOT modify any existing files — only CREATE the 2 new files listed above
- All TypeScript, no `any` types (use `unknown` where truly dynamic)
- Port ALL logic faithfully — do not simplify the clinical algorithms. The
  impairment percentages, sin-seeded variation, grade arrays, end-feel patterns,
  frequency/duration regex rules, ICD-10/CPT maps, and SMART goal templates
  must be IDENTICAL to the legacy code
- Semicolons at end of statements
- 2-space indentation
- Single quotes for strings
- Verify: run `npx vitest run` — all tests must pass (currently 166, expect 196+)
```

---

## Verification

After Gemini 3.1 Pro completes, verify:

1. `npx vitest run` — all tests pass (166 existing + ~30 new)
2. Import test in Node/browser console:
   ```ts
   import { generateCase } from '$lib/services/caseGenerator';
   const c = generateCase({ region: 'shoulder', acuity: 'acute', pain: 6 });
   console.log(c.encounters.eval.objective.regionalAssessments);
   // Should show selectedRegions: ['shoulder'] with populated ROM/MMT/PROM data
   ```
3. Generated case can be passed to `createCase(c)` from `src/lib/store.ts` without type errors
4. ROM values are deterministic — same inputs always produce same outputs
5. All 9 regions in REGIONS config produce valid cases without errors
