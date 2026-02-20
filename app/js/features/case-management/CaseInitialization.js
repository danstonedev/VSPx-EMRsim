// CaseInitialization.js - Case Setup & Data Management Module
// Handles case loading, draft initialization, storage seam management, and error handling

// Use dynamic import for store access to avoid static bundling
async function _getCase(caseId) {
  const { getCase } = await import('../../core/store.js');
  return getCase(caseId);
}
import { storage } from '../../core/index.js';
import { el } from '../../ui/utils.js';
import { showToast } from '../../ui/toast.js';
import { mapFrequencyToEnum, mapDurationToEnum } from '../../services/case-generator.js';
import { IS_LOCAL_DEV } from '../../core/constants.js';

// Extracted micro-helpers (pure, no side effects) to reduce complexity in populateDraftFromCaseData
function _mergeArrayToCsv(target, arr) {
  if (Array.isArray(arr)) return arr.join(', ');
  return target || '';
}

function _mergeEvalSubjective(draft, evalSubj, normalizers) {
  if (!evalSubj) return;
  const { normalizePainQuality, normalizePainPattern } = normalizers;
  const directFields = [
    'chiefComplaint',
    'historyOfPresentIllness',
    'patientGoals',
    'redFlags',
    'painLocation',
    'aggravatingFactors',
    'easingFactors',
    'functionalLimitations',
    'priorLevel',
    'medicationsCurrent',
    'additionalHistory',
  ];
  for (const f of directFields) {
    if (evalSubj[f]) draft.subjective[f] = evalSubj[f];
  }
  if (evalSubj.painScale !== undefined) draft.subjective.painScale = String(evalSubj.painScale);
  if (evalSubj.painQuality) {
    const v = normalizePainQuality(evalSubj.painQuality);
    draft.subjective.painQuality = v || draft.subjective.painQuality;
  }
  if (evalSubj.painPattern) {
    const v = normalizePainPattern(evalSubj.painPattern);
    draft.subjective.painPattern = v || draft.subjective.painPattern;
  }
}

function _applyVitalsToNarrative(draft, vitals) {
  if (!vitals || draft.objective.text) return;
  const v = vitals;
  const parts = [];
  if (v.bp) parts.push(`BP ${v.bp}`);
  if (v.hr) parts.push(`HR ${v.hr}`);
  if (v.rr) parts.push(`RR ${v.rr}`);
  if (v.temp) parts.push(`Temp ${v.temp}`);
  if (v.o2sat) parts.push(`SpO2 ${v.o2sat}`);
  if (v.pain) parts.push(`Pain ${v.pain}`);
  if (parts.length) draft.objective.text = `Vitals: ${parts.join(', ')}`;
}

function _mergeAssessment(draft, evalAssess) {
  if (!evalAssess) return;
  const fields = [
    'primaryImpairments',
    'bodyFunctions',
    'activityLimitations',
    'participationRestrictions',
    'ptDiagnosis',
    'prognosticFactors',
    'clinicalReasoning',
  ];
  const next = { ...draft.assessment };
  for (const f of fields) next[f] = evalAssess[f] || draft.assessment[f] || '';
  draft.assessment = next;
}

// Normalizers promoted to module scope to reduce complexity in populateDraftFromCaseData
function normalizePainQuality(val) {
  if (!val) return '';
  const s = String(val).toLowerCase();
  const map = [
    { k: 'sharp-stabbing', m: /sharp|stab/ },
    { k: 'dull-aching', m: /dull|ache/ },
    { k: 'burning', m: /burn/ },
    { k: 'throbbing-pulsing', m: /throb|puls/ },
    { k: 'cramping', m: /cramp/ },
    { k: 'tingling-pins-needles', m: /tingl|pins|paresthe/ },
    { k: 'numbness', m: /numb/ },
    { k: 'stiffness', m: /stiff/ },
  ];
  const hit = map.find((x) => x.m.test(s));
  return hit ? hit.k : '';
}

function normalizePainPattern(val) {
  if (!val) return '';
  const s = String(val).toLowerCase();
  const RULES = [
    { out: 'constant', test: (t) => t.includes('constant') },
    { out: 'intermittent', test: (t) => t.includes('intermittent') },
    { out: 'morning-stiffness', test: (t) => t.includes('morning') },
    {
      out: 'end-of-day',
      test: (t) => t.includes('end of day') || t.includes('worsens') || t.includes('evening'),
    },
    {
      out: 'activity-related',
      test: (t) => t.includes('activity') || t.includes('exercise') || t.includes('overhead'),
    },
    {
      out: 'positional',
      test: (t) => t.includes('position') || t.includes('lying') || t.includes('sleep'),
    },
    {
      out: 'weather-related',
      test: (t) => t.includes('weather') || t.includes('cold') || t.includes('rain'),
    },
  ];
  for (const r of RULES) {
    if (r.test(s)) return r.out;
  }
  return '';
}

