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
import { getPatientDisplayName, formatDOB } from '../CaseEditorUtils.js';

/** Create a Material Symbols Outlined icon element */
function materialIcon(name) {
  return el('span', { class: 'material-symbols-outlined ncp-icon', 'aria-hidden': 'true' }, name);
}

const STORE_KEY = 'dietetics_emr_cases';
const DRAFT_PREFIX = 'dietetics_draft_';

function loadCase(caseId) {
  try {
    const cases = JSON.parse(storage.getItem(STORE_KEY) || '{}');
    return cases[caseId] || null;
  } catch {
    return null;
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

function renderEditor(wrapper, caseId) {
  const caseData = loadCase(caseId);
  const caseObj = caseData?.caseObj || {};
  let draft = loadDraft(caseId) || createDefaultDraft(caseObj);
  draft = migrateDraft(draft);

  let activeSection = 'nutrition-assessment';

  const onDraftChange = (d) => {
    draft = d;
    saveDraft(caseId, draft);
    updateSidebarStatus();
    const indicator = wrapper.querySelector('.note-editor__save-indicator');
    if (indicator) {
      indicator.textContent = 'Saved';
      indicator.classList.add('saved');
      setTimeout(() => indicator.classList.remove('saved'), 1500);
    }
  };

  // --- Patient Header (read-only — demographics set at case creation) ---
  const meta = caseObj.meta || {};
  const patientName = getPatientDisplayName(caseObj);
  const dobFormatted = formatDOB(meta.dob || '');
  const patientHeader = el('div', { class: 'note-editor__patient-header' }, [
    el('div', { class: 'note-editor__patient-name' }, patientName),
    el('div', { class: 'note-editor__patient-details' }, [
      dobFormatted ? el('span', {}, `DOB: ${dobFormatted}`) : null,
      meta.sex ? el('span', {}, meta.sex) : null,
      meta.dietOrder ? el('span', {}, `Diet: ${meta.dietOrder}`) : null,
      meta.allergies
        ? el('span', { class: 'dietetics-allergy-badge' }, [
            materialIcon('warning'),
            ` ${meta.allergies}`,
          ])
        : null,
    ]),
    el('span', { class: 'note-editor__save-indicator' }, ''),
  ]);

  // --- Sidebar ---
  const tracker = createProgressTracker(dieteticsDisciplineConfig);

  function buildSidebar() {
    return el('nav', { class: 'note-editor__sidebar', 'aria-label': 'NCP Sections' }, [
      el('div', { class: 'note-editor__sidebar-title' }, 'Chart Sections'),
      ...NCP_SECTIONS.map((s) => {
        const status = tracker.getSectionStatus(s.id, draft);
        const btn = el(
          'button',
          {
            class: `note-editor__sidebar-item ${s.id === activeSection ? 'note-editor__sidebar-item--active' : ''}`,
            'data-section': s.id,
            onclick: () => {
              activeSection = s.id;
              renderContent();
              updateSidebarStatus();
              wrapper
                .querySelectorAll('.note-editor__sidebar-item')
                .forEach((b) =>
                  b.classList.toggle(
                    'note-editor__sidebar-item--active',
                    b.dataset.section === s.id,
                  ),
                );
            },
          },
          [
            tracker.createIndicator(status),
            el('span', { class: 'note-editor__sidebar-icon' }, [materialIcon(s.icon)]),
            el('span', {}, s.label),
          ],
        );
        return btn;
      }),
    ]);
  }

  /** Refresh progress dots in the sidebar without full rebuild */
  function updateSidebarStatus() {
    sidebar?.querySelectorAll('.note-editor__sidebar-item').forEach((btn) => {
      const sectionId = btn.dataset.section;
      const status = tracker.getSectionStatus(sectionId, draft);
      const dot = btn.querySelector('.progress-indicator');
      if (dot) {
        const colors = {
          empty: 'var(--border)',
          partial: 'var(--und-orange)',
          complete: 'var(--und-green)',
        };
        const color = colors[status] || colors.empty;
        dot.style.background = status === 'empty' ? 'var(--bg)' : color;
        dot.style.borderColor = color;
        dot.dataset.status = status;
        dot.setAttribute('aria-label', `Status: ${status}`);
      }
    });
  }

  // --- Content pane ---
  const contentPane = el('div', { class: 'note-editor__content' });

  function renderContent() {
    contentPane.replaceChildren();
    const renderer = SECTION_RENDERERS[activeSection];
    if (renderer) {
      contentPane.append(renderer(draft, onDraftChange));
    }
  }

  // --- Layout ---
  const sidebar = buildSidebar();
  const layout = el('div', { class: 'note-editor' }, [sidebar, contentPane]);

  wrapper.replaceChildren();
  wrapper.append(patientHeader, layout);
  renderContent();
}

// Register routes for both student and faculty editors
route('#/dietetics/student/editor', (wrapper, query) => {
  const caseId = query.get('case');
  if (!caseId) {
    wrapper.replaceChildren(el('p', {}, 'No case specified.'));
    return;
  }
  renderEditor(wrapper, caseId);
});

route('#/dietetics/instructor/editor', (wrapper, query) => {
  const caseId = query.get('case');
  if (!caseId) {
    wrapper.replaceChildren(el('p', {}, 'No case specified.'));
    return;
  }
  renderEditor(wrapper, caseId);
});
