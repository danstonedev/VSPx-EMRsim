# Objective Section Improvement Plan

> Reference document for incremental, multi-discipline-aware improvements to the
> SOAP/ADIME Objective section. Every change must be **discipline-configurable**
> (PT today, OT/SLP/Dietetics tomorrow) and must **replace legacy code** rather
> than layering on top of it.

---

## Architecture Principles

1. **Config-driven, not component-hardcoded.** Field lists, options, and labels
   live in `src/lib/config/` files keyed by discipline. Components render
   whatever the config says.
2. **Shared primitives.** Reusable input widgets (graded dropdown, bilateral
   pair, structured observation grid, timed-test input) live in
   `src/lib/components/inputs/` and are composed by section components.
3. **Typed data layer.** Every new field gets a corresponding property in
   `ObjectiveData` (or a discipline-specific extension interface). No untyped
   `Record<string, unknown>` blobs for new work.
4. **Delete what you replace.** When a free-text textarea is replaced by a
   structured widget, remove the textarea, its placeholder, and its field key
   if renamed. Migrate existing draft data with a one-time normalizer if the
   key changes.
5. **Multi-discipline from day one.** Configs use discipline-keyed maps
   (`Record<DisciplineId, ...>`). PT gets the first implementation; other
   disciplines get `[]` or a sensible default until they're built out.

---

## Phase 1 — Structured Clinical Inputs (High Priority)

These replace free-text areas with structured widgets that teach correct
documentation patterns. Each item is a self-contained unit of work.

### 1A. ROM Table — Show Normal Reference Values

- **File:** `RegionalAssessmentPicker.svelte`
- **Config:** `regionalAssessments.ts` — `normal` field already exists per `RomDef`
- **Change:** Render the `normal` value as a reference column or inline hint next
  to each AROM/PROM input. Light gray text, non-editable. Students see "Normal:
  180°" next to their measured value.
- **Data impact:** None — display only.
- **Discipline scope:** Config already supports arbitrary regions; OT would add
  hand-specific regions (MCP/PIP/DIP flexion etc.) to the same structure.

### 1B. Structured Orientation Scoring (×4 Grid)

- **File:** `ObjectiveSection.svelte` → Communication / Cognition gate
- **New widget:** `OrientationGrid.svelte` — 4 toggles (Person, Place, Time,
  Situation) each with Intact / Impaired / Unable to Assess. Auto-generates
  "Oriented ×3 (Person, Place, Situation; impaired to Time)" summary string.
- **Replaces:** `orientation` free-text textarea.
- **Data:** Change `orientation?: string` → `orientation?: OrientationData`
  (`{ person, place, time, situation }` enum fields + `notes` string). Add
  normalizer for string → structured migration.
- **Discipline scope:** PT, OT, SLP all assess orientation.

### 1C. Structured Edema Assessment

- **File:** `ObjectiveSection.svelte` → Cardiovascular / Pulmonary gate
- **New widget:** `EdemaAssessment.svelte` — Repeatable entry: Location
  (dropdown: bilateral LE, L LE, R LE, L UE, R UE, other + free text),
  Grade (0/trace/1+/2+/3+/4+), Type (pitting/non-pitting), Circumference
  (cm input with landmark label). Multiple entries supported.
- **Replaces:** `edema` free-text textarea.
- **Data:** `edema?: string` → `edemaAssessments?: EdemaEntry[]`. Normalizer
  moves old string into `edemaAssessments[0].notes`.
- **Discipline scope:** PT, OT. Dietetics may reference for fluid status.

### 1D. Add Standardized Assessment Instruments

- **File:** `standardizedAssessments.ts`
- **Change:** Add definitions for: TUG, 10MWT, 6MWT, LEFS, NDI, ODI, ABC Scale,
  PSFS, Barthel Index, FIM. Group into categories:
  - **Balance:** BERG (exists), ABC
  - **Gait/Mobility:** TUG, 10MWT, 6MWT
  - **Regional Outcome:** LEFS, NDI, ODI, DASH/QuickDASH
  - **Global Function:** FIM, Barthel, PSFS
- **Architecture:** Timed tests (TUG, 10MWT, 6MWT) need a `measurementType`
  field on `AssessmentDefinition`: `'ordinal-scale'` (current chip UI) vs
  `'timed'` (time input + interpretation bands) vs `'distance'` (meters input)
  vs `'questionnaire'` (patient-reported, ordinal items).
  `StandardizedAssessmentsPanel.svelte` renders the appropriate input widget
  per `measurementType`.
- **Discipline scope:** Tag each definition with `disciplines: ['pt', 'ot', ...]`.
  Panel filters to current discipline. PSFS and Barthel are cross-discipline.