function normalizeMmtGrade(val) {
  if (!val && val !== 0) return '';
  const s = String(val).trim();
  if (s.includes('/5')) return s; // already standardized
  const base = s.replace(/[^0-9+\-]/g, '');
  const to = (n) => `${n}/5`;
  const RULES = [
    { re: /^0$/, out: to(0) },
    { re: /^1$/, out: to(1) },
    { re: /^2$/, out: to(2) },
    { re: /^3\+$/, out: '4-/5' },
    { re: /^3-?$/, out: to(3) },
    { re: /^4\+$/, out: '4+/5' },
    { re: /^4-?$/, out: '4/5' },
    { re: /^4-$/, out: '4-/5' },
    { re: /^5-$/, out: '4+/5' },
    { re: /^5$/, out: to(5) },
  ];
  for (const r of RULES) {
    if (r.re.test(base)) return r.out;
  }
  return s;
}

// Transform PROM data like { 'flexion-right': '155' } into UI table rows
function buildPromTableData(promObj = {}, selectedRegions = []) {
  const out = {};
  const shoulderMap = [
    { key: 'flexion', rowId: 'shoulder-flexion' },
    { key: 'extension', rowId: 'shoulder-extension' },
    { key: 'abduction', rowId: 'shoulder-abduction' },
    { key: 'er', rowId: 'external-rotation' },
    { key: 'ir', rowId: 'internal-rotation' },
  ];
  const doAssign = (rowId, side, val) => {
    if (!val) return;
    out[rowId] = out[rowId] || { left: '', right: '', notes: '' };
    out[rowId][side] = String(val);
  };
  const isShoulder = (selectedRegions || []).includes('shoulder');
  if (isShoulder) {
    Object.entries(promObj).forEach(([k, v]) => {
      const lower = k.toLowerCase();
      const side = lower.includes('left') ? 'left' : lower.includes('right') ? 'right' : '';
      const mapHit = shoulderMap.find((m) => lower.startsWith(m.key));
      if (mapHit && side) doAssign(mapHit.rowId, side, v);
    });
  }
  return out;
}

// Subjective: merge history section into draft
function mergeSubjectiveFromHistory(draft, history) {
  if (!history) return;
  setSubjectiveBasicsFromHistory(draft, history);
  mergeSubjectiveListsFromHistory(draft, history);
  if (history.pain) mergeSubjectivePainFromHistory(draft, history.pain);
}

function setSubjectiveBasicsFromHistory(draft, history) {
  draft.subjective.chiefComplaint =
    history.chief_complaint || draft.subjective.chiefComplaint || '';
  draft.subjective.historyOfPresentIllness =
    history.hpi || draft.subjective.historyOfPresentIllness || '';
}

function mergeSubjectiveListsFromHistory(draft, history) {
  if (Array.isArray(history.pmh))
    draft.subjective.pastMedicalHistory = _mergeArrayToCsv(
      draft.subjective.pastMedicalHistory,
      history.pmh,
    );
  if (Array.isArray(history.meds))
    draft.subjective.medicationsCurrent = _mergeArrayToCsv(
      draft.subjective.medicationsCurrent,
      history.meds,
    );
  if (Array.isArray(history.red_flag_signals))
    draft.subjective.redFlags = _mergeArrayToCsv(
      draft.subjective.redFlags,
      history.red_flag_signals,
    );
  if (Array.isArray(history.functional_goals)) {
    const goals = history.functional_goals.join('; ');
    if (!draft.subjective.patientGoals) draft.subjective.patientGoals = goals;
  }
}

function mergeSubjectivePainFromHistory(draft, pain) {
  const p = pain;
  setPainScaleAndLocation(draft, p);
  setPainQualityAndPattern(draft, p);
  setPainModifiers(draft, p);
}

function setPainScaleAndLocation(draft, p) {
  draft.subjective.painScale = p.level || draft.subjective.painScale || '';
  draft.subjective.painLocation = p.location || draft.subjective.painLocation || '';
}

function setPainQualityAndPattern(draft, p) {
  const pq = normalizePainQuality(p.quality);
  draft.subjective.painQuality = pq || draft.subjective.painQuality || '';
  const pp = normalizePainPattern(p.pattern || p.duration || '');
  draft.subjective.painPattern = pp || draft.subjective.painPattern || '';
}

function setPainModifiers(draft, p) {
  draft.subjective.aggravatingFactors =
    p.aggravating_factors || draft.subjective.aggravatingFactors || '';
  draft.subjective.easingFactors = p.easing_factors || draft.subjective.easingFactors || '';
}

