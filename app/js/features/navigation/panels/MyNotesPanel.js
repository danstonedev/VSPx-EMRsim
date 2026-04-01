/**
 * MyNotesPanel - lists the student's completed/in-progress notes for the
 * current case. Signed notes can be amended to mirror production EMR flows.
 *
 * Data sources:
 * - PT drafts keyed as `draft_<caseId>_<encounter>`
 * - Dietetics drafts keyed as `dietetics_draft_<caseId>`
 * - Pilot-linked PT drafts discovered through `caseObj.meta.multidisciplinePilot`
 */

import { el } from '../../../ui/utils.js';
import { listDrafts } from '../../../core/store.js';
import { storage } from '../../../core/adapters/storageAdapter.js';
import {
  getCurrentDraft,
  getCurrentEditorContext as readCurrentEditorContext,
} from '../../../core/activeNoteSession.js';
import {
  buildEditorHash,
  getDraftProfessionId,
  getDraftTemplateId,
  getDraftTemplateLabel,
  getProfessionLabel,
  isDieteticsDraft,
} from '../../../core/noteCatalog.js';
import { finalizeDraftSignature } from '../../../core/noteLifecycle.js';
import { renderSignedNoteViewer } from './SignedNoteViewer.js';
import { openNotePreviewModal } from './NotePreviewModal.js';

const DIET_PREFIX = 'dietetics_draft_';

function getDraftsForCase(caseId, caseObj) {
  if (!caseId) {
    console.warn('[MyNotes] caseId is empty - cannot look up drafts');
    return [];
  }

  const results = [];
  const seenKeys = new Set();
  const linkedPtCaseId = caseObj?.meta?.multidisciplinePilot?.ptPatientId || '';

  function pushDraft(result) {
    if (seenKeys.has(result.key)) return;
    seenKeys.add(result.key);
    results.push(result);
  }

  function pushPtDrafts(ptCaseId, allDrafts, hostCaseId = '') {
    if (!ptCaseId) return;
    const caseDrafts = allDrafts?.[ptCaseId];
    if (!caseDrafts) return;

    for (const [encounter, data] of Object.entries(caseDrafts)) {
      pushDraft({
        encounter,
        data,
        key: `draft_${ptCaseId}_${encounter}`,
        routeCaseId: ptCaseId,
        professionId: 'pt',
        hostCaseId,
      });
    }
  }

  try {
    const allDrafts = listDrafts();
    pushPtDrafts(caseId, allDrafts);
    if (linkedPtCaseId && linkedPtCaseId !== caseId) {
      pushPtDrafts(linkedPtCaseId, allDrafts, caseId);
    }
  } catch (e) {
    console.warn('[MyNotes] listDrafts() failed:', e);
  }

  try {
    const dietKey = `${DIET_PREFIX}${caseId}`;
    const raw = storage.getItem(dietKey);
    if (raw) {
      pushDraft({
        encounter: 'nutrition',
        data: JSON.parse(raw),
        key: dietKey,
        routeCaseId: caseId,
        professionId: 'dietetics',
      });
    }
  } catch {
    /* ignore corrupt entry */
  }

  const live = getCurrentDraft();
  if (live) {
    const current = readCurrentEditorContext();
    const visibleCaseIds = new Set([caseId, linkedPtCaseId].filter(Boolean));

    if (current.caseId && visibleCaseIds.has(current.caseId)) {
      const liveKey =
        current.professionId === 'dietetics'
          ? `${DIET_PREFIX}${current.caseId}`
          : `draft_${current.caseId}_${current.encounter}`;
      const existing = results.find((item) => item.key === liveKey);

      if (existing) {
        existing.data = live;
      } else {
        pushDraft({
          encounter: current.encounter,
          data: live,
          key: liveKey,
          hostCaseId: current.hostCaseId || '',
          routeCaseId: current.caseId,
          professionId: current.professionId,
        });
      }
    }
  }

  results.sort((a, b) => {
    const aSigned = a.data?.meta?.signature?.signedAt;
    const bSigned = b.data?.meta?.signature?.signedAt;
    if (aSigned && bSigned) return bSigned.localeCompare(aSigned);
    if (aSigned) return -1;
    if (bSigned) return 1;
    return getDraftTemplateLabel(a.data, a.encounter).localeCompare(
      getDraftTemplateLabel(b.data, b.encounter),
    );
  });

  return results;
}

function noteStatus(data) {
  if (data?.meta?.signature) {
    if (data.amendments && data.amendments.length > 0) return 'amended';
    return 'signed';
  }
  return 'draft';
}

function statusLabel(status) {
  const map = { draft: 'Draft', signed: 'Signed', amended: 'Amended' };
  return map[status] || status;
}

function sectionHasContent(value) {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => sectionHasContent(item));
  if (typeof value === 'object')
    return Object.values(value).some((item) => sectionHasContent(item));
  return false;
}

