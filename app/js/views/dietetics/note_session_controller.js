import { storage } from '../../core/index.js';
import { getPilotTemplate, listPilotTemplatesForProfession } from '../../core/noteCatalog.js';
import { syncActiveNoteSession } from '../../core/activeNoteSession.js';
import { deriveNoteStatus } from '../../features/navigation/panels/NoteStatusBadge.js';

function createPilotBlankPtId() {
  return `blank-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeDobForPtPatientCard(rawDob) {
  const value = String(rawDob || '').trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
  }
  return value;
}

function buildPilotPtPatientMeta(caseObj, patientName) {
  const meta = caseObj?.meta || {};
  return {
    name: patientName || meta.patientName || meta.title || 'Pilot PT Patient',
    dob: normalizeDobForPtPatientCard(meta.dob),
    sex: meta.sex || 'unspecified',
    created: Date.now(),
    vspId: meta.vspId || '',
    preferredLanguage: meta.preferredLanguage || '',
    interpreterNeeded: meta.interpreterNeeded || '',
    allergies: meta.allergies || '',
  };
}

function buildPilotPtDraft(patientMeta, templateId) {
  const noteTitle = patientMeta?.name || 'New Patient';
  const subjective = {
    patientName: patientMeta?.name || '',
    patientBirthday: '',
    patientAge: '',
    patientGender: patientMeta?.sex || '',
    patientPreferredLanguage: patientMeta?.preferredLanguage || '',
    patientInterpreterNeeded: patientMeta?.interpreterNeeded || '',
    __vspId: patientMeta?.vspId || '',
  };

  if (patientMeta?.dob && /^\d{2}\/\d{2}\/\d{4}$/.test(patientMeta.dob)) {
    const [month, day, year] = patientMeta.dob.split('/');
    subjective.patientBirthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  if (templateId === 'pt-simple-soap') {
    return {
      noteType: 'simple-soap',
      noteTitle,
      subjective,
      simpleSOAP: { subjective: '', objective: '', assessment: '', plan: '' },
      __savedAt: Date.now(),
    };
  }

  return {
    noteType: 'standard',
    noteTitle,
    subjective,
    __savedAt: Date.now(),
  };
}

function loadJsonFromStorage(key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveJsonToStorage(key, value, label = 'storage item') {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[Dietetics] save ${label} failed:`, e);
  }
}