// Ensure regional assessments structure exists and optionally preselect regions from meta
function ensureRegionalAssessments(draft) {
  draft.objective.regionalAssessments = draft.objective.regionalAssessments || {
    selectedRegions: [],
    rom: {},
    prom: {},
    promExcluded: [],
    mmt: {},
    specialTests: {},
  };
  return draft.objective.regionalAssessments;
}

function preselectRegionsFromMeta(draft, meta) {
  const regions = meta && Array.isArray(meta.regions) ? meta.regions : [];
  if (regions.length) {
    const existing = new Set(draft.objective.regionalAssessments.selectedRegions || []);
    regions.forEach((r) => existing.add(r));
    draft.objective.regionalAssessments.selectedRegions = Array.from(existing);
  }
}

function normalizeRegionalAssessments(ra) {
  if (ra && ra.mmt && typeof ra.mmt === 'object') {
    Object.keys(ra.mmt).forEach((k) => {
      ra.mmt[k] = normalizeMmtGrade(ra.mmt[k]);
    });
  }
  if (ra && ra.prom && typeof ra.prom === 'object') {
    if (!Array.isArray(ra.prom)) {
      const selected = Array.isArray(ra.selectedRegions) ? ra.selectedRegions : [];
      ra.prom = buildPromTableData(ra.prom, selected);
    }
  }
}

// Objective: merge findings section into draft (and vitals narrative)
function mergeObjectiveFromFindings(draft, findings, meta) {
  if (!findings) return;
  if (findings.rom) draft.objective.rom = findings.rom;
  if (findings.mmt) draft.objective.mmt = findings.mmt;
  if (findings.special_tests) {
    ensureRegionalAssessments(draft);
    preselectRegionsFromMeta(draft, meta || {});
  }
  _applyVitalsToNarrative(draft, findings.vitals);
}

// Objective: merge eval objective section
function mergeEvalObjective(draft, evalObj) {
  if (!evalObj) return;
  if (evalObj.text) draft.objective.text = evalObj.text;
  if (evalObj.regionalAssessments) {
    draft.objective.regionalAssessments = {
      ...draft.objective.regionalAssessments,
      ...evalObj.regionalAssessments,
    };
    try {
      normalizeRegionalAssessments(draft.objective.regionalAssessments);
    } catch (err) {
      console.warn('[CaseInit] normalizeRegionalAssessments failed:', err);
    }
  }
  setObjectiveNarrativesFromEval(draft, evalObj);
}

function setObjectiveNarrativesFromEval(draft, evalObj) {
  if (evalObj.inspection?.visual)
    draft.objective.inspection = { visual: evalObj.inspection.visual };
  if (evalObj.palpation?.findings)
    draft.objective.palpation = { findings: evalObj.palpation.findings };
  if (evalObj.neuro?.screening) draft.objective.neuro = { screening: evalObj.neuro.screening };
  if (evalObj.functional?.assessment)
    draft.objective.functional = { assessment: evalObj.functional.assessment };
}

// Objective: seed Treatment Performed subsection from Plan text/details
function seedTreatmentPerformedFromPlan(draft, evalPlan) {
  try {
    const tp = ensureTreatmentPerformedContainer(draft);
    if (!tp.patientEducation && evalPlan?.patientEducation)
      tp.patientEducation = evalPlan.patientEducation;
    const tplan = evalPlan?.treatmentPlan || '';
    if (!tplan) return;
    fillTreatmentPerformedFromPlanText(tp, tplan);
  } catch (err) {
    console.warn('[CaseInit] seedTreatmentPerformedFromPlan failed:', err);
  }
}

function ensureTreatmentPerformedContainer(draft) {
  return (draft.objective.treatmentPerformed = draft.objective.treatmentPerformed || {
    patientEducation: '',
    modalities: '',
    therapeuticExercise: '',
    manualTherapy: '',
  });
}

function fillTreatmentPerformedFromPlanText(tp, tplan) {
  const extractParen = (label) => {
    const re = new RegExp(label + '\\s*\\(([^)]*)\\)', 'i');
    const m = tplan.match(re);
    return m ? m[1].trim() : '';
  };
  if (!tp.manualTherapy) {
    const mt = extractParen('Manual therapy');
    if (mt) tp.manualTherapy = mt;
    else if (/manual/i.test(tplan))
      tp.manualTherapy = 'Manual therapy techniques as outlined in plan.';
  }
  if (!tp.therapeuticExercise) {
    const te = extractParen('therapeutic exercise');
    if (te) tp.therapeuticExercise = te;
    else if (/therapeutic exercise/i.test(tplan))
      tp.therapeuticExercise = 'Therapeutic exercise per plan.';
  }
  if (!tp.modalities) {
    const mod =
      extractParen('symptom modulation') ||
      (/(taping|ice|heat|ultrasound|estim|e\s*-\s*stim|modalit)/i.test(tplan)
        ? 'Symptom modulation (e.g., taping/ice/heat) as indicated.'
        : '');
    if (mod) tp.modalities = mod;
  }
}