### 1E. Structured Treatment / Intervention Logging

- **File:** New `InterventionLog.svelte`, replaces single textarea
- **Config:** New `interventionCatalog.ts` — discipline-keyed intervention
  categories:
  - **PT:** Therapeutic Exercise, Manual Therapy, Neuromuscular Re-ed, Gait
    Training, Balance Training, Modalities, Patient Education, Functional
    Training
  - **OT (future):** ADL Training, Fine Motor, Splinting, etc.
- **Widget:** Each intervention entry: Category (dropdown from catalog) →
  Description (free text) → Parameters (sets/reps/duration/intensity as
  labeled compact inputs) → Time (minutes, for CPT linkage) → Patient
  Response (free text or structured: tolerated well / limited by pain /
  required rest breaks / etc.)
- **Replaces:** `treatmentPerformed` textarea.
- **Data:** `treatmentPerformed?: string` → `interventions?: InterventionEntry[]`.
  Normalizer moves old string into first entry's description.
- **Discipline scope:** Every discipline documents interventions. Catalog is
  discipline-keyed.

### 1F. Fix Cranial Nerve Table Column Headers

- **File:** `neuroscreenData.ts` + `NeuroscreenPanel.svelte`
- **Change:** Add a `tableColumns` property per `NeuroscreenRegion`:
  - LE/UE: `['Dermatome', 'Myotome', 'Reflex']` (current, correct)
  - Cranial Nerves: `['Sensory', 'Motor', 'Reflex']`
- **Component reads `tableColumns` instead of hardcoding headers.** Same data
  keys (dermatome/myotome/reflex) are fine internally; only the display label
  changes.
- **Data impact:** None.

---

## Phase 2 — Clinical Completeness (Medium Priority)

These add missing clinical fields. Each is additive — new fields within
existing subsections.

### 2A. Vitals Context Fields

- **SpO2 context:** Add `o2Source` field per VitalsRecord: dropdown (Room Air,
  Nasal Cannula, Simple Mask, Non-Rebreather, Ventilator) + `o2Rate` text input
  (L/min). Render inline next to SpO2 row in flowsheet.
- **BP position:** Add `bpPosition` field per VitalsRecord: dropdown (Sitting,
  Standing, Supine, Left Sidelying). Render inline next to BP row.
- **RPE row:** Add to `VITAL_ROWS` in `VitalsFlowsheet.svelte`: key `rpe`,
  label `RPE (6–20)`, unit `Borg`.
- **Pain placeholder clarification:** Change placeholder from "0" to "Current
  pain at time of measurement".
- **Data:** Extend `VitalsRecord` interface with `o2Source`, `o2Rate`,
  `bpPosition`, `rpe`.

### 2B. Communication / Cognition Expansion

- **Arousal Level:** Dropdown (Alert, Lethargic, Obtunded, Stuporous, Comatose)
  before orientation grid. Drives clinical logic — if not Alert, orientation
  testing may be deferred.
- **Hearing & Speech:** Two compact fields — Hearing (Normal, Impaired L/R/
  bilateral, Hearing aid, Deaf) and Speech (Clear, Dysarthric, Aphasic-
  expressive/receptive/global, Non-verbal). Relevant for PT, OT, SLP.
- **Data:** New fields in `ObjectiveData`: `arousalLevel`, `hearingStatus`,
  `speechStatus`.

### 2C. Respiratory Pattern (Cardiovascular / Pulmonary)

- **New field:** Structured — Pattern (dropdown: Normal/Regular, Tachypneic,
  Bradypneic, Kussmaul, Cheyne-Stokes, Paradoxical, Apneustic), Accessory
  Muscle Use (Yes/No), Cough (Strong/Weak/Absent/Productive/Non-productive),
  Auscultation areas (structured — anterior/posterior/lateral × upper/lower ×
  L/R with finding dropdowns: Clear, Crackles, Wheezes, Rhonchi, Diminished,
  Absent).
- **Replaces:** Current free-text `auscultation` textarea, which conflates
  heart and lung sounds. Split into Heart Sounds and Lung Sounds.
- **Data:** `auscultation?: string` → `heartSounds?: string` +
  `lungAuscultation?: LungAuscultationData` + `respiratoryPattern?: RespPatternData`.

### 2D. ROM Table — End-Feel Column

- **File:** `RegionalAssessmentPicker.svelte`
- **Change:** Add an End-Feel dropdown column next to PROM (per motion, per
  side): Hard, Firm, Soft, Empty, Springy Block, Muscle Spasm.
