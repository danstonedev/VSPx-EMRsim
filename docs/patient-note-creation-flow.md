# Patient and Note Creation Flow Map

This document maps the current patient and note creation experience across PT, Dietetics, VSP Registry, and the multidisciplinary workspace.

Goal: make every current input, path, storage target, route transition, and downstream output visible in one place so we can streamline toward a unified experience.

For browser-openable visual versions that do not depend on Mermaid rendering support, open either `docs/patient-note-creation-flow.svg` or `docs/patient-note-creation-flow.html`.

## Current-State Flow

```mermaid
flowchart TD
  subgraph VSP["VSP Registry"]
    V1["Faculty opens #/vsp/registry"]
    V2["Patient form inputs\n- first/last/middle/preferred name\n- DOB, sex, gender identity, pronouns\n- race, ethnicity, marital status\n- language, interpreter\n- height, weight, blood type\n- contact + address\n- emergency contact\n- insurance\n- allergies\n- medical/surgical history\n- medications\n- code status, PCP"]
    V3["createPatient(fields) / updatePatient(vspId, fields)"]
    V4["Canonical VSP patient record"]
    V5["Local registry store"]
    V6["Fire-and-forget sync to /api/patients"]
    V1 --> V2 --> V3 --> V4
    V4 --> V5
    V4 --> V6
  end

  subgraph PTS["PT Student"]
    P1["My Patients panel"]
    P2["New blank patient\nInputs: name, DOB, sex via inline card edits"]
    P3["Import from Registry\nInputs copied from VSP picker"]
    P4["Local PT patient record\npatient_<blankId>"]
    P5["Start note\nButtons:\n- New Eval (SOAP)\n- Simple SOAP"]
    P6["Draft seeded from patient meta\nsubjective gets:\nname, DOB, age, sex, pronouns,\nlanguage, interpreter, height, weight, __vspId"]
    P7["PT draft\ndraft_<patientId>_eval"]
    P8["Route\n#/student/editor?case=<patientId>&encounter=eval"]
    P1 --> P2 --> P4
    P1 --> P3 --> P4
    P4 --> P5 --> P6 --> P7 --> P8
  end

  subgraph PTI["PT Instructor"]
    I1["Create Case modal"]
    I2["Manual case inputs\n- title\n- optional VSP patient\n- DOB / age\n- sex\n- setting\n- acuity"]
    I3["Prompt-generated case inputs\n- prompt\n- region\n- condition\n- setting\n- acuity\n- age\n- sex\n- pain\n- goal\n- optional title"]
    I4["Case object built with\nmeta + snapshot + encounters.eval"]
    I5["PT store-backed case"]
    I6["Route\n#/instructor/editor?case=<newCase.id>"]
    I1 --> I2 --> I4
    I1 --> I3 --> I4
    I4 --> I5 --> I6
  end

  subgraph DSR["Dietetics Student / Faculty"]
    D1["Dietetics case creation"]
    D2["Inputs\n- case title\n- diet order\n- selected VSP patient"]
    D3["Case meta stores copied patient fields\n- patientName\n- DOB\n- sex\n- allergies\n- vspId"]
    D4["dietetics_emr_cases"]
    D5["Route\n#/dietetics/student/editor?case=<id>\nor\n#/dietetics/instructor/editor?case=<id>"]
    D1 --> D2 --> D3 --> D4 --> D5
  end

  subgraph MWS["Multidisciplinary Dietetics/PT Workspace"]
    M1["Open dietetics editor / patient switcher"]
    M2["Select profession + template\nCatalog:\n- dietetics-ncp\n- pt-eval\n- pt-simple-soap"]
    M3["If PT selected from dietetics shell:\nensureLinkedPtCaseId()"]
    M4["Linked PT local patient\npatient_<blankPtId>"]
    M5["ensurePilotPtDraft(templateId)"]
    M6["PT pilot draft\ndraft_<blankPtId>_<encounter>"]
    M7["Dietetics draft\ndietetics_draft_<caseId>"]
    M8["Shared active note session / sidebar / current note workspace"]
    M1 --> M2
    M2 -->|Dietetics| M7 --> M8
    M2 -->|PT| M3 --> M4 --> M5 --> M6 --> M8
  end

  subgraph OUT["Shared Note Outputs"]
    O1["Preview modal"]
    O2["Signature modal\nInputs: clinician name + title"]
    O3["Signed draft metadata\nmeta.signature"]
    O4["Word export download"]
    O5["Case File entry"]
    O6["Amend flow\nremove signature -> mark amendingFrom -> re-sign"]
    O1 --> O2 --> O3
    O3 --> O4
    O3 --> O5
    O3 --> O6 --> O3
  end

  V4 --> P3
  V4 --> I2
  V4 --> D2
  D4 --> M1
  P7 --> O1
  M6 --> O1
  M7 --> O1
  I5 --> O1
```

## Inputs, Paths, and Outputs by Funnel