// Plan: merge eval plan and normalize enums
function mergePlanFromEval(draft, evalPlan) {
  if (!evalPlan) return;
  setPlanBasicsFromEval(draft, evalPlan);
  setPlanTablesFromEval(draft, evalPlan);
  seedGoalsTableFromText(draft, evalPlan.shortTermGoals, evalPlan.longTermGoals);
  decideAndSetTreatmentPlanText(draft, evalPlan);
}

function setPlanBasicsFromEval(draft, evalPlan) {
  draft.plan = {
    ...draft.plan,
    frequency: mapFrequencyToEnum(evalPlan.frequency || draft.plan.frequency || ''),
    duration: mapDurationToEnum(evalPlan.duration || draft.plan.duration || ''),
    shortTermGoals: evalPlan.shortTermGoals || draft.plan.shortTermGoals || '',
    longTermGoals: evalPlan.longTermGoals || draft.plan.longTermGoals || '',
  };
  if (evalPlan.patientEducation) draft.plan.patientEducation = evalPlan.patientEducation;
}

function decideAndSetTreatmentPlanText(draft, evalPlan) {
  if (typeof evalPlan.treatmentPlan === 'string' && evalPlan.treatmentPlan.trim()) {
    draft.plan.treatmentPlan = evalPlan.treatmentPlan;
    return;
  }
  if (Array.isArray(evalPlan.interventions) && evalPlan.interventions.length) {
    draft.plan.treatmentPlan = `Interventions: ${evalPlan.interventions.join(', ')}`;
  }
}

function setPlanTablesFromEval(draft, evalPlan) {
  if (evalPlan.exerciseTable && typeof evalPlan.exerciseTable === 'object') {
    draft.plan.exerciseTable = evalPlan.exerciseTable;
  }
  if (evalPlan.goalsTable && typeof evalPlan.goalsTable === 'object') {
    draft.plan.goalsTable = evalPlan.goalsTable;
  }
}

// Plan: create simple goals table from STG/LTG if not present
function seedGoalsTableFromText(draft, stgRaw, ltgRaw) {
  try {
    const stg = (stgRaw || '').toString().trim();
    const ltg = (ltgRaw || '').toString().trim();
    const hasGoalsTable = draft.plan.goalsTable && Object.keys(draft.plan.goalsTable).length > 0;
    if (!hasGoalsTable && (stg || ltg)) {
      const tbl = {};
      const add = (text) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        tbl[id] = { goalText: text };
      };
      if (stg) add(stg);
      if (ltg) add(ltg);
      draft.plan.goalsTable = tbl;
    }
  } catch (err) {
    console.warn('[CaseInit] mergePlanFromEval goals failed:', err);
  }
}

// Billing: merge eval billing
function mergeBillingFromEval(draft, evalBilling) {
  if (!evalBilling) return;
  draft.billing = {
    ...draft.billing,
    diagnosisCodes: Array.isArray(evalBilling.diagnosisCodes)
      ? evalBilling.diagnosisCodes
      : draft.billing.diagnosisCodes,
    billingCodes: Array.isArray(evalBilling.billingCodes)
      ? evalBilling.billingCodes
      : draft.billing.billingCodes,
    ordersReferrals: Array.isArray(evalBilling.ordersReferrals)
      ? evalBilling.ordersReferrals
      : draft.billing.ordersReferrals || [],
  };
}

// Meta & Snapshot helpers
function applyMetaAndSnapshot(draft, caseData) {
  const title = getCaseTitle(caseData);
  const age = getCaseAge(caseData);
  const sex = getCaseSex(caseData);
  setNoteTitleFromMeta(draft, title);
  maybeSeedHpiFromSnapshot(draft, { age, sex, title, generated: isCaseGenerated(caseData) });
}

function getCaseTitle(caseData) {
  return caseData?.meta?.title || caseData?.title;
}

function getCaseAge(caseData) {
  return caseData?.snapshot?.age;
}

function getCaseSex(caseData) {
  return caseData?.snapshot?.sex;
}

function isCaseGenerated(caseData) {
  return caseData?.meta?.generated === true || caseData?.generated === true;
}

function setNoteTitleFromMeta(draft, title) {
  if (title && !draft.noteTitle) draft.noteTitle = title;
}

