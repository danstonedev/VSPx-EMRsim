import { el } from '../../ui/utils.js';
import { inputField, textAreaField, selectField } from '../../ui/form-components.js';
import { renderSchedulingPanel } from '../../features/scheduling/SchedulingPanel.js';
import { createDefaultSchedulingData } from '../../features/scheduling/scheduling-data.js';

export const DIETETICS_DRAFT_PREFIX = 'dietetics_draft_';

export const DIETETICS_NCP_SECTIONS = [
  { id: 'nutrition-assessment', label: 'Nutrition Assessment', icon: 'assignment' },
  { id: 'nutrition-diagnosis', label: 'Nutrition Diagnosis', icon: 'search' },
  { id: 'nutrition-intervention', label: 'Nutrition Intervention', icon: 'medication' },
  { id: 'nutrition-monitoring', label: 'Monitoring & Evaluation', icon: 'monitoring' },
  { id: 'scheduling', label: 'Scheduling', icon: 'calendar_month' },
  { id: 'billing', label: 'Billing', icon: 'receipt_long' },
];

const NUTRITION_ASSESSMENT_DOMAINS = [
  { id: 'food_nutrition_history', label: 'Food / Nutrition-Related History' },
  { id: 'anthropometric', label: 'Anthropometric Measurements' },
  { id: 'biochemical', label: 'Biochemical Data / Medical Tests / Procedures' },
  { id: 'nutrition_focused_pe', label: 'Nutrition-Focused Physical Exam' },
  { id: 'client_history', label: 'Client History' },
];

const MALNUTRITION_CRITERIA = [
  { value: '', label: '- Select -' },
  { value: 'not-at-risk', label: 'Not at risk' },
  { value: 'at-risk', label: 'At risk of malnutrition' },
  { value: 'moderate', label: 'Moderate malnutrition' },
  { value: 'severe', label: 'Severe malnutrition' },
];

const PES_PROBLEM_OPTIONS = [
  { value: '', label: '- Select Problem -' },
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
  { value: '', label: '- Select Strategy -' },
  { value: 'ND-1', label: 'ND-1 Meals and Snacks' },
  { value: 'ND-2', label: 'ND-2 Enteral / Parenteral Nutrition' },
  { value: 'ND-3', label: 'ND-3 Supplements' },
  { value: 'ND-4', label: 'ND-4 Feeding Assistance' },
  { value: 'ND-5', label: 'ND-5 Nutrition-Related Medication Management' },
  { value: 'E-1', label: 'E-1 Nutrition Education - content' },
  { value: 'E-2', label: 'E-2 Nutrition Education - application' },
  { value: 'C-1', label: 'C-1 Nutrition Counseling - theoretical basis' },
  { value: 'C-2', label: 'C-2 Nutrition Counseling - strategies' },
  { value: 'RC-1', label: 'RC-1 Coordination of Nutrition Care' },
];

const MONITORING_INDICATORS = [
  { value: '', label: '- Select Indicator -' },
  { value: 'FH-1', label: 'FH-1 Food and Nutrient Intake' },
  { value: 'FH-7', label: 'FH-7 Food and Nutrient Administration' },
  { value: 'AD-1', label: 'AD-1 Body Composition / Growth' },
  { value: 'BD-1', label: 'BD-1 Nutritional Anemia Profile' },
  { value: 'BD-1.2', label: 'BD-1.2 Biochemical Index' },
  { value: 'PD-1', label: 'PD-1 Nutrition-Focused Physical Findings' },
  { value: 'CH-1', label: 'CH-1 Patient / Client History' },
];

const MNT_CPT_CODES = [
  { value: '', label: '- Select CPT -' },
  { value: '97802', label: '97802 - MNT Initial Assessment (15 min)' },
  { value: '97803', label: '97803 - MNT Re-assessment (15 min)' },
  { value: '97804', label: '97804 - MNT Group Counseling (30 min)' },
];

function materialIcon(name) {
  return el('span', { class: 'material-symbols-outlined ncp-icon', 'aria-hidden': 'true' }, name);
}

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
    children.map((child) => el('div', { class: 'patient-profile-inline-row__cell' }, [child])),
  );
}

export function createDefaultDieteticsDraft(caseObj) {
  return {
    nutrition_assessment: {
      food_nutrition_history: caseObj?.nutritionAssessment || '',
      anthropometric: '',
      biochemical: '',
      nutrition_focused_pe: '',
      client_history: '',
      malnutrition_risk: '',
      estimated_needs: '',
    },
    nutrition_diagnosis: {
      pes_statements: [{ problem: '', etiology: '', signs_symptoms: '' }],
      priority_diagnosis: '',
    },
    nutrition_intervention: {
      strategy: '',
      diet_order: '',
      goals: '',
      education_topics: '',
      counseling_notes: '',
      coordination: '',
    },
    nutrition_monitoring: {
      indicators: '',
      criteria: '',
      outcomes: '',
      follow_up_plan: '',
    },
    scheduling: caseObj?.scheduling || createDefaultSchedulingData(),
    billing: {
      cpt_code: '',
      units: '',
      time_minutes: '',
      diagnosis_codes: '',
      justification: '',
    },
  };
}

