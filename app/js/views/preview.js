import { route } from '../core/router.js';
async function _getCase(id) {
  const { getCase } = await import('../core/store.js');
  return getCase(id);
}
import { el, printPage } from '../ui/utils.js';

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

function buildObjective(obj) {
  if (!obj) return [];
  const kids = [heading('Objective')];
  if (obj.text) kids.push(el('p', {}, obj.text));

  // Inspection + Palpation
  if (obj.inspection?.visual) kids.push(row('Inspection', obj.inspection.visual));
  if (obj.palpation?.findings) kids.push(row('Palpation', obj.palpation.findings));

  // Vitals (encounter‑level or top‑level)
  kids.push(...buildVitals(obj.vitals));

  // Neuro screening
  if (obj.neuro?.screening) kids.push(row('Neuro Screening', obj.neuro.screening));

  // Functional
  if (obj.functional?.assessment)
    kids.push(row('Functional Assessment', obj.functional.assessment));

  // Regional assessments summary
  const ra = obj.regionalAssessments;
  if (ra) {
    if (ra.selectedRegions?.length) {
      kids.push(row('Regions Assessed', ra.selectedRegions.join(', ')));
    }
    // Special tests
    if (ra.specialTests && Object.keys(ra.specialTests).length) {
      const stRows = Object.values(ra.specialTests).map((t) => [
        t.notes || '—',
        dash(t.left),
        dash(t.right),
      ]);
      kids.push(
        el('h4', {}, 'Special Tests'),
        simpleTable(['Test / Notes', 'Left', 'Right'], stRows),
      );
    }
  }

  // Gait
  const gait = obj.gait;
  if (gait && (gait.pattern || gait.observations)) {
    kids.push(
      el('h4', {}, 'Gait'),
      row('Device', gait.device),
      row('Distance', gait.distance_m ? `${gait.distance_m} m` : ''),
      row('Pattern', gait.pattern),
      row('Observations', gait.observations),
    );
  }
  return kids;
}

function buildTopLevelFindings(findings) {
  if (!findings) return [];
  const kids = [];
  kids.push(...buildVitals(findings.vitals));
  const gait = findings.gait;
  if (gait && (gait.pattern || gait.observations)) {
    kids.push(
      el('h4', {}, 'Gait'),
      row('Device', gait.device),
      row('Pattern', gait.pattern),
      row('Observations', gait.observations),
    );
  }
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
  // Goals table
  const gt = plan.goalsTable || plan.goals;
  if (gt) {
    const goalEntries = Array.isArray(gt) ? gt : Object.values(gt).filter((g) => g?.goalText);
    if (goalEntries.length) {
      const goalRows = goalEntries.map((g, i) => [
        `${i + 1}`,
        typeof g === 'string' ? g : g.goalText || g.text || JSON.stringify(g),
      ]);
      kids.push(el('h4', {}, 'Goals'), simpleTable(['#', 'Goal'], goalRows));
    }
  }
  // Exercises table
  const et = plan.exerciseTable || plan.interventions;
  if (et) {
    const exEntries = Array.isArray(et) ? et : Object.values(et).filter((e) => e?.exerciseText);
    if (exEntries.length) {
      const exRows = exEntries.map((e, i) => [
        `${i + 1}`,
        typeof e === 'string' ? e : e.exerciseText || e.text || JSON.stringify(e),
      ]);
      kids.push(el('h4', {}, 'Exercises / Interventions'), simpleTable(['#', 'Exercise'], exRows));
    }
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
