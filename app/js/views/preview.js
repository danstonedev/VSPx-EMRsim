import { route } from '../core/router.js';
async function _getCase(id) {
  const { getCase } = await import('../core/store.js');
  return getCase(id);
}
import { el, printPage } from '../ui/utils.js';
import { resolvePatientProfile, hasPatientProfileContent } from '../core/patient-profile.js';
import {
  formatAssessmentScoreSummary,
  normalizeStandardizedAssessments,
} from '../features/soap/objective/standardized-assessment-definitions.js';

/* ── tiny helpers ─────────────────────────────────────────── */
const dash = (v) => v || '—';
const joinList = (arr) => (Array.isArray(arr) && arr.length ? arr.join(', ') : '—');

/** Label/value row for definition‑list style display */
function row(label, value) {
  return el('div', { class: 'preview-row' }, [
    el('strong', {}, `${label}: `),
    el('span', {}, dash(value)),
  ]);
}

/** Section heading with optional hr */
function heading(text) {
  return el('div', {}, [el('div', { class: 'hr' }), el('h3', {}, text)]);
}

/** Build a simple table from header + rows arrays */
function simpleTable(headers, rows) {
  const thead = el(
    'thead',
    {},
    el(
      'tr',
      {},
      headers.map((h) => el('th', {}, h)),
    ),
  );
  const tbody = el(
    'tbody',
    {},
    rows.map((r) =>
      el(
        'tr',
        {},
        r.map((cell) => el('td', {}, String(cell ?? '—'))),
      ),
    ),
  );
  return el('table', { class: 'table preview-table' }, [thead, tbody]);
}

/* ── section builders ─────────────────────────────────────── */

function buildSnapshot(snap) {
  if (!snap) return [];
  return [
    heading('Patient Snapshot'),
    row('Name', snap.name),
    row('Age / Sex / DOB', [snap.age, snap.sex, snap.dob].filter(Boolean).join(' · ')),
    el('p', {}, dash(snap.teaser)),
  ];
}

function buildHistory(hist) {
  if (!hist) return [];
  const kids = [
    heading('Subjective'),
    row('Chief Complaint', hist.chief_complaint),
    el('h4', {}, 'HPI'),
    el('p', {}, dash(hist.hpi)),
    row('Mechanism of Injury', hist.mechanism_of_injury),
  ];
  // Pain sub‑block
  const pain = hist.pain;
  if (pain && Object.values(pain).some(Boolean)) {
    kids.push(
      el('h4', {}, 'Pain'),
      row('Level', pain.level),
      row('Location', pain.location),
      row('Quality', pain.quality),
      row('Aggravating', pain.aggravating_factors),
      row('Easing', pain.easing_factors),
      row('Onset', pain.onset),
      row('Duration', pain.duration),
    );
  }
  kids.push(
    row('PMH', joinList(hist.pmh)),
    row('Medications', joinList(hist.meds)),
    row('Red Flags', joinList(hist.red_flag_signals)),
    row('Functional Goals', joinList(hist.functional_goals)),
  );
  return kids;
}

function buildEncounterSubjective(subj) {
  if (!subj) return [];
  const kids = [el('h4', {}, 'Encounter — Subjective Detail')];
  const fields = [
    ['Chief Complaint', subj.chiefComplaint],
    ['HPI', subj.historyOfPresentIllness],
    ['Pain Location', subj.painLocation],
    ['Pain Scale', subj.painScale],
    ['Pain Quality', subj.painQuality],
    ['Pain Pattern', subj.painPattern],
    ['Aggravating', subj.aggravatingFactors],
    ['Easing', subj.easingFactors],
    ['Functional Limitations', subj.functionalLimitations],
    ['Prior Level', subj.priorLevel],
    ['Patient Goals', subj.patientGoals],
    ['Current Meds', subj.medicationsCurrent],
    ['Red Flags', subj.redFlags],
    ['Additional History', subj.additionalHistory],
  ];
  for (const [label, val] of fields) {
    if (val) kids.push(row(label, val));
  }

  // Interview Q/A items
  const qaItems = Array.isArray(subj.qaItems)
    ? subj.qaItems.filter((q) => q.question || q.response)
    : [];
  if (qaItems.length) {
    kids.push(el('h5', {}, `Interview Q/A (${qaItems.length})`));
    const qaRows = qaItems.map((q, i) => {
      const tags = Array.isArray(q.tags) && q.tags.length ? ` [${q.tags.join(', ')}]` : '';
      return [`Q${i + 1}`, (q.question || '—') + tags, q.response || '—'];
    });
    kids.push(simpleTable(['#', 'Question', 'Response'], qaRows));
  }

  return kids;
}

