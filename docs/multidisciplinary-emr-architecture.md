# Multidisciplinary EMR Architecture: Current State vs Best Practice

## Why this matters now

The patient database and cross-discipline charting introduce a shift from "single-note workflows" to a longitudinal chart model.  
Case File and export should now be treated as shared chart capabilities, not discipline-only features.

## Current implementation (what we have)

- Patient linking exists (`vspId` in case metadata).
- PT and Dietetics editors each keep discipline-specific case maps and drafts in browser storage.
- Case File entries are attached to per-case `modules` arrays.
- Sign and export are available in PT and now mounted in Dietetics.
- Word export logic has historically been PT/SOAP-centric (now with Dietetics ADIME path added).

## EMR best-practice target model

- `Patient` (longitudinal identity): demographics, identifiers, global chart index.
- `Encounter` (discipline event): date, discipline, author, status, note payload pointer.
- `Note` (structured clinical content): schema-versioned JSON for PT SOAP, Dietetics ADIME, etc.
- `Artifact` (Case File item): labs, imaging, referrals, uploads, forms, external documents.
- `Signature/Audit`: signer, role, timestamp, note hash/version, amendment chain.
- `Export Job`: generated output metadata (format, template version, timestamp, source note version).

## Gaps to close for scale

- Storage split by discipline key instead of a unified patient chart index.
- Case File currently attached to each local case rather than normalized patient/encounter artifacts.
- Export templates are not yet centralized by discipline/template version.
- Signature state is present but not yet tied to immutable note versioning.

## Recommended phased plan

1. Introduce unified chart index

- Create shared store keyed by `patientId` with child `encounterIds`.
- Keep current discipline drafts, but write-through normalized encounter summaries.

2. Normalize Case File

- Move artifact records to shared `artifacts` collection with `patientId` and optional `encounterId`.
- Keep local `modules` as compatibility view until migration completes.

3. Standardize note envelopes

- Store every note as:
  - `discipline`
  - `templateId` (for example `pt.soap.v1`, `dietetics.adime.v1`)
  - `schemaVersion`
  - `content`
  - `status` (`draft`, `signed`, `amended`)

4. Harden signature and export workflow

- On sign: freeze note version + append signature metadata.
- On export: require signed version reference, log export record for audit.

5. Add interoperability hooks

- Add discipline-agnostic timeline API: "all encounters + artifacts for patient".
- Add permission tags for faculty/student and discipline scope.

## UI implications

- Keep sidebar `Case File` and `Sign & Export` placement consistent across disciplines.
- Render discipline-specific forms in content pane, but source artifacts from the same shared data layer.
- Preserve "just-in-time help" (hover/tooltips) discipline by discipline without changing core model.

## Immediate next build items

- Add a shared `chart-records` service for patient/encounter/artifact CRUD.
- Add migration utility to backfill existing PT/Dietetics local records into the unified index.
- Add versioned export template resolver (`templateId -> renderer`) for Word generation.