- **Config:** Add `endFeel` dict to `RegionalAssessments` data type.
- **Key format:** Same as ROM key: `regionId:joint:side`.
- **Discipline scope:** PT, OT.

### 2E. Posture Assessment Structure

- **File:** `ObjectiveSection.svelte` → Musculoskeletal subsection, before
  RegionalAssessmentPicker.
- **New widget:** `PostureAssessment.svelte` — Three-view grid (Anterior,
  Posterior, Lateral) with structured checkboxes per common finding:
  - Anterior: head tilt, shoulder height asymmetry, trunk shift, pelvic
    obliquity, genu valgum/varum, foot pronation/supination
  - Posterior: scoliotic curve, scapular winging/asymmetry, gluteal fold
    asymmetry, calcaneal alignment
  - Lateral: forward head, increased/decreased cervical lordosis, thoracic
    kyphosis, lumbar lordosis, knee hyperextension/flexion
    Each item: checkbox (present) + severity (mild/moderate/marked) + notes.
- **Data:** New `postureAssessment?: PostureData` in `ObjectiveData`.
- **Discipline scope:** PT, OT.

### 2F. Special Tests — Bilateral Results

- **File:** `RegionalAssessmentPicker.svelte`
- **Change:** For non-midline regions, split each special test row into L/R
  result dropdowns (same options: +/−/Equiv/N/T/Unable). For spine regions,
  keep single result.
- **Data:** Key format already supports this — extend `stKey` to include side:
  `regionId:testName:L` / `regionId:testName:R`. Normalizer migrates old
  single-key data to bilateral keys.

### 2G. Structured Tone Assessment (Modified Ashworth)

- **File:** `ObjectiveSection.svelte` → Neuromuscular supplemental fields
- **New widget:** `ToneAssessment.svelte` — Repeatable entry per muscle group:
  Muscle Group (text or dropdown from common list), Side (L/R/bilateral),
  MAS Grade (0, 1, 1+, 2, 3, 4 dropdown), Notes.
- **Replaces:** `tone` free-text textarea.
- **Data:** `tone?: string` → `toneAssessments?: ToneEntry[]`.

---

## Phase 3 — Clinical Depth & Pedagogical Polish

Prioritized by clinical education impact and CAPTE alignment. Items ordered
by rotation-readiness value: acute care/inpatient rehab (highest demand)
first, then outpatient/specialty, then polish.

### 3A. Structured Gait Analysis ★ Highest priority

- **New widget:** `GaitAssessment.svelte`
- **Fields:** Assistive Device (dropdown: None, SPC, NBQC, WBQC, FWW, RW,
  Rollator, Wheelchair, Other), Level of Assistance (Independent, Supervision,
  CGA, Min A, Mod A, Max A, Dependent), Surface (level, carpet, uneven,
  stairs, ramp, curb), Distance (ft/m), Duration (min:sec), Gait Speed
  (auto-calculated m/s), Deviations checklist (Trendelenburg, antalgic,
  circumduction, foot drop/steppage, vaulting, reduced arm swing,
  festinating, ataxic, scissors — per side), Notes.
- **Lives in:** Neuromuscular subsection, replacing the "Functional Assessment"
  textarea.
- **Pedagogical rationale:** Gait is the single most documented PT exam
  component. CPI criteria #7 (Performs a PT examination) specifically calls
  out gait analysis. Students must learn to document device, assistance
  level, surface, and deviations — not just "pt ambulated 100 ft."
- **Discipline scope:** PT, OT.

### 3G. Structured Functional Mobility / Transfers ★ New item

- **New widget:** `FunctionalMobilityLog.svelte`
- **Fields per activity:** Activity (dropdown: Rolling L, Rolling R, Supine↔Sit,
  Sit↔Stand, Stand Pivot Transfer, Sliding Board Transfer, Bed↔Chair,
  Chair↔Toilet, Floor↔Stand, Wheelchair Mobility, Other), Level of Assistance
  (Independent, Modified Independent, Supervision, Contact Guard, Min Assist,
  Mod Assist, Max Assist, Dependent), Cues (None, Verbal, Tactile,
  Verbal+Tactile), Device (None, Bed Rail, Walker, Transfer Board, Gait Belt,
  Other), Notes.
- **Lives in:** Neuromuscular subsection, after gait analysis (or as a new
  collapsible "Functional Mobility" subsection).
- **Pedagogical rationale:** Transfer documentation is the primary
  documentation task in acute care and inpatient rehab rotations. The
  assistance level taxonomy (FIM/AM-PAC aligned) is tested on NPTE and
  required by every clinical site. Currently a free-text field — students
  write "pt transferred with mod A" without specifying activity type, device,
  or cues. This structured approach teaches the complete documentation pattern.