function buildPatientProfile(profile) {
  if (!hasPatientProfileContent(profile)) return [];

  const kids = [heading('Patient Profile')];
  const groups = [
    ...profile.identityRows,
    ...profile.encounterRows,
    ['Allergies', profile.allergies],
    ...profile.contactRows,
    ...profile.coverageRows,
    ...profile.anthropometricRows,
  ];

  groups
    .filter(([, value]) => value)
    .forEach(([label, value]) => {
      kids.push(row(label, value));
    });

  if (profile.clinicalBackground.length) {
    kids.push(el('h4', {}, 'Clinical Background'));
    profile.clinicalBackground.forEach((item) => kids.push(el('p', {}, item)));
  }

  return kids;
}

function buildVitals(vitals) {
  if (!vitals || !Object.values(vitals).some(Boolean)) return [];
  return [
    el('h4', {}, 'Vitals'),
    row('BP', vitals.bp),
    row('HR', vitals.hr),
    row('RR', vitals.rr),
    row('Temp', vitals.temp),
    row('O₂ Sat', vitals.o2sat),
    row('Pain', vitals.pain),
  ];
}

function appendRegionalAssessmentSummary(kids, regionalAssessments) {
  if (!regionalAssessments) return;
  if (regionalAssessments.selectedRegions?.length) {
    kids.push(row('Regions Assessed', regionalAssessments.selectedRegions.join(', ')));
  }
  if (regionalAssessments.specialTests && Object.keys(regionalAssessments.specialTests).length) {
    const testRows = Object.values(regionalAssessments.specialTests).map((test) => [
      test.notes || '—',
      dash(test.left),
      dash(test.right),
    ]);
    kids.push(
      el('h4', {}, 'Special Tests'),
      simpleTable(['Test / Notes', 'Left', 'Right'], testRows),
    );
  }
}

function appendStandardizedAssessmentSummary(kids, assessments) {
  const normalized = normalizeStandardizedAssessments(assessments);
  if (!normalized.length) return;
  kids.push(el('h4', {}, 'Standardized Functional Assessments'));
  normalized.forEach((assessment, index) => {
    const title = assessment.title || assessment.instrumentKey || `Assessment ${index + 1}`;
    const score = formatAssessmentScoreSummary(assessment);
    kids.push(row(title, score || assessment.status || 'In progress'));
    if (assessment.assessor) kids.push(row(`${title} - Assessor`, assessment.assessor));
    if (assessment.performedAt) kids.push(row(`${title} - Date`, assessment.performedAt));
    if (assessment.notes) kids.push(row(`${title} - Notes`, assessment.notes));
  });
}

function appendGaitSummary(kids, gait, includeDistance = true) {
  if (!gait || (!gait.pattern && !gait.observations)) return;
  const gaitRows = [row('Device', gait.device)];
  if (includeDistance) {
    gaitRows.push(row('Distance', gait.distance_m ? `${gait.distance_m} m` : ''));
  }
  gaitRows.push(row('Pattern', gait.pattern), row('Observations', gait.observations));
  kids.push(el('h4', {}, 'Gait'), ...gaitRows);
}

function getGoalEntries(plan) {
  const goals = plan.goalsTable || plan.goals;
  if (!goals) return [];
  return Array.isArray(goals)
    ? goals.filter((goal) => goal?.goal || goal?.goalText)
    : Object.values(goals).filter((goal) => goal?.goalText || goal?.goal);
}

function formatGoalEntry(goal) {
  if (typeof goal === 'string') return goal;
  return [goal.goal || goal.goalText || goal.text || '', goal.timeframe, goal.icfDomain]
    .filter(Boolean)
    .join(' | ');
}

function getClinicInterventionEntries(plan) {
  const clinic = Array.isArray(plan.inClinicInterventions)
    ? plan.inClinicInterventions
    : plan.exerciseTable || plan.interventions;
  if (!clinic) return [];
  return Array.isArray(clinic)
    ? clinic.filter((entry) => entry?.intervention || entry?.exerciseText)
    : Object.values(clinic).filter((entry) => entry?.exerciseText);
}