export function createPilotNoteSession({
  caseId,
  caseObj,
  patientName,
  dietDraft,
  isFacultyMode,
  requestedProfession = '',
  requestedTemplateId = '',
  defaultProfession = 'dietetics',
  defaultTemplateId = '',
  pilotMetaKey = 'multidisciplinePilot',
  dietDraftPrefix = 'dietetics_draft_',
  ptDraftOwnerCaseId = '',
  resolvePtEncounterId = (template) => template?.encounter || '',
  savePilotState,
  saveDietDraft,
}) {
  const savedPilotState = caseObj?.meta?.[pilotMetaKey] || {};
  const ptDraftCache = new Map();

  let selectedProfession =
    requestedProfession || savedPilotState.selectedProfession || defaultProfession || 'dietetics';
  let selectedTemplateId =
    requestedTemplateId ||
    savedPilotState.selectedTemplateId ||
    defaultTemplateId ||
    (selectedProfession === 'pt' ? 'pt-eval' : 'dietetics-ncp');

  function sanitizeTemplateSelection(professionId, templateId) {
    const templates = listPilotTemplatesForProfession(professionId);
    if (!templates.length) return '';
    if (templates.some((template) => template.id === templateId)) return templateId;
    return templates[0].id;
  }

  selectedTemplateId = sanitizeTemplateSelection(selectedProfession, selectedTemplateId);

  if (requestedProfession || requestedTemplateId) {
    savePilotState({
      selectedProfession,
      selectedTemplateId,
    });
  }

  function getSelectedProfession() {
    return selectedProfession;
  }

  function getSelectedTemplateId() {
    return selectedTemplateId;
  }

  function persistSelection(extra = {}) {
    return savePilotState({
      selectedProfession,
      selectedTemplateId,
      ...extra,
    });
  }

  function setSelectedProfession(professionId, { persist = true } = {}) {
    selectedProfession = professionId || 'dietetics';
    selectedTemplateId = sanitizeTemplateSelection(selectedProfession, selectedTemplateId);
    if (persist) persistSelection();
    return selectedTemplateId;
  }

  function setSelectedTemplateId(templateId, { persist = true } = {}) {
    selectedTemplateId = sanitizeTemplateSelection(selectedProfession, templateId);
    if (persist) persistSelection();
    return selectedTemplateId;
  }

  function updateDietDraft(nextDraft) {
    dietDraft = nextDraft;
    return dietDraft;
  }

  function getDietDraft() {
    return dietDraft;
  }

  function getPilotTemplateDraftKey(templateId, linkedCaseId) {
    if (templateId === 'dietetics-ncp') {
      return `${dietDraftPrefix}${caseId}`;
    }
    const template = getPilotTemplate(templateId);
    const encounterId = resolvePtEncounterId(template, templateId);
    return template && encounterId ? `draft_${linkedCaseId}_${encounterId}` : '';
  }

  function ensureLinkedPtCaseId() {
    if (ptDraftOwnerCaseId) return ptDraftOwnerCaseId;
    const current = caseObj?.meta?.[pilotMetaKey]?.ptPatientId;
    if (current) return current;

    const ptPatientId = createPilotBlankPtId();
    const patientMeta = buildPilotPtPatientMeta(caseObj, patientName);
    storage.setItem(`patient_${ptPatientId}`, JSON.stringify(patientMeta));
    persistSelection({ ptPatientId });
    return ptPatientId;
  }

  function savePtDraft(templateId, draftData) {
    const linkedPtCaseId = ensureLinkedPtCaseId();
    const template = getPilotTemplate(templateId);
    const draftKey = getPilotTemplateDraftKey(templateId, linkedPtCaseId);
    if (!template || !draftKey) return;

    draftData.meta = {
      ...(draftData.meta || {}),
      caseId: linkedPtCaseId,
      encounterId: resolvePtEncounterId(template, templateId),
      sourceCaseId: caseId,
    };

    ptDraftCache.set(templateId, draftData);
    saveJsonToStorage(draftKey, draftData, 'PT draft');
  }

  function ensurePilotPtDraft(templateId) {
    if (ptDraftCache.has(templateId)) {
      return ptDraftCache.get(templateId);
    }

    const linkedPtCaseId = ensureLinkedPtCaseId();
    const template = getPilotTemplate(templateId);
    const draftKey = getPilotTemplateDraftKey(templateId, linkedPtCaseId);
    let draftData = draftKey ? loadJsonFromStorage(draftKey) : null;

    if (!draftData) {
      const rawPatientMeta = loadJsonFromStorage(`patient_${linkedPtCaseId}`);
      const patientMeta = rawPatientMeta || buildPilotPtPatientMeta(caseObj, patientName);
      draftData = buildPilotPtDraft(patientMeta, templateId);
    }

    draftData.meta = {
      ...(draftData.meta || {}),
      caseId: linkedPtCaseId,
      encounterId: resolvePtEncounterId(template, templateId),
      sourceCaseId: caseId,
    };

    if (draftKey && !loadJsonFromStorage(draftKey)) {
      saveJsonToStorage(draftKey, draftData, 'PT draft');
    }

    ptDraftCache.set(templateId, draftData);
    return draftData;
  }

  function pilotTemplateHasDraft(templateId) {
    if (templateId === 'dietetics-ncp') {
      return !!dietDraft;
    }

    if (ptDraftCache.has(templateId)) return true;
    const linkedPtCaseId = caseObj?.meta?.[pilotMetaKey]?.ptPatientId;
    if (!linkedPtCaseId) return false;
    const draftKey = getPilotTemplateDraftKey(templateId, linkedPtCaseId);
    return draftKey ? !!loadJsonFromStorage(draftKey) : false;
  }

  function getActiveNoteContext() {
    if (selectedProfession === 'dietetics') {
      return {
        caseId,
        draft: dietDraft,
        encounter: 'nutrition',
        professionId: 'dietetics',
        templateId: 'dietetics-ncp',
      };
    }

    const template = getPilotTemplate(selectedTemplateId);
    return {
      caseId: ensureLinkedPtCaseId(),
      draft: ensurePilotPtDraft(selectedTemplateId),
      encounter: resolvePtEncounterId(template, selectedTemplateId) || 'eval',
      hostCaseId: caseId,
      professionId: 'pt',
      templateId: selectedTemplateId,
    };
  }

  function persistActiveDraftContext() {
    const context = getActiveNoteContext();
    if (context.professionId === 'dietetics') {
      saveDietDraft(context.draft);
      return context;
    }
    savePtDraft(context.templateId, context.draft);
    return context;
  }

  function syncGlobals(refreshChartProgress) {
    const context = getActiveNoteContext();
    syncActiveNoteSession({
      draft: context.draft,
      context: {
        caseId: context.caseId,
        encounter: context.encounter,
        hostCaseId: context.hostCaseId || caseId,
        isFacultyMode,
        professionId: context.professionId,
        templateId: context.templateId,
      },
      saveDraft: () => persistActiveDraftContext(),
      refreshChartProgress,
      noteStatus: deriveNoteStatus(context.draft),
    });
    return context;
  }

  function handleDieteticsDraftChange(nextDraft, refreshChartProgress) {
    dietDraft = nextDraft;
    syncGlobals(refreshChartProgress);
    persistActiveDraftContext();
  }

  function handlePtDraftChange(templateId, nextDraft, refreshChartProgress) {
    ptDraftCache.set(templateId, nextDraft);
    if (selectedProfession === 'pt' && selectedTemplateId === templateId) {
      syncGlobals(refreshChartProgress);
    }
    savePtDraft(templateId, nextDraft);
  }

  function launchTemplate(templateId = selectedTemplateId) {
    if (templateId === 'dietetics-ncp') {
      selectedProfession = 'dietetics';
    }
    selectedTemplateId = sanitizeTemplateSelection(selectedProfession, templateId);
    if (selectedProfession === 'pt') {
      ensurePilotPtDraft(selectedTemplateId);
      persistSelection({ ptPatientId: ensureLinkedPtCaseId() });
      return getActiveNoteContext();
    }
    persistSelection();
    return getActiveNoteContext();
  }

  return {
    ensureLinkedPtCaseId,
    ensurePilotPtDraft,
    getActiveNoteContext,
    getDietDraft,
    getSelectedProfession,
    getSelectedTemplateId,
    handleDieteticsDraftChange,
    handlePtDraftChange,
    launchTemplate,
    persistActiveDraftContext,
    pilotTemplateHasDraft,
    setSelectedProfession,
    setSelectedTemplateId,
    syncGlobals,
    updateDietDraft,
  };
}