function maybeSeedHpiFromSnapshot(draft, { age, sex, title, generated }) {
  if (!generated) return;
  if (draft.subjective.historyOfPresentIllness) return;
  if (!age && !sex) return;
  if (!title) return;
  const sx = sex ? sex[0].toUpperCase() + sex.slice(1) : '';
  draft.subjective.historyOfPresentIllness = `${age ? age + '-year-old ' : ''}${sx ? sx + ' ' : ''}presenting with ${title.toLowerCase()}.`;
}

function applyPrognosisFromAssessment(draft, evalAssess) {
  const prognosisRaw = evalAssess?.prognosis || evalAssess?.prognosticFactors || '';
  if (!prognosisRaw) return;
  const key = detectPrognosisKey(String(prognosisRaw).toLowerCase());
  if (!key) return;
  draft.assessment = {
    ...(draft.assessment || {}),
    prognosis: key,
    prognosticFactors: draft.assessment.prognosticFactors || '',
  };
  if (evalAssess?.prognosticFactors && evalAssess.prognosticFactors.toLowerCase() === key) {
    draft.assessment.prognosticFactors = '';
  }
}

function detectPrognosisKey(p) {
  const KEYS = ['excellent', 'good', 'fair', 'poor', 'guarded'];
  return KEYS.find((k) => p.includes(k));
}

/**
 * Creates a blank case template for new case creation
 * @returns {Object} Blank case structure
 */
function createBlankCaseTemplate() {
  return {
    meta: {
      title: '',
      setting: 'Outpatient',
      regions: [],
      acuity: 'acute',
      diagnosis: 'Musculoskeletal',
    },
    snapshot: {
      age: '',
      sex: 'unspecified',
      teaser: '',
    },
    history: {
      chief_complaint: '',
      hpi: '',
      pmh: [],
      meds: [],
      red_flag_signals: [],
    },
    findings: {
      vitals: { bp: '', hr: '', rr: '', temp: '', o2sat: '', pain: '' },
      rom: {},
      mmt: {},
      special_tests: [],
      gait: { device: 'none', distance_m: 0 },
      outcome_options: [],
    },
    encounters: {
      eval: { notes_seed: '' },
      daily: [],
      progress: null,
      discharge: null,
    },
  };
}

/**
 * Creates default draft structure with enhanced subjective fields
 * @returns {Object} Default draft structure
 */
function createDefaultDraft() {
  return {
    // Student-owned metadata for untethered notes
    noteTitle: '',
    subjective: {
      chiefComplaint: '',
      historyOfPresentIllness: '',
      painLocation: '',
      painScale: '',
      painQuality: '',
      painPattern: '',
      aggravatingFactors: '',
      easingFactors: '',
      functionalLimitations: '',
      priorLevel: '',
      patientGoals: '',
      medicationsCurrent: '',
      redFlags: '',
      additionalHistory: '',
    },
    objective: {
      text: '',
      inspection: { visual: '' },
      palpation: { findings: '' },
      neuro: { screening: '' },
      functional: { assessment: '' },
      regionalAssessments: {
        selectedRegions: [],
        rom: {},
        prom: {},
        promExcluded: [],
        mmt: {},
        specialTests: {},
      },
      rom: {},
      mmt: {},
    },
    assessment: {
      primaryImpairments: '',
      bodyFunctions: '',
      activityLimitations: '',
      participationRestrictions: '',
      ptDiagnosis: '',
      prognosticFactors: '',
      clinicalReasoning: '',
    },
    goals: '',
    plan: {
      // Enhanced plan object structure
      interventions: [], // Array for intervention row cards
      frequency: '',
      duration: '',
      shortTermGoals: '',
      longTermGoals: '',
      patientEducation: '',
    },
    billing: {
      diagnosisCodes: [{ code: '', description: '', isPrimary: true }],
      billingCodes: [{ code: '', units: '', timeSpent: '' }],
      ordersReferrals: [{ type: '', details: '' }],
      skilledJustification: '',
      treatmentNotes: '',
    },
    // Instructor editor settings are stored on the case object; draft uses this only in faculty mode
    editorSettings: {
      visibility: {
        subjective: {
          hpi: true,
          'pain-assessment': true,
          'functional-status': true,
          'additional-history': true,
        },
        objective: {
          'general-observations': true,
          inspection: true,
          palpation: true,
          'regional-assessment': true,
          'neurological-screening': true,
          'functional-movement': true,
        },
        assessment: {
          'primary-impairments': true,
          'icf-classification': true,
          'pt-diagnosis': true,
          'clinical-reasoning': true,
        },
        plan: {
          'treatment-plan': true,
          'goal-setting': true,
        },
        billing: {
          'diagnosis-codes': true,
          'cpt-codes': true,
          'orders-referrals': true,
        },
      },
    },
  };
}