function formatInterventionEntry(entry) {
  if (typeof entry === 'string') return entry;
  return (
    entry.exerciseText || [entry.intervention || '', entry.dosage || ''].filter(Boolean).join(' - ')
  );
}

function getHepRows(plan) {
  if (!Array.isArray(plan.hepInterventions)) return [];
  return plan.hepInterventions
    .filter((entry) => entry?.intervention || entry?.dosage)
    .map((entry, index) => [
      `${index + 1}`,
      [entry.intervention || '', entry.dosage || ''].filter(Boolean).join(' - '),
    ]);
}

function buildObjective(obj) {
  if (!obj) return [];
  const kids = [heading('Objective')];
  if (obj.text) kids.push(el('p', {}, obj.text));
  if (obj.inspection?.visual) kids.push(row('Inspection', obj.inspection.visual));
  if (obj.palpation?.findings) kids.push(row('Palpation', obj.palpation.findings));
  kids.push(...buildVitals(obj.vitals));
  if (obj.neuro?.screening) kids.push(row('Neuro Screening', obj.neuro.screening));
  if (obj.functional?.assessment)
    kids.push(row('Functional Assessment', obj.functional.assessment));
  appendStandardizedAssessmentSummary(kids, obj.standardizedAssessments);
  appendRegionalAssessmentSummary(kids, obj.regionalAssessments);
  appendGaitSummary(kids, obj.gait, true);
  return kids;
}

function buildTopLevelFindings(findings) {
  if (!findings) return [];
  const kids = [];
  kids.push(...buildVitals(findings.vitals));
  appendGaitSummary(kids, findings.gait, false);
  if (findings.outcome_options?.length) {
    kids.push(row('Outcome Measures', joinList(findings.outcome_options)));
  }
  return kids;
}

function buildAssessment(assess) {
  if (!assess) return [];
  const kids = [heading('Assessment')];
  const fields = [
    ['Primary Impairments', assess.primaryImpairments],
    ['Body Functions', assess.bodyFunctions],
    ['Activity Limitations', assess.activityLimitations],
    ['Participation Restrictions', assess.participationRestrictions],
    ['PT Diagnosis', assess.ptDiagnosis],
    ['Prognosis', assess.prognosis],
    ['Prognostic Factors', assess.prognosticFactors],
    ['Clinical Reasoning', assess.clinicalReasoning],
    ['Clinical Impression', assess.clinical_impression],
  ];
  for (const [label, val] of fields) {
    if (val) kids.push(row(label, val));
  }
  // ICF framework (top-level assessment shape)
  const icf = assess.icf_framework;
  if (icf && Object.values(icf).some(Boolean)) {
    kids.push(
      el('h4', {}, 'ICF Framework'),
      row('Body Functions', icf.body_functions),
      row('Activity Limitations', icf.activity_limitations),
      row('Participation Restrictions', icf.participation_restrictions),
    );
  }
  return kids;
}

function buildPlan(plan) {
  if (!plan) return [];
  const kids = [heading('Plan')];
  if (plan.frequency) kids.push(row('Frequency', plan.frequency));
  if (plan.duration) kids.push(row('Duration', plan.duration));
  if (plan.prognosis) kids.push(row('Prognosis', plan.prognosis));
  if (plan.treatmentPlan) {
    kids.push(el('h4', {}, 'Treatment Plan'), el('p', {}, plan.treatmentPlan));
  }
  if (plan.patientEducation) {
    kids.push(el('h4', {}, 'Patient Education'), el('p', {}, plan.patientEducation));
  }
  const goalEntries = getGoalEntries(plan);
  if (goalEntries.length) {
    const goalRows = goalEntries.map((goal, index) => [`${index + 1}`, formatGoalEntry(goal)]);
    kids.push(el('h4', {}, 'Goals'), simpleTable(['#', 'Goal'], goalRows));
  }
  const clinicEntries = getClinicInterventionEntries(plan);
  if (clinicEntries.length) {
    const clinicRows = clinicEntries.map((entry, index) => [
      `${index + 1}`,
      formatInterventionEntry(entry),
    ]);
    kids.push(
      el('h4', {}, 'In-Clinic Interventions'),
      simpleTable(['#', 'Intervention'], clinicRows),
    );
  }
  const hepRows = getHepRows(plan);
  if (hepRows.length) {
    kids.push(el('h4', {}, 'Home Exercise Program'), simpleTable(['#', 'Exercise'], hepRows));
  }
  return kids;
}