- **Data:** `functional?: { assessment?: string }` → `functionalMobility?:
FunctionalMobilityEntry[]`. Legacy string migrates into first entry's notes.
- **Discipline scope:** PT, OT, Nursing (future).

### 3B. Wound Documentation Module

- **New widget:** `WoundAssessment.svelte`
- **Fields per wound:** Location (body region dropdown), Type (Pressure
  Injury, Surgical, Traumatic, Venous, Arterial, Diabetic, Other), Stage/
  Classification (I–IV/Unstageable/DTI for pressure; partial/full for others),
  Dimensions (L × W × D in cm), Undermining (clock position + depth),
  Tunneling (clock position + depth), Wound Bed (% granulation/slough/eschar/
  epithelial with inputs totaling 100%), Exudate (None/Scant/Moderate/Copious
  - Serous/Sanguineous/Serosanguineous/Purulent), Odor (None/Present),
    Periwound (Intact/Macerated/Erythematous/Indurated/Calloused), Wound Edges
    (Attached/Unattached/Rolled/Hyperkeratotic).
- **Lives in:** Integumentary subsection, replaces `skinIntegrity` textarea.
- **Supports multiple wounds per visit.**
- **Pedagogical rationale:** Required for acute care and SNF rotations.
  Students must learn NPUAP staging, wound measurement, and wound bed
  description — all tested on NPTE. Most common CI feedback is "student
  wound documentation lacks specificity."
- **Discipline scope:** PT (wound care), Nursing (future).

### 3E. Inspection & Palpation Cleanup

- **Merge or differentiate** General Observation and Visual Inspection.
  Recommended: rename to **Observation** (how the patient presents/moves —
  global clinical impression) and **Inspection Findings** (specific visual
  findings: swelling, deformity, discoloration, scars, asymmetry).
- **Palpation** stays but adds optional Location + Finding structured pairs
  alongside the free-text.
- **Pedagogical rationale:** Low effort, teaches students the distinction
  between global observation and targeted inspection — a common
  clinical reasoning gap.

### 3F. Vitals Flowsheet Column Presets

- **Change:** Add a column preset dropdown above the flowsheet: "Pre-
  Treatment", "Post-Treatment", "Orthostatic: Supine", "Orthostatic:
  Sitting", "Orthostatic: Standing", "Peak Exertion", "Custom". Selecting a
  preset fills the column label and (for orthostatic) the BP position field.
- **Pedagogical rationale:** Teaches orthostatic BP protocol (a common NPTE
  question and CI expectation). Pre/Post columns reinforce the habit of
  measuring vitals response to treatment.
- **Discipline scope:** Universal.

### 3D. Proprioception & Advanced Sensation

- **New fields in Neuromuscular:** Proprioception (per joint: intact/impaired/
  absent, method: position sense / kinesthesia), Vibration (tuning fork:
  intact/diminished/absent, location), Stereognosis (intact/impaired),
  Graphesthesia (intact/impaired), Two-Point Discrimination (value in mm,
  location).
- **Pedagogical rationale:** Important for neuro rotations. Teaches the
  sensory modality hierarchy (light touch → deep pressure → proprioception
  → vibration → cortical sensation).
- **Discipline scope:** PT, OT, SLP (for oral sensory).

### 3C. Circumferential Measurements

