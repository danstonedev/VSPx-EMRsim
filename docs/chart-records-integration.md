# Chart Records Integration Notes

## Purpose

The Svelte migration now has a normalized chart model behind the legacy case store.
This gives us a stable path from case-centric browser storage to patient/encounter/note/artifact records without breaking the current editor routes.

## Storage model

- `ChartPatient`: longitudinal identity keyed by `vspId` when present, otherwise by legacy case id
- `ChartEncounter`: normalized encounter record keyed by `caseId + encounterKey`
- `NoteEnvelope`: versioned note record with `discipline`, `templateId`, `schemaVersion`, `status`, and `content`
- `ChartArtifact`: normalized case-file/artifact record
- `ExportJobRecord`: audit log for note exports

Primary implementation:

- [chartRecords.ts](/c:/Users/danst/VSPx-EMRsim/src/lib/services/chartRecords.ts)
- [exportTemplates.ts](/c:/Users/danst/VSPx-EMRsim/src/lib/services/exportTemplates.ts)
- [exportAudit.ts](/c:/Users/danst/VSPx-EMRsim/src/lib/services/exportAudit.ts)

## Compatibility behavior

Existing legacy operations now write through to chart records:

- `createCase()` creates/updates normalized patient and encounter metadata
- `updateCase()` refreshes normalized patient and encounter metadata
- `deleteCase()` removes normalized case-linked chart records
- `saveDraft()` writes a `draft` note envelope for the active encounter

This wiring lives in [store.ts](/c:/Users/danst/VSPx-EMRsim/src/lib/store.ts).

## Read-side APIs

Use these selectors instead of reading raw storage directly:

- `getChartCaseContext(caseId, caseObj?)`
- `listEncountersForCase(caseId)`
- `listNotesForEncounter(caseId, encounterKey)`
- `getCurrentDraftNote(caseId, encounterKey)`
- `getCurrentSignedNote(caseId, encounterKey)`
- `buildMyNotesEntries(caseId)`
- `buildCaseFileEntries(caseId)`
- `listExportJobsForCase(caseId)`

Reactive wrapper:

- [chartRecords store](/c:/Users/danst/VSPx-EMRsim/src/lib/stores/chartRecords.ts)

## Current limits

- Export audit exists, but the editor/export UI is not yet calling it.
- Signed notes are versioned records, but the UI still needs to consume them.
- Migration helpers cover current legacy drafts/modules and common encounter shapes, but more edge-case mapping may still be needed for older records.

## Safe next integrations

- Wire `MyNotesPanel` to `buildMyNotesEntries(caseId)`
- Wire `CaseFilePanel` to `buildCaseFileEntries(caseId)`
- On export success, call `recordExportAudit({ noteId, templateId, format })`
- Use `getCurrentSignedNote(caseId, encounterKey)` when opening read-only signed note views