function buildBilling(billing) {
  if (!billing) return [];
  const kids = [heading('Billing')];
  // Diagnosis codes
  const dx = billing.diagnosisCodes;
  if (dx?.length) {
    const dxRows = dx.map((d) => [
      d.code,
      d.description || d.label || '—',
      d.isPrimary ? '★ Primary' : '',
    ]);
    kids.push(el('h4', {}, 'Diagnosis Codes'), simpleTable(['Code', 'Description', ''], dxRows));
  }
  // Billing / CPT codes
  const cpt = billing.billingCodes;
  if (cpt?.length) {
    const cptRows = cpt.map((b) => [
      b.code,
      b.linkedDiagnosisCode || '—',
      b.description || b.label || '—',
      b.units ? `×${b.units}` : '',
      b.timeSpent || '',
    ]);
    kids.push(
      el('h4', {}, 'CPT / Billing Codes'),
      simpleTable(['Code', 'Linked ICD-10', 'Description', 'Units', 'Time'], cptRows),
    );
  }
  // Orders / Referrals
  const orders = billing.ordersReferrals;
  if (orders?.length) {
    const ordRows = orders.map((o) => [
      o.type || '—',
      o.linkedDiagnosisCode || '—',
      o.details || '—',
    ]);
    kids.push(
      el('h4', {}, 'Orders / Referrals'),
      simpleTable(['Type', 'Linked ICD-10', 'Details'], ordRows),
    );
  }
  return kids;
}

/* ── main route ───────────────────────────────────────────── */

route('#/preview', async (app, qs) => {
  const caseId = qs.get('case');

  app.replaceChildren();
  const loadingIndicator = el('div', { class: 'panel' }, 'Loading case preview...');
  app.append(loadingIndicator);

  let c;
  try {
    const caseWrapper = await _getCase(caseId);
    if (!caseWrapper) {
      app.replaceChildren();
      app.append(el('div', { class: 'panel' }, [el('h2', {}, 'Case not found')]));
      return;
    }
    c = caseWrapper.caseObj;
  } catch (error) {
    console.error('Failed to load case for preview:', error);
    app.replaceChildren();
    app.append(
      el(
        'div',
        { class: 'panel error' },
        'Error loading case. Please check the console for details.',
      ),
    );
    return;
  }

  app.replaceChildren(); // Clear loading indicator

  // Resolve the eval encounter (richest data source)
  const enc = c.encounters?.eval || {};
  const profile = resolvePatientProfile(c, enc);

  // Collect all section children
  const sections = [
    // ── Header
    el('div', { class: 'flex-between no-print' }, [
      el('h2', {}, c.meta.title),
      el('button', { class: 'btn primary', onClick: printPage }, 'Export PDF (Print)'),
    ]),
    el(
      'div',
      { class: 'small' },
      [
        `Setting: ${dash(c.meta.setting)}`,
        `Diagnosis: ${dash(c.meta.diagnosis)}`,
        `Acuity: ${dash(c.meta.acuity)}`,
        `Regions: ${c.meta.regions?.join(', ') || '—'}`,
      ].join(' • '),
    ),

    // ── Snapshot
    ...buildSnapshot(c.snapshot),

    // ── Canonical patient face sheet
    ...buildPatientProfile(profile),

    // ── Subjective (case-level history + encounter-level detail)
    ...buildHistory(c.history),
    ...buildEncounterSubjective(enc.subjective),

    // ── Objective (encounter-level first, fall back to top-level findings)
    ...(enc.objective ? buildObjective(enc.objective) : []),
    // Top-level findings that may not be in encounter obj
    ...buildTopLevelFindings(c.findings),

    // ── Assessment (encounter-level preferred, fall back to case-level)
    ...buildAssessment(enc.assessment || c.assessment),

    // ── Plan (encounter-level preferred, fall back to case-level)
    ...buildPlan(enc.plan || c.plan),

    // ── Billing
    ...buildBilling(enc.billing),
  ];

  app.append(el('div', { class: 'panel preview-panel' }, sections));
});
