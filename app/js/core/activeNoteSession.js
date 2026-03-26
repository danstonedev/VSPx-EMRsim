import { getDraftTemplateLabel, getProfessionLabel } from './noteCatalog.js';

const DEFAULT_EDITOR_CONTEXT = {
  caseId: '',
  encounter: 'eval',
  hostCaseId: '',
  isFacultyMode: false,
  professionId: 'pt',
  templateId: '',
};

export function normalizeEditorContext(raw = {}) {
  return {
    ...DEFAULT_EDITOR_CONTEXT,
    ...raw,
    caseId: raw?.caseId || '',
    encounter: raw?.encounter || DEFAULT_EDITOR_CONTEXT.encounter,
    hostCaseId: raw?.hostCaseId || '',
    isFacultyMode: !!raw?.isFacultyMode,
    professionId: raw?.professionId || DEFAULT_EDITOR_CONTEXT.professionId,
    templateId: raw?.templateId || '',
  };
}

export function resolveEditorContextFromHash(hash) {
  const currentHash = hash ?? (typeof window !== 'undefined' ? window.location.hash || '' : '');
  const query = new URLSearchParams(currentHash.split('?')[1] || '');
  const isDietetics = currentHash.startsWith('#/dietetics/');

  return normalizeEditorContext({
    professionId: isDietetics ? 'dietetics' : 'pt',
    caseId: query.get('case') || '',
    encounter: query.get('encounter') || (isDietetics ? 'nutrition' : 'eval'),
    isFacultyMode: currentHash.includes('/instructor/'),
    templateId: query.get('template') || '',
  });
}

export function getCurrentEditorContext() {
  if (typeof window !== 'undefined' && window.currentEditorContext) {
    return normalizeEditorContext(window.currentEditorContext);
  }
  return resolveEditorContextFromHash();
}

export function getCurrentDraft(fallback = null) {
  if (typeof window !== 'undefined' && window.currentDraft) {
    return window.currentDraft;
  }
  return fallback;
}

export function syncActiveNoteSession({
  draft,
  context,
  saveDraft,
  refreshChartProgress,
  noteStatus = '',
}) {
  const normalizedContext = normalizeEditorContext(context);

  if (typeof window === 'undefined') {
    return normalizedContext;
  }

  window.currentDraft = draft;
  window.currentEditorContext = normalizedContext;
  if (typeof saveDraft === 'function') {
    window.saveDraft = saveDraft;
  }
  if (refreshChartProgress !== undefined) {
    window.refreshChartProgress = refreshChartProgress;
  }
  if (noteStatus && typeof window.updateNoteStatusBadge === 'function') {
    window.updateNoteStatusBadge(noteStatus);
  }

  // Update the active-note indicator in the patient header
  if (typeof window.updateActiveNoteLabel === 'function') {
    const templateLabel = getDraftTemplateLabel(draft, normalizedContext.encounter);
    const professionLabel = getProfessionLabel(normalizedContext.professionId);
    window.updateActiveNoteLabel(templateLabel, professionLabel);
  }

  return normalizedContext;
}