export function migrateDieteticsDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    return createDefaultDieteticsDraft();
  }
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
  if (!draft.scheduling) {
    draft.scheduling = createDefaultSchedulingData();
  }
  return draft;
}

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
      onChange: (value) => update(domain.id, value),
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
          onChange: (value) => update('malnutrition_risk', value),
        }),
        inputField({
          label: 'Estimated Energy / Protein Needs',
          value: data.estimated_needs || '',
          onChange: (value) => update('estimated_needs', value),
          placeholder: 'e.g. 1800-2000 kcal, 70-85 g protein',
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
          onChange: (value) => {
            pes.problem = value;
            update();
          },
          hint: 'IDNT nutrition diagnosis code',
        }),
        textAreaField({
          label: 'Etiology (E)',
          value: pes.etiology || '',
          onChange: (value) => {
            pes.etiology = value;
            update();
          },
          rows: 2,
          placeholder: 'Related to...',
        }),
        textAreaField({
          label: 'Signs & Symptoms (S)',
          value: pes.signs_symptoms || '',
          onChange: (value) => {
            pes.signs_symptoms = value;
            update();
          },
          rows: 2,
          placeholder: 'As evidenced by...',
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
        onChange: (value) => {
          data.priority_diagnosis = value;
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
          onChange: (value) => update('strategy', value),
        }),
        inputField({
          label: 'Diet Order / Prescription',
          value: data.diet_order || '',
          onChange: (value) => update('diet_order', value),
          placeholder: 'e.g. Regular diet, 2g Na restriction, Carb-controlled',
        }),
      ]),
      textAreaField({
        label: 'Nutrition Goals',
        value: data.goals || '',
        onChange: (value) => update('goals', value),
        rows: 3,
        hint: 'Measurable goals related to the nutrition diagnosis',
      }),
    ]),
    subsectionPanel('intervention-education', 'Education & Counseling', [
      textAreaField({
        label: 'Education Topics',
        value: data.education_topics || '',
        onChange: (value) => update('education_topics', value),
        rows: 3,
        placeholder: 'Topics covered, materials provided, patient understanding...',
      }),
      textAreaField({
        label: 'Counseling Notes',
        value: data.counseling_notes || '',
        onChange: (value) => update('counseling_notes', value),
        rows: 3,
        placeholder: 'Behavioral strategies, motivational interviewing notes...',
      }),
    ]),
    subsectionPanel('intervention-coordination', 'Care Coordination', [
      textAreaField({
        label: 'Coordination of Care',
        value: data.coordination || '',
        onChange: (value) => update('coordination', value),
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
          onChange: (value) => update('indicators', value),
        }),
        inputField({
          label: 'Evaluation Criteria',
          value: data.criteria || '',
          onChange: (value) => update('criteria', value),
          placeholder: 'Target value or clinical benchmark',
        }),
      ]),
    ]),
    subsectionPanel('monitoring-outcomes', 'Outcomes', [
      textAreaField({
        label: 'Outcome Documentation',
        value: data.outcomes || '',
        onChange: (value) => update('outcomes', value),
        rows: 4,
        hint: 'Compare current status to previous assessment and intervention goals',
      }),
    ]),
    subsectionPanel('monitoring-followup', 'Follow-Up Plan', [
      textAreaField({
        label: 'Follow-Up Plan',
        value: data.follow_up_plan || '',
        onChange: (value) => update('follow_up_plan', value),
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
          onChange: (value) => update('cpt_code', value),
        }),
        inputField({
          label: 'Units',
          value: data.units || '',
          onChange: (value) => update('units', value),
          type: 'number',
          placeholder: 'Number of 15-min units',
        }),
      ]),
      inlineRow([
        inputField({
          label: 'Time (minutes)',
          value: data.time_minutes || '',
          onChange: (value) => update('time_minutes', value),
          type: 'number',
          placeholder: 'Total face-to-face time',
        }),
        inputField({
          label: 'ICD-10 Diagnosis Codes',
          value: data.diagnosis_codes || '',
          onChange: (value) => update('diagnosis_codes', value),
          placeholder: 'e.g. E11.65, E44.0',
        }),
      ]),
    ]),
    subsectionPanel('billing-justification', 'Medical Necessity', [
      textAreaField({
        label: 'Justification',
        value: data.justification || '',
        onChange: (value) => update('justification', value),
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

export const DIETETICS_SECTION_RENDERERS = {
  'nutrition-assessment': renderAssessmentSection,
  'nutrition-diagnosis': renderDiagnosisSection,
  'nutrition-intervention': renderInterventionSection,
  'nutrition-monitoring': renderMonitoringSection,
  scheduling: renderSchedulingSection,
  billing: renderBillingSection,
};