/**
 * Populates draft from case data for faculty editing (answer key mode)
 * @param {Object} draft - The draft object to populate
 * @param {Object} caseData - The case data to load from
 * @returns {Object} Populated draft
 */
function populateDraftFromCaseData(draft, caseData) {
  // This function converts case data structure to draft structure
  // Faculty members edit the "answer key" by populating the draft with case data

  populateSubjectiveSection(draft, caseData);
  populateObjectiveSection(draft, caseData);
  const evalAssess = populateAssessmentSection(draft, caseData);
  populatePlanSection(draft, caseData);
  populateBillingSection(draft, caseData);
  populateMetaAndPrognosis(draft, caseData, evalAssess);

  // For now, return the original draft - this can be expanded as needed
  return draft;
}

function populateSubjectiveSection(draft, caseData) {
  mergeSubjectiveFromHistory(draft, caseData.history);
  const evalSubj = caseData?.encounters?.eval?.subjective || {};
  _mergeEvalSubjective(draft, evalSubj, { normalizePainQuality, normalizePainPattern });
}

function populateObjectiveSection(draft, caseData) {
  mergeObjectiveFromFindings(draft, caseData.findings, caseData.meta);
  const evalObj = caseData?.encounters?.eval?.objective || {};
  mergeEvalObjective(draft, evalObj);
  const evalPlan = caseData?.encounters?.eval?.plan || {};
  seedTreatmentPerformedFromPlan(draft, evalPlan);
}

function populateAssessmentSection(draft, caseData) {
  const evalAssess = caseData?.encounters?.eval?.assessment || {};
  _mergeAssessment(draft, evalAssess);
  return evalAssess;
}

function populatePlanSection(draft, caseData) {
  const evalPlan = caseData?.encounters?.eval?.plan || {};
  mergePlanFromEval(draft, evalPlan);
}

function populateBillingSection(draft, caseData) {
  const evalBilling = caseData?.encounters?.eval?.billing || {};
  mergeBillingFromEval(draft, evalBilling);
}

function populateMetaAndPrognosis(draft, caseData, evalAssess) {
  applyMetaAndSnapshot(draft, caseData);
  applyPrognosisFromAssessment(draft, evalAssess || caseData?.encounters?.eval?.assessment || {});
}

/**
 * Loads and initializes case data with proper error handling
 * @param {string} caseId - Case ID to load
 * @param {boolean} isFacultyMode - Whether in faculty mode
 * @param {boolean} isKeyMode - Whether in key mode
 * @returns {Promise<Object>} Case wrapper object or error state
 */
export async function initializeCase(caseId, isFacultyMode = false, isKeyMode = false) {
  try {
    if (caseId === 'new') return handleNewCaseRequest(isFacultyMode, isKeyMode);
    if (isBlankCaseId(caseId)) return handleBlankCaseRequest(caseId, isFacultyMode);
    return await loadExistingCaseWrapper(caseId);
  } catch (error) {
    console.error('Failed to load case:', error);
    return {
      error: true,
      title: 'Error loading case',
      message: `Failed to load case ${caseId}: ${error.message}`,
      details: 'Please check the console for details.',
    };
  }
}

function handleNewCaseRequest(isFacultyMode, isKeyMode) {
  if (!isFacultyMode || isKeyMode) {
    return {
      error: true,
      title: isKeyMode ? 'Key View Not Available' : 'Access Denied',
      message: isKeyMode
        ? 'Answer Key view is only available for existing cases.'
        : 'Creating new cases is only available to faculty.',
    };
  }
  const caseObj = createBlankCaseTemplate();
  return { id: 'new', caseObj, latestVersion: 0 };
}

function isBlankCaseId(caseId) {
  return caseId === 'blank' || (typeof caseId === 'string' && caseId.startsWith('blank'));
}

function handleBlankCaseRequest(caseId, isFacultyMode) {
  if (isFacultyMode) {
    return {
      error: true,
      title: 'Not Available',
      message: 'Blank SOAP notes are only available in student mode.',
    };
  }
  const placeholder = {
    title: 'Blank SOAP Note',
    meta: {
      title: 'Blank SOAP Note',
      setting: 'Outpatient',
      diagnosis: 'N/A',
      acuity: 'unspecified',
    },
    snapshot: { age: '', sex: 'unspecified' },
    editorSettings: undefined,
  };
  return { id: caseId, caseObj: placeholder, latestVersion: 0 };
}

