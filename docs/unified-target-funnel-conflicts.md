# Unified Target Funnel Conflict Log

This log tracks integration conflicts discovered while implementing the unified launcher so we can keep shipping without losing the follow-up work.

## Addressed in this slice

1. PT student editor only supports `blank-*` patient-backed note entry.
   Resolution: the unified launcher still starts from a canonical VSP patient, then creates a compatibility `patient_<blankId>` record and PT draft behind the scenes before routing to the existing student PT editor.

2. PT faculty flow expects a store-backed case before editing.
   Resolution: the unified launcher creates the PT case wrapper up front, seeds a compatible PT draft, and then routes to the existing faculty PT editor.

3. Dietetics editor is case-based rather than note-envelope-based.
   Resolution: the unified launcher creates a dietetics case with the canonical `patientId` and `vspId`, then routes to the existing dietetics workspace.

4. Route schema is still profession-specific.
   Resolution: the user-facing entry point is now unified per role, but the launcher still fans out into the existing editor routes for compatibility.

5. Live student local cache must survive refactor rollout.
   Resolution: startup now runs a non-destructive preservation pass that mirrors legacy PT and dietetics drafts into `unified_note_envelopes` without deleting or renaming the original local storage keys.

6. Role selection lived outside the note-launch entry point.
   Resolution: the unified workspace now owns Student, Faculty, and Admin mode selection, while the access session keeps a separate "capability" record so elevated users can temporarily switch down to student mode without losing the ability to switch back.

7. Header navigation still advertised multiple parallel front doors.
   Resolution: the primary header and mobile drawer now point to a single Workspace entry, while legacy dashboards and editors stay available as compatibility routes underneath.

## Still open after this slice

1. Shared outputs still operate on discipline-specific draft shapes.
   Impact: sign/export/amend is shared in behavior, but the underlying note payloads are still PT-specific or dietetics-specific rather than a single normalized note content model.

2. PT student compatibility records still duplicate patient identity locally.
   Impact: this slice unifies the front door and preserves canonical patient references, but the final duplication removal requires the PT student editor to stop depending on `blank-*` patient records.

3. Patient workspace index still aggregates multiple source types instead of reading one normalized chart index.
   Impact: the launcher improves new-entry consistency, but the longitudinal chart view is still assembled from mixed local stores.

4. Legacy student/faculty dashboards still exist as fallback routes.
   Impact: the top-level experience is now unified, but the old dashboards are still reachable by direct hash and should eventually be retired or converted into thin compatibility redirects once the unified workspace covers every needed legacy action.
