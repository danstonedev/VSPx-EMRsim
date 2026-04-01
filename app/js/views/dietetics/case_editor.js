/**
 * Dietetics Case Editor — NCP-based documentation with scheduling.
 *
 * This is an independent editor for dietetics cases, using the Nutrition Care
 * Process sections instead of PT SOAP sections.
 */
import { route } from '../../core/router.js';
import { el } from '../../ui/utils.js';
import { storage } from '../../core/index.js';
import { inputField, textAreaField, selectField } from '../../ui/form-components.js';
import { renderSchedulingPanel } from '../../features/scheduling/SchedulingPanel.js';
import { createDefaultSchedulingData } from '../../features/scheduling/scheduling-data.js';
import { createProgressTracker } from '../../features/navigation/SidebarProgressTracker.js';
import { dieteticsDisciplineConfig } from '../../features/navigation/dietetics-discipline-config.js';
import { ptDisciplineConfig } from '../../features/navigation/pt-discipline-config.js';
import { getPatientDisplayName } from '../CaseEditorUtils.js';
import { createChartSidebar } from '../../features/navigation/ChartSidebarOrchestrator.js';
import { getArtifactTypeLabel, openCaseFileViewer } from './casefile_helpers.js';
import { createPilotNoteSession } from './note_session_controller.js';
import { createPilotWorkspaceController } from './note_workspace_adapters.js';
import { createPilotWorkspaceContent } from './note_workspace_content.js';
import { createDieteticsPatientHeader } from './patient_header.js';
import { createPilotWorkspaceSidebar } from './note_workspace_sidebar.js';
import { ptSimpleSoapDisciplineConfig } from './pt_note_workspace.js';
import { listPilotProfessions, listPilotTemplatesForProfession } from '../../core/noteCatalog.js';
import {
  buildSignedNoteCaseFileEntry,
  upsertCaseFileEntry,
} from '../../core/casefile-repository.js';

/** Create a Material Symbols Outlined icon element */
function materialIcon(name) {
  return el('span', { class: 'material-symbols-outlined ncp-icon', 'aria-hidden': 'true' }, name);
}

const STORE_KEY = 'dietetics_emr_cases';
const DRAFT_PREFIX = 'dietetics_draft_';
const PILOT_META_KEY = 'multidisciplinePilot';

function loadCase(caseId) {
  try {
    const cases = JSON.parse(storage.getItem(STORE_KEY) || '{}');
    return cases[caseId] || null;
  } catch {
    return null;
  }
}