async function loadExistingCaseWrapper(caseId) {
  const caseWrapper = await _getCase(caseId);
  if (!caseWrapper) {
    return {
      error: true,
      title: 'Case not found',
      message: `Could not find case with ID: ${caseId}`,
    };
  }
  return caseWrapper;
}

/**
 * Initializes draft data with proper handling for faculty vs student modes
 * @param {string} caseId - Case identifier
 * @param {string} encounter - Encounter type
 * @param {boolean} isFacultyMode - Whether in faculty mode
 * @param {Object} caseData - The case data object
 * @param {boolean} isKeyMode - Whether in answer key mode
 * @returns {Object} Draft data and management functions
 */
export function initializeDraft(
  caseId,
  encounter,
  isFacultyMode = false,
  caseData = null,
  isKeyMode = false,
) {
  let draft = createDefaultDraft();

  draft = initDraftByMode({ draft, isFacultyMode, isKeyMode, caseData, caseId });

  // Development mode: Skip local draft loading for NEW cases only to prevent cached data issues
  const isNewCase = caseId === 'new';
  const skipLoading = isKeyMode || (IS_LOCAL_DEV && isNewCase);

  if (skipLoading) {
  } else {
    // Storage key for this specific case
    const localStorageKey = `draft_${caseId}_${encounter}`;
    // Try to load existing draft from storage
    tryLoadDraftFromStorage(localStorageKey, draft, isFacultyMode);
  }

  // Track the current case ID (mutable for new case creation)
  let currentCaseId = caseId;

  // Storage key for saving (used by save function)
  const localStorageKey = `draft_${caseId}_${encounter}`;

  // Track last saved state for dirty checking
  let lastSavedState = JSON.stringify(draft);

  // Save function - behavior depends on faculty mode
  const save = async (isKeyMode = false) => {
    if (isKeyMode) return; // read-only view
    if (isFacultyMode && caseData) {
      await facultySaveFlow({
        draft,
        caseData,
        encounter,
        getCurrentCaseId: () => currentCaseId,
        setCurrentCaseId: (id) => (currentCaseId = id),
        localStorageKey,
      });
      lastSavedState = JSON.stringify(draft);
    } else {
      await studentSaveFlow(draft, localStorageKey);
      lastSavedState = JSON.stringify(draft);
    }
  };

  // Check for unsaved changes
  const hasUnsavedChanges = () => {
    return JSON.stringify(draft) !== lastSavedState;
  };

  // Clear draft and storage
  const resetDraft = () => {
    if (confirm('Are you sure you want to clear all your work? This cannot be undone.')) {
      draft = createDefaultDraft();
      storage.removeItem(localStorageKey);
      lastSavedState = JSON.stringify(draft);

      return true; // Indicates reset occurred
    }
    return false; // Reset cancelled
  };

  return {
    draft,
    save,
    resetDraft,
    hasUnsavedChanges,
    localStorageKey,
  };
}

function initDraftByMode({ draft, isFacultyMode, isKeyMode, caseData, caseId }) {
  if (isFacultyMode || isKeyMode) {
    if (caseData && caseId !== 'new') {
      draft = populateDraftFromCaseData(draft, caseData);
      if (caseData.editorSettings && !isKeyMode) draft.editorSettings = caseData.editorSettings;
    }
    return draft;
  }
  delete draft.editorSettings; // student mode
  return draft;
}

// Faculty save flow
async function facultySaveFlow({
  draft,
  caseData,
  encounter,
  getCurrentCaseId,
  setCurrentCaseId,
  localStorageKey,
}) {
  try {
    showToast('Saving case...', { timeoutMs: 1000 });
    attachDraftToCaseObject(caseData, encounter, draft);
    if (draft.editorSettings) caseData.editorSettings = draft.editorSettings;

    if (getCurrentCaseId() === 'new') {
      const newCaseId = await persistNewCase(caseData);
      setCurrentCaseId(newCaseId);
      migrateDraftKey(localStorageKey, `draft_${newCaseId}_${encounter}`);
      updateUrlForNewCase(newCaseId, encounter);
    } else {
      await persistExistingCase(getCurrentCaseId(), caseData);
    }
    persistDraftToStorage(localStorageKey, draft);
    showToast('✅ Case saved to cloud', { timeoutMs: 2000 });
  } catch (error) {
    console.error('❌ Failed to save case content:', error);
    persistDraftToStorage(localStorageKey, draft); // fallback to storage only
    showToast('⚠️ Saved locally only (Cloud sync failed)', { timeoutMs: 4000 });
  }
}

async function studentSaveFlow(draft, localStorageKey) {
  try {
    draft.__savedAt = Date.now();
    persistDraftToStorage(localStorageKey, draft);
  } catch (error) {
    console.warn('Could not save draft to storage:', error);
  }
}