| Funnel                      | Primary inputs                                                      | Main path                                              | Persisted outputs                                                                            |
| --------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| VSP Registry                | Full patient demographics, contact, clinical, insurance, directives | `#/vsp/registry` -> `createPatient` / `updatePatient`  | Canonical VSP record, local registry store, optional `/api/patients` sync                    |
| PT student local patient    | Inline patient name, DOB, sex, optional VSP import fields           | My Patients -> create/import patient -> start note     | `patient_<id>`, `draft_<id>_eval`, PT editor route                                           |
| PT instructor case          | Manual form or prompt-generation anchors                            | Create Case / Generate Case -> `_createCase(caseData)` | PT case store record, PT instructor editor route                                             |
| Dietetics case              | Title, diet order, picked VSP patient                               | Dietetics cases -> `createNewCase(metaFields)`         | `dietetics_emr_cases`, dietetics editor route                                                |
| Multidiscipline note launch | Existing dietetics case + chosen profession/template                | `createPilotNoteSession()` -> launch template          | `dietetics_draft_<caseId>` or linked `patient_<blankPtId>` + `draft_<blankPtId>_<encounter>` |
| Sign/export/amend           | Preview edits, signature name/title                                 | preview -> sign -> save -> export / case file / amend  | signed draft metadata, Word download, Case File record, amendment history                    |

## Data Duplication Map

```mermaid
flowchart LR
  A["Canonical VSP patient"]
  B["Local PT patient meta\npatient_<id>"]
  C["PT draft subjective\nsubjective.* + __vspId"]
  D["PT instructor case meta"]
  E["PT instructor case snapshot"]
  F["Dietetics case meta"]
  G["Linked PT patient created from dietetics shell"]
  H["Pilot PT draft"]
  I["Workspace index aggregation"]

  A -->|"picker copy"| B
  B -->|"seed note"| C
  A -->|"optional picker autofill"| D
  D --> E
  A -->|"picker copy"| F
  F -->|"buildPilotPtPatientMeta"| G
  G -->|"seed PT pilot note"| H
  A --> I
  B --> I
  F --> I
  G --> I
```

## Current Pain Points

1. Patient identity is created in multiple places.
   VSP is the closest thing to a canonical patient, but PT local patients, dietetics case meta, PT instructor case snapshots, and dietetics-created linked PT patients all hold overlapping patient identity fields.

2. Note launch is inconsistent across disciplines.
   PT student creates patient first then note. PT instructor creates case first. Dietetics creates case and patient copy together. The multidisciplinary shell launches notes from an existing dietetics case and may synthesize a PT patient behind the scenes.

3. Note storage is split by discipline and shell.
   PT uses `draft_<caseId>_<encounter>`, dietetics uses `dietetics_draft_<caseId>`, and multidisciplinary PT creates additional linked IDs that are not obviously the same patient to the user.

4. Patient demographics are copied forward instead of referenced.
   Name, DOB, sex, allergies, language, interpreter needs, height/weight, and `vspId` are copied into case meta and note subjective payloads, which creates drift risk.

5. Shared outputs happen late instead of from a common note envelope.
   Sign/export/amend/case-file behavior is increasingly shared, but the inputs still arrive from discipline-specific draft shapes and storage keys.

## Unified Target Funnel

```mermaid
flowchart TD
  T1["Step 1: Select existing patient\nor create new patient once"]
  T2["Canonical patient profile\nsingle patientId"]
  T3["Step 2: Select note/workflow\n- PT Evaluation\n- PT SOAP\n- Dietetics NCP\n- future note types"]
  T4["Create encounter + note envelope\n{ patientId, encounterId, professionId, templateId, status }"]
  T5["Open shared workspace shell\nprofession-specific form inside"]
  T6["Shared outputs\nsave draft, sign, export, case file, amend"]
  T7["Shared chart timeline / patient workspace index"]

  T1 --> T2 --> T3 --> T4 --> T5 --> T6 --> T7
```

## Recommended Streamlining Moves

1. Make the VSP-style patient record the only patient creation source.
   Every creation flow should begin with "select patient" or "create patient", then carry a single `patientId` forward instead of copying patient identity into case-local stores.

2. Introduce one note envelope abstraction for every discipline.
   PT and dietetics drafts should both resolve to one storage contract such as `{ patientId, encounterId, professionId, templateId, content, status, signature, sourceCaseId }`.

3. Separate patient creation, case context, and note launch.
   The UI should present one front door: patient -> note type -> workspace. Optional case metadata like setting, acuity, or diet order should attach as encounter/context fields, not as alternate patient sources.

4. Stop synthesizing hidden PT patients from the dietetics shell.
   The multidisciplinary workspace should reference the same canonical patient and create a PT encounter for that patient rather than creating a new local blank PT patient.

5. Keep sign/export/amend/case-file fully shared.
   These are already converging into common behavior and should sit on top of the unified note envelope rather than discipline-specific storage keys.

## Practical First Refactor

If we want the smallest high-leverage change first, the best sequence is:

1. Normalize every creation flow to carry `patientId` and `templateId`.
2. Add a shared note record wrapper around existing PT and dietetics drafts.
3. Replace copied patient demographics in new drafts with a patient reference plus a generated display snapshot.
4. Retire the dietetics-created linked PT patient path once the shared patient reference exists.

## Source Pointers

- `app/js/views/vsp/registry.js`
- `app/js/core/vsp-registry.js`
- `app/js/views/student/cases.js`
- `app/js/views/instructor/cases.js`
- `app/js/views/dietetics/student/cases.js`
- `app/js/views/dietetics/instructor/cases.js`
- `app/js/views/dietetics/note_session_controller.js`
- `app/js/core/patientWorkspaceIndex.js`
- `app/js/core/noteCatalog.js`
- `app/js/features/navigation/sign-export-panel.js`
- `app/js/features/navigation/panels/MyNotesPanel.js`
- `app/js/views/dietetics/case_editor.js`