function completionSummary(data) {
  if (isDieteticsDraft(data)) {
    const filled = [
      'nutrition_assessment',
      'nutrition_diagnosis',
      'nutrition_intervention',
      'nutrition_monitoring',
      'billing',
    ].filter((section) => sectionHasContent(data[section])).length;
    const hasScheduling = sectionHasContent(data.scheduling);
    return `${filled + (hasScheduling ? 1 : 0)}/6 sections`;
  }

  if (data?.noteType === 'simple-soap') {
    const filled = ['subjective', 'objective', 'assessment', 'plan'].filter((section) =>
      sectionHasContent(data?.simpleSOAP?.[section]),
    ).length;
    return `${filled}/4 sections`;
  }

  const sections = ['subjective', 'assessment', 'goals', 'plan'];
  const filled = sections.filter((section) => sectionHasContent(data[section])).length;
  const hasObjective = sectionHasContent(data.objective) ? 1 : 0;
  return `${filled + hasObjective}/5 sections`;
}

export function renderMyNotes(container, caseObj, caseId) {
  container.replaceChildren();

  const drafts = getDraftsForCase(caseId, caseObj);

  if (drafts.length === 0) {
    container.appendChild(
      el('div', { class: 'my-notes__empty' }, [
        el('p', { class: 'my-notes__empty-icon' }, ['\u{1F4DD}']),
        el('p', { class: 'my-notes__empty-text' }, ['No notes yet for this case.']),
        el('p', { class: 'my-notes__empty-hint' }, [
          'Notes appear here once you start documenting in the Note Guide tab.',
        ]),
      ]),
    );
    return;
  }

  const list = el('ul', { class: 'my-notes__list' });

  for (const { encounter, data, key, routeCaseId, professionId, hostCaseId } of drafts) {
    const status = noteStatus(data);
    const signedAt = data?.meta?.signature?.signedAt;
    const noteTarget = {
      caseId: routeCaseId,
      encounter,
      hostCaseId,
      professionId,
      templateId: getDraftTemplateId(data, encounter),
    };
    const templateLabel = getDraftTemplateLabel(data, encounter);

    const header = el('div', { class: 'my-notes__card-header' }, [
      el('span', { class: 'my-notes__encounter' }, [templateLabel]),
      el('span', { class: `my-notes__badge my-notes__badge--${status}` }, [statusLabel(status)]),
    ]);

    const metaParts = [getProfessionLabel(getDraftProfessionId(data) || professionId)];
    if (signedAt) {
      try {
        metaParts.push(
          `Signed ${new Date(signedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
        );
      } catch {
        metaParts.push('Signed');
      }
    }
    if (data?.meta?.signature?.name) {
      metaParts.push(data.meta.signature.name);
    }
    if (status === 'draft') {
      metaParts.push(completionSummary(data));
    }

    const meta = metaParts.length
      ? el('div', { class: 'my-notes__meta' }, [metaParts.join(' \u2022 ')])
      : null;

    let amendmentSection = null;
    if (data.amendments && data.amendments.length > 0) {
      const items = data.amendments.map((amendment) =>
        el('li', { class: 'my-notes__amendment' }, [
          el('span', { class: 'my-notes__amendment-date' }, [formatTimestamp(amendment.timestamp)]),
          el('span', { class: 'my-notes__amendment-text' }, [amendment.text]),
        ]),
      );
      amendmentSection = el('div', { class: 'my-notes__amendments' }, [
        el('h4', { class: 'my-notes__amendments-title' }, ['Amendments']),
        el('ul', { class: 'my-notes__amendment-list' }, items),
      ]);
    }

    const actions = el('div', { class: 'my-notes__actions' });
    if (status === 'draft') {
      const ctxLabel = `${getProfessionLabel(getDraftProfessionId(data) || professionId)} \u2022 ${templateLabel}`;
      actions.appendChild(
        el(
          'button',
          {
            class: 'btn btn--sm btn--outline my-notes__btn',
            title: `Continue editing: ${ctxLabel}`,
            onClick: () => navigateToNote(noteTarget),
          },
          `Continue Editing \u2014 ${templateLabel}`,
        ),
      );
    } else {
      actions.appendChild(
        el(
          'button',
          {
            class: 'btn btn--sm btn--outline my-notes__btn',
            title: 'View signed note',
            onClick: () => showSignedNote(container, caseObj, caseId, data, noteTarget),
          },
          'View Note',
        ),
      );
      actions.appendChild(
        el(
          'button',
          {
            class: 'btn btn--sm primary my-notes__btn',
            title: 'Unlock this note for amendment (requires re-signing)',
            onClick: () => beginAmendment(key, data, noteTarget, caseObj, container, caseId),
          },
          'Amend',
        ),
      );
    }

    const card = el('li', { class: 'my-notes__card' }, [
      header,
      ...(meta ? [meta] : []),
      ...(amendmentSection ? [amendmentSection] : []),
      actions,
    ]);
    list.appendChild(card);
  }

  container.appendChild(
    el('div', { class: 'my-notes' }, [
      el('h3', { class: 'my-notes__heading' }, ['Note History']),
      list,
    ]),
  );
}

function navigateToNote(noteTarget) {
  if (noteTarget.professionId === 'pt' && noteTarget.hostCaseId) {
    const mode = readCurrentEditorContext().isFacultyMode ? 'instructor' : 'student';
    const query = new URLSearchParams({
      case: noteTarget.hostCaseId,
      profession: 'pt',
      template: noteTarget.templateId || 'pt-eval',
    });
    window.location.hash = `#/dietetics/${mode}/editor?${query.toString()}`;
    return;
  }

  const hash = buildEditorHash({
    professionId: noteTarget.professionId,
    caseId: noteTarget.caseId,
    encounter: noteTarget.encounter,
    isFacultyMode: readCurrentEditorContext().isFacultyMode,
  });
  window.location.hash = hash;
}

function showSignedNote(container, caseObj, caseId, draftData, noteTarget) {
  renderSignedNoteViewer(container, caseObj, draftData, {
    onBack: () => renderMyNotes(container, caseObj, caseId),
    onAmend: () =>
      beginAmendment(
        inferStorageKey(noteTarget),
        draftData,
        noteTarget,
        caseObj,
        container,
        caseId,
      ),
  });
}

function beginAmendment(storageKey, data, noteTarget, caseObj, container, caseId) {
  if (!data.meta) data.meta = {};
  data.meta.amendingFrom = {
    signedAt: data.meta.signature?.signedAt,
    signedBy: data.meta.signature?.name,
  };
  delete data.meta.signature;

  try {
    storage.setItem(storageKey, JSON.stringify(data));
  } catch (e) {
    console.error('[MyNotes] Failed to persist amendment state:', e);
  }

  const isCurrentTarget = currentTargetMatches(noteTarget);

  if (isCurrentTarget && typeof window !== 'undefined' && window.currentDraft) {
    window.currentDraft.meta = data.meta;
    delete window.currentDraft.meta.signature;
    window.currentDraft.meta.amendingFrom = data.meta.amendingFrom;
  }

  if (
    isCurrentTarget &&
    typeof window !== 'undefined' &&
    typeof window.updateNoteStatusBadge === 'function'
  ) {
    window.updateNoteStatusBadge('amending');
  }

  // Open the preview modal in amend mode
  openNotePreviewModal({
    caseData: caseObj || {},
    draft: data,
    mode: 'amend',
    async onConfirmSign(updates, signature) {
      // Apply preview edits back to the draft
      for (const key of Object.keys(updates)) {
        const val = updates[key];
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          data[key] = { ...(data[key] || {}), ...val };
        } else {
          data[key] = val;
        }
      }

      // Proceed to signature logic
      if (signature) {
        finalizeDraftSignature(data, signature);
      }

      try {
        storage.setItem(storageKey, JSON.stringify(data));
      } catch {
        /* best-effort */
      }

      // Sync in-memory draft if this is the active editor target
      if (isCurrentTarget && typeof window !== 'undefined' && window.currentDraft) {
        Object.assign(window.currentDraft, data);
        window.currentDraft.meta = data.meta;
      }
      if (typeof window.updateNoteStatusBadge === 'function') {
        window.updateNoteStatusBadge('signed');
      }
      if (typeof window.saveSignedNoteToCasefile === 'function') {
        try {
          window.saveSignedNoteToCasefile({
            draft: data,
            context: {
              caseId: noteTarget.caseId,
              encounterId: noteTarget.encounter,
              professionId: noteTarget.professionId,
              templateId: noteTarget.templateId,
              sourceKey: storageKey,
            },
          });
        } catch (err) {
          console.warn('[MyNotes] Failed to update Case File note entry:', err);
        }
      }
      // Re-render My Notes to reflect new signed state
      if (container && caseObj && caseId) {
        renderMyNotes(container, caseObj, caseId);
      }
    },
    onCancel() {
      // Revert: restore signature if user cancels the amendment
      if (data.meta?.amendingFrom) {
        data.meta.signature = {
          signedAt: data.meta.amendingFrom.signedAt,
          name: data.meta.amendingFrom.signedBy,
        };
        delete data.meta.amendingFrom;
        try {
          storage.setItem(storageKey, JSON.stringify(data));
        } catch {
          /* best-effort */
        }
        if (isCurrentTarget && window.currentDraft) {
          window.currentDraft.meta = data.meta;
        }
        if (typeof window.updateNoteStatusBadge === 'function') {
          window.updateNoteStatusBadge('signed');
        }
      }
    },
  });
}

function inferStorageKey(noteTarget) {
  if (noteTarget.professionId === 'dietetics') {
    return `${DIET_PREFIX}${noteTarget.caseId}`;
  }
  return `draft_${noteTarget.caseId}_${noteTarget.encounter || 'eval'}`;
}

function currentTargetMatches(noteTarget) {
  const current = readCurrentEditorContext();
  return (
    current.professionId === noteTarget.professionId &&
    current.caseId === noteTarget.caseId &&
    (noteTarget.professionId === 'dietetics' || current.encounter === noteTarget.encounter)
  );
}

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso || '';
  }
}