function attachDraftToCaseObject(caseData, encounter, draft) {
  caseData.meta = caseData.meta || {};
  caseData.encounters = caseData.encounters || {};
  caseData.encounters[encounter] = caseData.encounters[encounter] || {};
  if (draft.subjective) caseData.encounters[encounter].subjective = draft.subjective;
  if (draft.objective) caseData.encounters[encounter].objective = draft.objective;
  if (draft.assessment) caseData.encounters[encounter].assessment = draft.assessment;
  if (draft.plan) caseData.encounters[encounter].plan = draft.plan;
  if (draft.billing) caseData.encounters[encounter].billing = draft.billing;
}

async function persistExistingCase(caseId, caseData) {
  const { updateCase } = await import('../../core/store.js');
  await updateCase(caseId, caseData);
}

async function persistNewCase(caseData) {
  const { createCase } = await import('../../core/store.js');
  const newCase = await createCase(caseData);
  return newCase.id;
}

function migrateDraftKey(oldKey, newKey) {
  try {
    const prev = storage.getItem(oldKey);
    if (prev) storage.setItem(newKey, prev);
    if (prev) storage.removeItem(oldKey);
  } catch (err) {
    console.warn('[CaseInit] migrateDraftKey failed:', err);
  }
}

function updateUrlForNewCase(newCaseId, encounter) {
  try {
    window.history.replaceState(
      {},
      '',
      `#/instructor/editor?case=${newCaseId}&encounter=${encodeURIComponent(encounter)}`,
    );
  } catch (err) {
    console.warn('[CaseInit] updateUrlForNewCase failed:', err);
  }
}

function persistDraftToStorage(localStorageKey, draft) {
  try {
    storage.setItem(localStorageKey, JSON.stringify(draft));
  } catch (err) {
    console.warn('[CaseInit] persistDraftToStorage failed:', err);
  }
}

// Helper: load and merge existing draft from storage
function tryLoadDraftFromStorage(localStorageKey, draft, isFacultyMode) {
  try {
    const savedDraft = storage.getItem(localStorageKey);
    if (!savedDraft) return;
    const parsed = JSON.parse(savedDraft);
    mergeParsedSubjective(parsed, draft);
    mergeParsedObjective(parsed, draft);
    mergeParsedRest(parsed, draft, isFacultyMode);
  } catch (error) {
    console.warn('Could not load draft from storage:', error);
  }
}

function mergeParsedSubjective(parsed, draft) {
  if (typeof parsed.subjective === 'string') {
    draft.subjective.additionalHistory = parsed.subjective;
  } else if (parsed.subjective && typeof parsed.subjective === 'object') {
    draft.subjective = { ...draft.subjective, ...parsed.subjective };
  }
}

function mergeParsedObjective(parsed, draft) {
  if (!parsed.objective) return;
  draft.objective = {
    ...draft.objective,
    ...parsed.objective,
    inspection: parsed.objective.inspection || { visual: '' },
    palpation: parsed.objective.palpation || { findings: '' },
    neuro: parsed.objective.neuro || { screening: '' },
    functional: parsed.objective.functional || { assessment: '' },
    regionalAssessments: normalizeParsedRegionalAssessments(parsed.objective.regionalAssessments),
  };
}

function normalizeParsedRegionalAssessments(ra) {
  if (ra) return ra;
  return { selectedRegions: [], rom: {}, prom: {}, promExcluded: [], mmt: {}, specialTests: {} };
}

function mergeParsedRest(parsed, draft, isFacultyMode) {
  if (parsed.noteTitle) draft.noteTitle = parsed.noteTitle;
  if (parsed.assessment) draft.assessment = parsed.assessment;
  if (parsed.goals) draft.goals = parsed.goals;
  if (parsed.plan) draft.plan = { ...draft.plan, ...parsed.plan };
  if (!isFacultyMode) {
    if (parsed.editorSettings) {
    }
    delete draft.editorSettings;
  } else if (parsed.editorSettings) {
    draft.editorSettings = parsed.editorSettings;
  }
  if (parsed.billing) draft.billing = parsed.billing;
}

/**
 * Creates error display element
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {string} details - Additional details (optional)
 * @returns {HTMLElement} Error display element
 */
export function createErrorDisplay(title, message, details = null) {
  const elements = [el('h2', {}, title), el('p', {}, message)];

  if (details) {
    elements.push(el('p', {}, details));
  }

  return el('div', { class: 'panel error' }, elements);
}

/**
 * Creates loading indicator element
 * @param {string} message - Loading message
 * @returns {HTMLElement} Loading indicator
 */
export function createLoadingIndicator(message = 'Loading case...') {
  return el('div', { class: 'panel' }, message);
}
