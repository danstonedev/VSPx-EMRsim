// sign-export-panel.js
// Renders the Sign & Export footer action as a lazily-loaded panel.
// Loaded on demand by ChartNavigation to keep main bundle size down.

import { el } from '../../ui/utils.js';
import { safeAsync } from '../../core/async.js';
import { emit } from '../../core/events.js';

/**
 * Render the Sign & Export panel
 * @param {HTMLElement} container target container element
 * @param {Object} options
 * @param {Object} options.caseData current case data (draft-applied upstream when possible)
 */
export function render(container, options = {}) {
  if (!container) return { cleanup() {} };
  const { caseData = {} } = options;

  function mergeDraftOverlays(out, draft) {
    try {
      if (draft.noteTitle) out.title = draft.noteTitle;
    } catch {}
    try {
      if (draft.snapshot) out.snapshot = { ...(out.snapshot || {}), ...draft.snapshot };
    } catch {}
    try {
      if (draft.meta) out.meta = { ...(out.meta || {}), ...draft.meta };
    } catch {}
  }

  function coalesce(...values) {
    for (const v of values) {
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  }

  function emitExportCompleted(out, draft) {
    const caseId = coalesce(out?.meta?.caseId, draft?.meta?.caseId, out?.id, draft?.id);
    const encounterId = coalesce(out?.meta?.encounterId, draft?.meta?.encounterId);
    emit('export:completed', { caseId, encounterId, format: 'docx' });
  }

  async function exportAfterSignature(out, draft) {
    try {
      const { ensureExportLibsLoaded } = await import('../../services/export-loader.js');
      await ensureExportLibsLoaded();
      const { exportToWord } = await import('../../services/document-export.js');
      exportToWord(out, draft);
      emitExportCompleted(out, draft);
    } catch (e) {
      console.error('Export to Word failed after signing:', e);
      alert('Unable to complete export.');
    }
  }

  async function openSignature(out, draft) {
    try {
      const { openSignatureDialog, getPersistedSignatureMeta } =
        await import('../signature/SignatureModal.js');
      openSignatureDialog({
        existingSignature: (out.meta && out.meta.signature) || getPersistedSignatureMeta(),
        onSigned: async (signature) => {
          out.meta = { ...(out.meta || {}), signature };
          await exportAfterSignature(out, draft);
        },
      });
    } catch (e) {
      console.error('Failed to open signature dialog:', e);
      alert('Unable to open signature dialog.');
    }
  }

  const handleExportClick = safeAsync(async () => {
    const out = caseData || {};
    const draft = (typeof window !== 'undefined' && window.currentDraft) || out || {};
    mergeDraftOverlays(out, draft);
    await openSignature(out, draft);
  });

  const root = el('div', { class: 'sign-export-panel', style: 'margin: 24px 0 8px 0;' }, [
    el(
      'button',
      {
        class: 'btn primary',
        style: 'width:100%;',
        title: 'Sign the evaluation then export to a Word document',
        onClick: handleExportClick,
      },
      'Sign & Export',
    ),
  ]);

  container.replaceChildren(root);
  return {
    cleanup() {
      try {
        // Replace with empty node to drop listeners and DOM
        container.replaceChildren();
      } catch {}
    },
  };
}

// (legacy alias removed)