function loadCaseMap() {
  try {
    return JSON.parse(storage.getItem(STORE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCaseMap(cases) {
  try {
    storage.setItem(STORE_KEY, JSON.stringify(cases || {}));
  } catch (e) {
    console.warn('[Dietetics] saveCaseMap failed:', e);
  }
}

function saveDraft(caseId, draftData) {
  try {
    storage.setItem(`${DRAFT_PREFIX}${caseId}`, JSON.stringify(draftData));
  } catch (e) {
    console.warn('[Dietetics] saveDraft failed:', e);
  }
}

function loadDraft(caseId) {
  try {
    const raw = storage.getItem(`${DRAFT_PREFIX}${caseId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** NCP sidebar sections */
const NCP_SECTIONS = [
  { id: 'nutrition-assessment', label: 'Nutrition Assessment', icon: 'assignment' },
  { id: 'nutrition-diagnosis', label: 'Nutrition Diagnosis', icon: 'search' },
  { id: 'nutrition-intervention', label: 'Nutrition Intervention', icon: 'medication' },
  { id: 'nutrition-monitoring', label: 'Monitoring & Evaluation', icon: 'monitoring' },
  { id: 'scheduling', label: 'Scheduling', icon: 'calendar_month' },
  { id: 'billing', label: 'Billing', icon: 'receipt_long' },
];

// --- Reference data for structured subsections ---

const NUTRITION_ASSESSMENT_DOMAINS = [
  { id: 'food_nutrition_history', label: 'Food / Nutrition-Related History' },
  { id: 'anthropometric', label: 'Anthropometric Measurements' },
  { id: 'biochemical', label: 'Biochemical Data / Medical Tests / Procedures' },
  { id: 'nutrition_focused_pe', label: 'Nutrition-Focused Physical Exam' },
  { id: 'client_history', label: 'Client History' },
];

const MALNUTRITION_CRITERIA = [
  { value: '', label: '— Select —' },
  { value: 'not-at-risk', label: 'Not at risk' },
  { value: 'at-risk', label: 'At risk of malnutrition' },
  { value: 'moderate', label: 'Moderate malnutrition' },
  { value: 'severe', label: 'Severe malnutrition' },
];

const PES_PROBLEM_OPTIONS = [
  { value: '', label: '— Select Problem —' },
  { value: 'NI-2.1', label: 'NI-2.1 Inadequate oral intake' },
  { value: 'NI-5.1', label: 'NI-5.1 Increased nutrient needs' },
  { value: 'NI-5.2', label: 'NI-5.2 Malnutrition' },
  { value: 'NI-5.3', label: 'NI-5.3 Inadequate protein-energy intake' },
  { value: 'NI-5.10.1', label: 'NI-5.10.1 Inadequate mineral intake (specify)' },
  { value: 'NI-5.10.2', label: 'NI-5.10.2 Excessive mineral intake (specify)' },
  { value: 'NC-1.4', label: 'NC-1.4 Altered GI function' },
  { value: 'NC-2.2', label: 'NC-2.2 Altered nutrition-related lab values' },
  { value: 'NC-3.1', label: 'NC-3.1 Underweight' },
  { value: 'NC-3.3', label: 'NC-3.3 Overweight / obesity' },
  { value: 'NB-1.1', label: 'NB-1.1 Food- and nutrition-related knowledge deficit' },
  { value: 'NB-1.3', label: 'NB-1.3 Not ready for diet/lifestyle change' },
  { value: 'NB-2.1', label: 'NB-2.1 Physical inactivity' },
  { value: 'NB-2.3', label: 'NB-2.3 Self-feeding difficulty' },
];

const INTERVENTION_STRATEGIES = [
  { value: '', label: '— Select Strategy —' },
  { value: 'ND-1', label: 'ND-1 Meals and Snacks' },
  { value: 'ND-2', label: 'ND-2 Enteral / Parenteral Nutrition' },
  { value: 'ND-3', label: 'ND-3 Supplements' },
  { value: 'ND-4', label: 'ND-4 Feeding Assistance' },
  { value: 'ND-5', label: 'ND-5 Nutrition-Related Medication Management' },
  { value: 'E-1', label: 'E-1 Nutrition Education — content' },
  { value: 'E-2', label: 'E-2 Nutrition Education — application' },
  { value: 'C-1', label: 'C-1 Nutrition Counseling — theoretical basis' },
  { value: 'C-2', label: 'C-2 Nutrition Counseling — strategies' },
  { value: 'RC-1', label: 'RC-1 Coordination of Nutrition Care' },
];

const MONITORING_INDICATORS = [
  { value: '', label: '— Select Indicator —' },
  { value: 'FH-1', label: 'FH-1 Food and Nutrient Intake' },
  { value: 'FH-7', label: 'FH-7 Food and Nutrient Administration' },
  { value: 'AD-1', label: 'AD-1 Body Composition / Growth' },
  { value: 'BD-1', label: 'BD-1 Nutritional Anemia Profile' },
  { value: 'BD-1.2', label: 'BD-1.2 Biochemical Index' },
  { value: 'PD-1', label: 'PD-1 Nutrition-Focused Physical Findings' },
  { value: 'CH-1', label: 'CH-1 Patient / Client History' },
];

const MNT_CPT_CODES = [
  { value: '', label: '— Select CPT —' },
  { value: '97802', label: '97802 — MNT Initial Assessment (15 min)' },
  { value: '97803', label: '97803 — MNT Re-assessment (15 min)' },
  { value: '97804', label: '97804 — MNT Group Counseling (30 min)' },
];

// --- Section panel helper (matches PT section-panel pattern) ---

function sectionPanel(id, iconName, title, children) {
  return el('div', { id, class: 'section-panel dietetics-section' }, [
    el('div', { class: 'section-panel__header' }, [
      el('h2', { class: 'section-panel__title' }, [materialIcon(iconName), ` ${title}`]),
    ]),
    el('div', { class: 'section-panel__body' }, children),
  ]);
}

function subsectionPanel(id, title, children) {
  return el('div', { class: `subsection-panel subsection-panel--${id}` }, [
    title ? el('h3', { class: 'subsection-panel__title' }, title) : null,
    el('div', { class: 'subsection-panel__content' }, children),
  ]);
}

function inlineRow(children) {
  return el(
    'div',
    { class: 'patient-profile-inline-row' },
    children.map((c) => el('div', { class: 'patient-profile-inline-row__cell' }, [c])),
  );
}

// --- Default draft structure with sub-fields ---

function createDefaultDraft(caseObj) {
  return {
    // Nutrition Assessment — structured sub-fields
    nutrition_assessment: {
      food_nutrition_history: caseObj?.nutritionAssessment || '',
      anthropometric: '',
      biochemical: '',
      nutrition_focused_pe: '',
      client_history: '',
      malnutrition_risk: '',
      estimated_needs: '',
    },
    // Nutrition Diagnosis — PES statements
    nutrition_diagnosis: {
      pes_statements: [{ problem: '', etiology: '', signs_symptoms: '' }],
      priority_diagnosis: '',
    },
    // Nutrition Intervention — structured
    nutrition_intervention: {
      strategy: '',
      diet_order: '',
      goals: '',
      education_topics: '',
      counseling_notes: '',
      coordination: '',
    },
    // Monitoring & Evaluation — structured
    nutrition_monitoring: {
      indicators: '',
      criteria: '',
      outcomes: '',
      follow_up_plan: '',
    },
    scheduling: caseObj?.scheduling || createDefaultSchedulingData(),
    // Billing — structured MNT billing
    billing: {
      cpt_code: '',
      units: '',
      time_minutes: '',
      diagnosis_codes: '',
      justification: '',
    },
  };
}

/** Migrate flat draft strings into structured sub-objects */
function migrateDraft(draft) {
  if (typeof draft.nutrition_assessment === 'string') {
    draft.nutrition_assessment = {
      food_nutrition_history: draft.nutrition_assessment,
      anthropometric: '',
      biochemical: '',
      nutrition_focused_pe: '',
      client_history: '',
      malnutrition_risk: '',
      estimated_needs: '',
    };
  }
  if (typeof draft.nutrition_diagnosis === 'string') {
    draft.nutrition_diagnosis = {
      pes_statements: [{ problem: '', etiology: '', signs_symptoms: draft.nutrition_diagnosis }],
      priority_diagnosis: '',
    };
  }
  if (typeof draft.nutrition_intervention === 'string') {
    draft.nutrition_intervention = {
      strategy: '',
      diet_order: '',
      goals: draft.nutrition_intervention,
      education_topics: '',
      counseling_notes: '',
      coordination: '',
    };
  }
  if (typeof draft.nutrition_monitoring === 'string') {
    draft.nutrition_monitoring = {
      indicators: '',
      criteria: '',
      outcomes: draft.nutrition_monitoring,
      follow_up_plan: '',
    };
  }
  if (typeof draft.billing === 'string') {
    draft.billing = {
      cpt_code: '',
      units: '',
      time_minutes: '',
      diagnosis_codes: '',
      justification: draft.billing,
    };
  }
  return draft;
}

// --- NCP Section Renderers ---

function renderAssessmentSection(draft, onDraftChange) {
  const data = draft.nutrition_assessment;
  const update = (field, value) => {
    data[field] = value;
    onDraftChange(draft);
  };

  const domainPanels = NUTRITION_ASSESSMENT_DOMAINS.map((domain) =>
    textAreaField({
      label: domain.label,
      value: data[domain.id] || '',
      onChange: (v) => update(domain.id, v),
      rows: 4,
      hint: `Document ${domain.label.toLowerCase()} findings`,
    }),
  );

  return sectionPanel('nutrition-assessment', 'assignment', 'Nutrition Assessment', [
    subsectionPanel('assessment-domains', 'Assessment Domains (ADIME)', domainPanels),
    subsectionPanel('assessment-screening', 'Screening & Estimated Needs', [
      inlineRow([
        selectField({
          label: 'Malnutrition Risk',
          value: data.malnutrition_risk || '',
          options: MALNUTRITION_CRITERIA,
          onChange: (v) => update('malnutrition_risk', v),
        }),
        inputField({
          label: 'Estimated Energy / Protein Needs',
          value: data.estimated_needs || '',
          onChange: (v) => update('estimated_needs', v),
          placeholder: 'e.g. 1800–2000 kcal, 70–85 g protein',
        }),
      ]),
    ]),
  ]);
}

function renderDiagnosisSection(draft, onDraftChange) {
  const data = draft.nutrition_diagnosis;
  const update = () => onDraftChange(draft);

  function renderPesRow(pes, index) {
    return el('div', { class: 'dietetics-pes-row' }, [
      el('div', { class: 'dietetics-pes-row__number' }, `#${index + 1}`),
      el('div', { class: 'dietetics-pes-row__fields' }, [
        selectField({
          label: 'Problem (P)',
          value: pes.problem || '',
          options: PES_PROBLEM_OPTIONS,
          onChange: (v) => {
            pes.problem = v;
            update();
          },
          hint: 'IDNT nutrition diagnosis code',
        }),
        textAreaField({
          label: 'Etiology (E)',
          value: pes.etiology || '',
          onChange: (v) => {
            pes.etiology = v;
            update();
          },
          rows: 2,
          placeholder: 'Related to…',
        }),
        textAreaField({
          label: 'Signs & Symptoms (S)',
          value: pes.signs_symptoms || '',
          onChange: (v) => {
            pes.signs_symptoms = v;
            update();
          },
          rows: 2,
          placeholder: 'As evidenced by…',
        }),
      ]),
    ]);
  }

  const pesRows = (data.pes_statements || []).map(renderPesRow);

  const addBtn = el(
    'button',
    {
      class: 'btn secondary small',
      onclick: () => {
        data.pes_statements.push({ problem: '', etiology: '', signs_symptoms: '' });
        onDraftChange(draft);
        // Re-render needed — handled by parent renderContent()
        const contentPane = addBtn.closest('.note-editor__content');
        if (contentPane) {
          contentPane.replaceChildren();
          contentPane.append(renderDiagnosisSection(draft, onDraftChange));
        }
      },
    },
    '+ Add PES Statement',
  );

  return sectionPanel('nutrition-diagnosis', 'search', 'Nutrition Diagnosis', [
    subsectionPanel('pes-statements', 'PES Statements', [
      el('p', { class: 'form-hint' }, 'Document using Problem, Etiology, Signs & Symptoms format.'),
      ...pesRows,
      addBtn,
    ]),
    subsectionPanel('priority-dx', 'Priority Diagnosis', [
      textAreaField({
        label: 'Priority Nutrition Diagnosis',
        value: data.priority_diagnosis || '',
        onChange: (v) => {
          data.priority_diagnosis = v;
          onDraftChange(draft);
        },
        rows: 3,
        hint: 'Identify the primary diagnosis to address first',
      }),
    ]),
  ]);
}

function renderInterventionSection(draft, onDraftChange) {
  const data = draft.nutrition_intervention;
  const update = (field, value) => {
    data[field] = value;
    onDraftChange(draft);
  };

  return sectionPanel('nutrition-intervention', 'medication', 'Nutrition Intervention', [
    subsectionPanel('intervention-plan', 'Intervention Planning', [
      inlineRow([
        selectField({
          label: 'Intervention Strategy',
          value: data.strategy || '',
          options: INTERVENTION_STRATEGIES,
          onChange: (v) => update('strategy', v),
        }),
        inputField({
          label: 'Diet Order / Prescription',
          value: data.diet_order || '',
          onChange: (v) => update('diet_order', v),
          placeholder: 'e.g. Regular diet, 2g Na restriction, Carb-controlled',
        }),
      ]),
      textAreaField({
        label: 'Nutrition Goals',
        value: data.goals || '',
        onChange: (v) => update('goals', v),
        rows: 3,
        hint: 'Measurable goals related to the nutrition diagnosis',
      }),
    ]),
    subsectionPanel('intervention-education', 'Education & Counseling', [
      textAreaField({
        label: 'Education Topics',
        value: data.education_topics || '',
        onChange: (v) => update('education_topics', v),
        rows: 3,
        placeholder: 'Topics covered, materials provided, patient understanding…',
      }),
      textAreaField({
        label: 'Counseling Notes',
        value: data.counseling_notes || '',
        onChange: (v) => update('counseling_notes', v),
        rows: 3,
        placeholder: 'Behavioral strategies, motivational interviewing notes…',
      }),
    ]),
    subsectionPanel('intervention-coordination', 'Care Coordination', [
      textAreaField({
        label: 'Coordination of Care',
        value: data.coordination || '',
        onChange: (v) => update('coordination', v),
        rows: 3,
        hint: 'Referrals, communication with RN/MD/pharmacy/dietary staff',
      }),
    ]),
  ]);
}

function renderMonitoringSection(draft, onDraftChange) {
  const data = draft.nutrition_monitoring;
  const update = (field, value) => {
    data[field] = value;
    onDraftChange(draft);
  };

  return sectionPanel('nutrition-monitoring', 'monitoring', 'Monitoring & Evaluation', [
    subsectionPanel('monitoring-indicators', 'Indicators & Criteria', [
      inlineRow([
        selectField({
          label: 'Monitoring Indicator',
          value: data.indicators || '',
          options: MONITORING_INDICATORS,
          onChange: (v) => update('indicators', v),
        }),
        inputField({
          label: 'Evaluation Criteria',
          value: data.criteria || '',
          onChange: (v) => update('criteria', v),
          placeholder: 'Target value or clinical benchmark',
        }),
      ]),
    ]),
    subsectionPanel('monitoring-outcomes', 'Outcomes', [
      textAreaField({
        label: 'Outcome Documentation',
        value: data.outcomes || '',
        onChange: (v) => update('outcomes', v),
        rows: 4,
        hint: 'Compare current status to previous assessment & intervention goals',
      }),
    ]),
    subsectionPanel('monitoring-followup', 'Follow-Up Plan', [
      textAreaField({
        label: 'Follow-Up Plan',
        value: data.follow_up_plan || '',
        onChange: (v) => update('follow_up_plan', v),
        rows: 3,
        hint: 'Reassessment timeline, continued monitoring, discharge criteria',
      }),
    ]),
  ]);
}

function renderBillingSection(draft, onDraftChange) {
  const data = draft.billing;
  const update = (field, value) => {
    data[field] = value;
    onDraftChange(draft);
  };

  return sectionPanel('billing', 'receipt_long', 'Billing', [
    subsectionPanel('billing-codes', 'MNT Billing Codes', [
      inlineRow([
        selectField({
          label: 'CPT Code',
          value: data.cpt_code || '',
          options: MNT_CPT_CODES,
          onChange: (v) => update('cpt_code', v),
        }),
        inputField({
          label: 'Units',
          value: data.units || '',
          onChange: (v) => update('units', v),
          type: 'number',
          placeholder: 'Number of 15-min units',
        }),
      ]),
      inlineRow([
        inputField({
          label: 'Time (minutes)',
          value: data.time_minutes || '',
          onChange: (v) => update('time_minutes', v),
          type: 'number',
          placeholder: 'Total face-to-face time',
        }),
        inputField({
          label: 'ICD-10 Diagnosis Codes',
          value: data.diagnosis_codes || '',
          onChange: (v) => update('diagnosis_codes', v),
          placeholder: 'e.g. E11.65, E44.0',
        }),
      ]),
    ]),
    subsectionPanel('billing-justification', 'Medical Necessity', [
      textAreaField({
        label: 'Justification',
        value: data.justification || '',
        onChange: (v) => update('justification', v),
        rows: 4,
        hint: 'Medical necessity statement supporting the nutrition intervention',
      }),
    ]),
  ]);
}

function renderSchedulingSection(draft, onDraftChange) {
  const container = el('div', { class: 'dietetics-section dietetics-section--scheduling' });
  const schedData = draft.scheduling || createDefaultSchedulingData();
  renderSchedulingPanel(container, schedData, (updatedSched) => {
    draft.scheduling = updatedSched;
    onDraftChange(draft);
  });
  return container;
}

/** Dispatch to the correct section renderer */
const SECTION_RENDERERS = {
  'nutrition-assessment': renderAssessmentSection,
  'nutrition-diagnosis': renderDiagnosisSection,
  'nutrition-intervention': renderInterventionSection,
  'nutrition-monitoring': renderMonitoringSection,
  scheduling: renderSchedulingSection,
  billing: renderBillingSection,
};

function renderEditor(wrapper, caseId, query = new URLSearchParams()) {
  // Clean up stale chart rail state from previous view
  document.body.classList.remove('has-chart-rail', 'chart-panel-open');

  const caseData = loadCase(caseId);
  const caseObj = caseData?.caseObj || {};
  const meta = caseObj.meta || {};
  const patientName = getPatientDisplayName(caseObj);
  let dietDraft = loadDraft(caseId) || createDefaultDraft(caseObj);
  dietDraft = migrateDraft(dietDraft);

  const isFacultyMode = window.location.hash.startsWith('#/dietetics/instructor/editor');
  const requestedProfession = query.get('profession') || '';
  const requestedTemplateId = query.get('template') || '';

  const dietTracker = createProgressTracker(dieteticsDisciplineConfig);
  const ptTracker = createProgressTracker(ptDisciplineConfig);
  const ptSimpleTracker = createProgressTracker(ptSimpleSoapDisciplineConfig);

  function savePilotState(updates) {
    caseObj.meta = caseObj.meta || {};
    const next = {
      ...(caseObj.meta[PILOT_META_KEY] || {}),
      ...updates,
    };
    caseObj.meta[PILOT_META_KEY] = next;

    const cases = loadCaseMap();
    const row = cases[caseId];
    if (row?.caseObj) {
      row.caseObj.meta = row.caseObj.meta || {};
      row.caseObj.meta[PILOT_META_KEY] = next;
      saveCaseMap(cases);
    }

    return next;
  }
  const noteSession = createPilotNoteSession({
    caseId,
    caseObj,
    patientName,
    dietDraft,
    isFacultyMode,
    requestedProfession,
    requestedTemplateId,
    pilotMetaKey: PILOT_META_KEY,
    dietDraftPrefix: DRAFT_PREFIX,
    savePilotState,
    saveDietDraft: (nextDraft) => saveDraft(caseId, nextDraft),
  });

  function showSavedIndicator() {
    const indicator = wrapper.querySelector('.note-editor__save-indicator');
    if (indicator) {
      indicator.textContent = 'Saved';
      indicator.classList.add('saved');
      setTimeout(() => indicator.classList.remove('saved'), 1500);
    }
  }

  const workspaceController = createPilotWorkspaceController({
    noteSession,
    dietTracker,
    ptTracker,
    ptSimpleTracker,
    ncpSections: NCP_SECTIONS,
    dieteticSectionRenderers: SECTION_RENDERERS,
    onDieteticsDraftChange: handleDieteticsDraftChange,
    onPtDraftChange: handlePtDraftChange,
  });

  function handleDieteticsDraftChange(nextDraft) {
    dietDraft = noteSession.updateDietDraft(nextDraft);
    noteSession.handleDieteticsDraftChange(nextDraft, () => updateSidebarStatus());
    updateSidebarStatus();
    showSavedIndicator();
  }

  function handlePtDraftChange(templateId, nextDraft) {
    noteSession.handlePtDraftChange(templateId, nextDraft, () => updateSidebarStatus());
    updateSidebarStatus();
    showSavedIndicator();
  }

  noteSession.syncGlobals(() => updateSidebarStatus());

  function syncPatientHeaderHeight() {
    const h = patientHeader.offsetHeight || 0;
    document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
  }

  function getCaseModules() {
    return Array.isArray(caseObj.modules) ? caseObj.modules : [];
  }

  function saveCaseModules(nextModules) {
    caseObj.modules = Array.isArray(nextModules) ? nextModules : [];
    const cases = loadCaseMap();
    const row = cases[caseId];
    if (row && row.caseObj) {
      row.caseObj.modules = caseObj.modules;
      saveCaseMap(cases);
    }
  }

  function saveSignedNoteToCasefile(draftLike, rawContext = {}) {
    if (!draftLike?.meta?.signature) return null;

    const context = {
      caseId,
      professionId: noteSession.getSelectedProfession(),
      encounterId: noteSession.getSelectedTemplateId() === 'dietetics-ncp' ? 'nutrition' : '',
      templateId: noteSession.getSelectedTemplateId(),
      ...rawContext,
    };

    const sourceKey =
      rawContext.sourceKey ||
      (context.professionId === 'dietetics'
        ? `dietetics_draft_${context.caseId}`
        : `draft_${context.caseId}_${context.encounterId || 'eval'}`);

    const entry = buildSignedNoteCaseFileEntry({
      draft: draftLike,
      caseId: context.caseId || caseId,
      professionId: context.professionId,
      encounterId: context.encounterId,
      templateId: context.templateId,
      sourceKey,
    });

    const nextModules = upsertCaseFileEntry(getCaseModules(), entry);
    saveCaseModules(nextModules);
    return entry;
  }

  // --- Patient Header (read-only — demographics set at case creation) ---
  const patientHeaderController = createDieteticsPatientHeader({
    meta,
    patientName,
    materialIcon,
    professionOptions: listPilotProfessions(),
    selectedProfession: noteSession.getSelectedProfession(),
    noteTypeOptions: listPilotTemplatesForProfession(noteSession.getSelectedProfession()),
    selectedTemplateId: noteSession.getSelectedTemplateId(),
    onProfessionChange: (professionId) => {
      noteSession.setSelectedProfession(professionId);
      workspaceController.ensureValidActiveSection();
      patientHeaderController.updateSelectors({
        professionOptions: listPilotProfessions(),
        selectedProfession: noteSession.getSelectedProfession(),
        noteTypeOptions: listPilotTemplatesForProfession(noteSession.getSelectedProfession()),
        selectedTemplateId: noteSession.getSelectedTemplateId(),
      });
      noteSession.syncGlobals(() => updateSidebarStatus());
      rerenderCurrentNoteWorkspace();
      renderContent();
      updateSidebarStatus();
      syncPatientHeaderHeight();
    },
    onNoteTypeChange: (templateId) => {
      noteSession.setSelectedTemplateId(templateId);
      workspaceController.ensureValidActiveSection();
      patientHeaderController.updateSelectors({
        professionOptions: listPilotProfessions(),
        selectedProfession: noteSession.getSelectedProfession(),
        noteTypeOptions: listPilotTemplatesForProfession(noteSession.getSelectedProfession()),
        selectedTemplateId: noteSession.getSelectedTemplateId(),
      });
      noteSession.syncGlobals(() => updateSidebarStatus());
      rerenderCurrentNoteWorkspace();
      renderContent();
      updateSidebarStatus();
      syncPatientHeaderHeight();
    },
  });
  const patientHeader = patientHeaderController.element;

  let rerenderCurrentNoteWorkspace = () => {};
  let updateSidebarStatus = () => {};

  function launchPilotTemplate(templateId = noteSession.getSelectedTemplateId()) {
    noteSession.launchTemplate(templateId);
    workspaceController.ensureValidActiveSection();
    patientHeaderController.updateSelectors({
      professionOptions: listPilotProfessions(),
      selectedProfession: noteSession.getSelectedProfession(),
      noteTypeOptions: listPilotTemplatesForProfession(noteSession.getSelectedProfession()),
      selectedTemplateId: noteSession.getSelectedTemplateId(),
    });
    noteSession.syncGlobals(() => updateSidebarStatus());
    rerenderCurrentNoteWorkspace();
    renderContent();
    updateSidebarStatus();
  }

  const contentController = createPilotWorkspaceContent({
    workspaceController,
    onSyncGlobals: () => noteSession.syncGlobals(() => updateSidebarStatus()),
  });
  const contentPane = contentController.contentPane;
  const renderContent = contentController.renderContent;

  // --- Layout: chart rail + detail panel + content area ---
  const sidebarController = createPilotWorkspaceSidebar({
    caseObj: caseObj || {},
    isFacultyMode,
    getCaseModules,
    saveCaseModules,
    openCaseFileViewer: (moduleItem, opts) =>
      openCaseFileViewer(moduleItem, { ...opts, isFacultyMode }),
    getArtifactTypeLabel,
    noteSession,
    workspaceController,
    onSectionChange: () => {
      renderContent();
    },
    onLaunch: launchPilotTemplate,
    ncpSections: NCP_SECTIONS,
    dietTracker,
    materialIcon,
  });
  const sidebar = sidebarController.sidebar;
  rerenderCurrentNoteWorkspace = sidebarController.rerenderCurrentNoteWorkspace;
  updateSidebarStatus = sidebarController.updateSidebarStatus;
  const refreshCaseFileView = sidebarController.refreshCaseFileView;

  const chartSidebar = createChartSidebar({
    notesSidebar: sidebar,
    caseObj: caseObj || {},
    caseId,
    maxPhase: 1,
    defaultTab: 'current-note',
    embedStrategy: {
      embed(el, container) {
        el.classList.add('note-editor__sidebar--embedded');
        container.appendChild(el);
      },
      restore(el) {
        el.classList.remove('note-editor__sidebar--embedded');
      },
    },
  });

  const contentArea = el('div', { class: 'note-editor main-content-with-sidebar' }, [
    patientHeader,
    contentPane,
  ]);

  document.body.classList.add('has-chart-rail');
  wrapper.replaceChildren();
  wrapper.append(chartSidebar.wrapper, contentArea);
  syncPatientHeaderHeight();

  if (typeof window !== 'undefined') {
    window.saveSignedNoteToCasefile = ({ draft, context } = {}) => {
      const record = saveSignedNoteToCasefile(draft, context);
      refreshCaseFileView();
      return record;
    };
    window.refreshCaseFileView = refreshCaseFileView;
  }

  try {
    if (window.__dieteticsHeaderResizeObserver?.disconnect) {
      window.__dieteticsHeaderResizeObserver.disconnect();
    }
    if (window.__dieteticsHeaderResizeHandler) {
      window.removeEventListener('resize', window.__dieteticsHeaderResizeHandler);
      window.__dieteticsHeaderResizeHandler = null;
    }
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(syncPatientHeaderHeight);
      ro.observe(patientHeader);
      window.__dieteticsHeaderResizeObserver = ro;
    } else {
      const resizeHandler = () => syncPatientHeaderHeight();
      window.__dieteticsHeaderResizeHandler = resizeHandler;
      window.addEventListener('resize', resizeHandler, { passive: true });
    }
  } catch {
    /* safe fallback */
  }
  renderContent();
}

// Register routes for both student and faculty editors
route('#/dietetics/student/editor', (wrapper, query) => {
  const caseId = query.get('case');
  if (!caseId) {
    wrapper.replaceChildren(el('p', {}, 'No case specified.'));
    return;
  }
  renderEditor(wrapper, caseId, query);
  return () => document.body.classList.remove('has-chart-rail', 'chart-panel-open');
});

route('#/dietetics/instructor/editor', (wrapper, query) => {
  const caseId = query.get('case');
  if (!caseId) {
    wrapper.replaceChildren(el('p', {}, 'No case specified.'));
    return;
  }
  renderEditor(wrapper, caseId, query);
  return () => document.body.classList.remove('has-chart-rail', 'chart-panel-open');
});