- **New widget:** `CircumferentialMeasurements.svelte`
- **Fields:** Repeatable: Location (dropdown: mid-thigh, suprapatellar, mid-
  calf, ankle figure-8, forearm, wrist, metacarpal, other + landmark text),
  Side (L/R), Measurement (cm), Reference (e.g., "15 cm above lateral joint
  line").
- **Lives in:** Cardiovascular/Pulmonary subsection (edema quantification).
- **Pedagogical rationale:** Teaches objective edema quantification beyond
  the pitting scale — important for longitudinal tracking.
- **Discipline scope:** PT, OT.

### 3H. Arousal → Orientation Clinical Logic ★ New item

- **Change:** When `arousalLevel` is "obtunded", "stuporous", or "comatose",
  display a clinical notice above the OrientationGrid: "Formal orientation
  testing may be unreliable at this arousal level." Optionally dim the
  orientation grid (but don't disable it — student should still be able to
  attempt and document the limitation).
- **Pedagogical rationale:** Teaches the hierarchical screening approach
  (level of consciousness before cognition). A common student error is
  documenting "disoriented ×0" when the patient is obtunded — the correct
  interpretation is "unable to assess due to decreased LOC."
- **Lives in:** `ObjectiveSection.svelte` Communication/Cognition gate.
- **Data impact:** None — display-only clinical decision support.

---

## Shared Input Components to Build

These are reusable primitives that multiple improvements above depend on. Build
these first or alongside the first feature that needs them.

| Component                | Used By                                     | Description                                 |
| ------------------------ | ------------------------------------------- | ------------------------------------------- |
| `GradedDropdown.svelte`  | Edema, Tone, MMT, Reflexes                  | Select with clinically ordered grades       |
| `BilateralPair.svelte`   | Special Tests, Tone, Edema, Gait            | L/R side-by-side inputs with shared label   |
| `RepeatableEntry.svelte` | Edema, Wounds, Circumference, Interventions | Add/remove rows with structured fields      |
| `TimedTestInput.svelte`  | TUG, 10MWT, 6MWT                            | Time entry (mm:ss) with auto-interpretation |
| `ChecklistGrid.svelte`   | Posture, Gait deviations, Observation       | Multi-item present/absent + severity grid   |

---

## Data Migration Strategy

When a field changes shape (e.g., `edema: string` → `edemaAssessments: EdemaEntry[]`):

1. Add the new typed field to `ObjectiveData`.
2. Write a normalizer function in a new `src/lib/config/dataMigration.ts` that
   checks for old-shape data and converts it. Old string content goes into the
   first entry's `notes` field.
3. Call the normalizer in `noteSession.ts` when loading a draft.
4. After one release cycle, remove the old field from the interface.
5. Never silently discard data — always migrate it somewhere visible.

---

## Implementation Order (Recommended)

```
Phase 1A  ROM normals display           (tiny, visual-only, instant win)
Phase 1F  CN table header fix           (tiny, config-only)
Phase 1B  Orientation grid              (small, new widget)
Phase 1C  Structured edema              (small, new widget + data migration)
Phase 1D  Standardized assessments      (medium, config + UI for timed tests)
Phase 1E  Intervention log              (medium, new widget + catalog + migration)
  ──── Phase 1 complete ────
Phase 2A  Vitals context                (small, extend existing)
Phase 2B  Comm/Cog expansion            (small, new fields)
Phase 2C  Respiratory pattern           (medium, structured replacement)
Phase 2D  End-feel column               (small, extend ROM table)
Phase 2E  Posture assessment            (medium, new widget)
Phase 2F  Special tests bilateral       (small, extend existing + migration)
Phase 2G  Structured tone / MAS         (small, new widget + migration)
  ──── Phase 2 complete ────
Phase 3A   Gait analysis               (high, most documented PT exam component)
Phase 3G   Functional mobility/transfers (high, acute care/inpatient essential)
Phase 3B   Wound documentation         (high, required for acute/SNF rotations)
Phase 3E   Inspection/palpation cleanup (small, low effort high polish)
Phase 3F   Vitals column presets       (small, teaches orthostatic protocol)
Phase 3D   Proprioception/sensation    (medium, neuro rotation essential)
Phase 3C   Circumferential measurements (small, edema quantification)
Phase 3H   Arousal→orientation logic   (tiny, clinical decision support)
  ──── Phase 3 complete ────
```

---

## Status Tracker

| ID  | Item                                | Status      |
| --- | ----------------------------------- | ----------- |
| 1A  | ROM normals display                 | ✅ Complete |
| 1B  | Orientation grid                    | ✅ Complete |
| 1C  | Structured edema                    | ✅ Complete |
| 1D  | Standardized assessments expansion  | ✅ Complete |
| 1E  | Intervention log                    | ✅ Complete |
| 1F  | CN table header fix                 | ✅ Complete |
| 2A  | Vitals context fields               | ✅ Complete |
| 2B  | Comm/Cog expansion                  | ✅ Complete |
| 2C  | Respiratory pattern                 | ✅ Complete |
| 2D  | End-feel column                     | ✅ Complete |
| 2E  | Posture assessment                  | ✅ Complete |
| 2F  | Special tests bilateral             | ✅ Complete |
| 2G  | Structured tone / MAS               | ✅ Complete |
| 3A  | Gait analysis                       | ✅ Complete |
| 3G  | Functional mobility / transfers     | ✅ Complete |
| 3B  | Wound documentation                 | ✅ Complete |
| 3E  | Inspection & palpation cleanup      | ✅ Complete |
| 3F  | Vitals column presets               | ✅ Complete |
| 3D  | Proprioception / advanced sensation | ✅ Complete |
| 3C  | Circumferential measurements        | ✅ Complete |
| 3H  | Arousal → orientation logic         | ✅ Complete |
