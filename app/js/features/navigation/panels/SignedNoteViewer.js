/**
 * SignedNoteViewer – read-only HTML rendering of a signed note that
 * mirrors the Word-export layout.   Renders inside the detail-panel
 * body as a scrollable document preview.
 *
 * The viewer shows:
 *   1. Patient info header
 *   2. SOAP sections (PT) or Nutrition sections (Dietetics)
 *   3. Signature block
 *   4. Amendments (if any)
 *   5. Action buttons (Amend / Back)
 */

import { el } from '../../../ui/utils.js';
import { getDraftTemplateLabel } from '../../../core/noteCatalog.js';

/* ---- Helpers ---- */

function safe(obj, path, fallback = '') {
  try {
    return path.split('.').reduce((o, k) => o?.[k], obj) ?? fallback;
  } catch {
    return fallback;
  }
}

function fmtDate(d) {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function fmtTimestamp(iso) {
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

function isDieteticsDraft(draft) {
  return !!(
    draft &&
    (draft.nutrition_assessment ||
      draft.nutrition_diagnosis ||
      draft.nutrition_intervention ||
      draft.nutrition_monitoring)
  );
}

/* ---- Section builders ---- */

function sectionHeader(text, level = 1) {
  const tag = level === 1 ? 'h3' : 'h4';
  const cls = level === 1 ? 'signed-note__section-header' : 'signed-note__subsection-header';
  return el(tag, { class: cls }, [text]);
}

function labelValue(label, value) {
  return el('p', { class: 'signed-note__label-value' }, [
    el('strong', {}, [`${label}: `]),
    value || '\u2014 not documented',
  ]);
}

function bodyBlock(text) {
  if (!text || !text.trim()) {
    return el('p', { class: 'signed-note__empty-field' }, ['\u2014 not documented']);
  }
  const lines = text.split('\n');
  return el(
    'div',
    { class: 'signed-note__body' },
    lines.map((ln) => el('p', {}, [ln])),
  );
}

/* ---- Patient info ---- */

function buildPatientInfo(caseData, draft) {
  const name = safe(caseData, 'snapshot.name') || safe(caseData, 'title', 'N/A');
  const dob = safe(caseData, 'snapshot.dob') || safe(caseData, 'patientDOB', '');
  const sex = safe(caseData, 'snapshot.sex') || safe(caseData, 'patientGender', '');
  const age = safe(caseData, 'snapshot.age') || safe(caseData, 'patientAge', '');

  const isDiet = isDieteticsDraft(draft);
  const complaint = isDiet
    ? safe(draft, 'nutrition_diagnosis.priority_diagnosis', 'Not specified')
    : safe(draft, 'subjective.chiefComplaint') ||
      safe(caseData, 'history.chief_complaint', 'Not specified');

  const signedAt = safe(draft, 'meta.signature.signedAt', '');
  const dateLabel = signedAt ? fmtDate(signedAt) : fmtDate(new Date());

  return el('div', { class: 'signed-note__patient-info' }, [
    sectionHeader('Patient Information', 2),
    labelValue('Patient Name', name),
    ...(dob ? [labelValue('DOB', dob)] : []),
    ...(age ? [labelValue('Age', String(age))] : []),
    ...(sex ? [labelValue('Sex', sex)] : []),
    labelValue('Primary Complaint', complaint),
    labelValue('Date of Evaluation', dateLabel),
  ]);
}

/* ---- PT note ---- */

function buildPtSections(draft) {
  const subj = draft.subjective || {};
  const obj = draft.objective || {};
  const parts = [];

  // SUBJECTIVE
  parts.push(sectionHeader('SUBJECTIVE'));
  if (subj.chiefComplaint) parts.push(labelValue('Chief Complaint', subj.chiefComplaint));
  if (subj.hpi) {
    parts.push(el('h4', { class: 'signed-note__subsection-header' }, ['HPI']));
    parts.push(bodyBlock(subj.hpi));
  }
  if (subj.painAssessment) {
    parts.push(el('h4', { class: 'signed-note__subsection-header' }, ['Pain Assessment']));
    parts.push(
      bodyBlock(
        typeof subj.painAssessment === 'string'
          ? subj.painAssessment
          : JSON.stringify(subj.painAssessment, null, 2),
      ),
    );
  }
  const socialHistory = subj.socialHistory || subj.social_history;
  if (socialHistory) {
    parts.push(el('h4', { class: 'signed-note__subsection-header' }, ['Social History']));
    parts.push(
      bodyBlock(
        typeof socialHistory === 'string' ? socialHistory : JSON.stringify(socialHistory, null, 2),
      ),
    );
  }
  const medications = subj.medications || subj.currentMedications;
  if (medications) {
    parts.push(el('h4', { class: 'signed-note__subsection-header' }, ['Medications']));
    parts.push(
      bodyBlock(Array.isArray(medications) ? medications.join(', ') : String(medications)),
    );
  }

  // OBJECTIVE
  parts.push(sectionHeader('OBJECTIVE'));
  if (obj.text) parts.push(bodyBlock(obj.text));
  if (obj.vitalSigns) {
    parts.push(el('h4', { class: 'signed-note__subsection-header' }, ['Vital Signs']));
    parts.push(
      bodyBlock(
        typeof obj.vitalSigns === 'string'
          ? obj.vitalSigns
          : Object.entries(obj.vitalSigns)
              .map(([k, v]) => `${k}: ${v}`)
              .join('\n'),
      ),
    );
  }
  // ROM summary (simplified - full tables would be huge)
  if (obj.rom || obj.combinedRomData) {
    parts.push(el('h4', { class: 'signed-note__subsection-header' }, ['Range of Motion']));
    if (typeof obj.rom === 'string') {
      parts.push(bodyBlock(obj.rom));
    } else {
      parts.push(
        el('p', { class: 'signed-note__hint' }, [
          'ROM data documented \u2014 see exported Word document for full tables.',
        ]),
      );
    }
  }
  if (obj.mmt || obj.strength) {
    parts.push(el('h4', { class: 'signed-note__subsection-header' }, ['Manual Muscle Testing']));
    parts.push(
      el('p', { class: 'signed-note__hint' }, [
        'MMT data documented \u2014 see exported Word document for full tables.',
      ]),
    );
  }
  if (obj.specialTests) {
    parts.push(el('h4', { class: 'signed-note__subsection-header' }, ['Special Tests']));
    parts.push(
      bodyBlock(
        typeof obj.specialTests === 'string'
          ? obj.specialTests
          : JSON.stringify(obj.specialTests, null, 2),
      ),
    );
  }

  // ASSESSMENT
  parts.push(sectionHeader('ASSESSMENT'));
  parts.push(bodyBlock(draft.assessment));

  // GOALS
  if (draft.goals) {
    parts.push(sectionHeader('GOALS'));
    parts.push(
      bodyBlock(
        typeof draft.goals === 'string'
          ? draft.goals
          : Array.isArray(draft.goals)
            ? draft.goals.join('\n')
            : JSON.stringify(draft.goals, null, 2),
      ),
    );
  }

  // PLAN
  parts.push(sectionHeader('PLAN'));
  parts.push(bodyBlock(draft.plan));

  return parts;
}

/* ---- Dietetics note ---- */

function hasContent(val) {
  if (val == null) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return true;
}

function buildDieteticsSections(draft) {
  const parts = [];
  const sections = [
    [
      'NUTRITION ASSESSMENT',
      draft.nutrition_assessment,
      [
        ['Food/Nutrition History', 'food_nutrition_history'],
        ['Anthropometric', 'anthropometric'],
        ['Biochemical', 'biochemical'],
        ['Nutrition-Focused Physical Exam', 'nutrition_focused_pe'],
        ['Client History', 'client_history'],
        ['Malnutrition Risk', 'malnutrition_risk'],
        ['Estimated Needs', 'estimated_needs'],
      ],
    ],
    [
      'NUTRITION INTERVENTION',
      draft.nutrition_intervention,
      [
        ['Intervention Strategy', 'strategy'],
        ['Diet Order', 'diet_order'],
        ['Goals', 'goals'],
        ['Education Topics', 'education_topics'],
        ['Counseling Notes', 'counseling_notes'],
        ['Coordination of Care', 'coordination'],
      ],
    ],
    [
      'NUTRITION MONITORING & EVALUATION',
      draft.nutrition_monitoring,
      [
        ['Indicators to Monitor', 'indicators'],
        ['Criteria for Follow-up', 'criteria'],
        ['Outcomes', 'outcomes'],
        ['Follow-Up Plan', 'follow_up_plan'],
      ],
    ],
  ];

  for (const [heading, source, rows] of sections) {
    if (!source) continue;
    const populated = rows.filter(([, key]) => hasContent(source[key]));
    if (!populated.length) continue;

    parts.push(sectionHeader(heading));
    for (const [label, key] of populated) {
      parts.push(labelValue(label, source[key]));
    }
  }

  // Nutrition Diagnosis (PES statements)
  const diag = draft.nutrition_diagnosis || {};
  const pes = Array.isArray(diag.pes_statements) ? diag.pes_statements : [];
  const hasPes = pes.some(
    (r) => hasContent(r?.problem) || hasContent(r?.etiology) || hasContent(r?.signs_symptoms),
  );
  const hasDiag = hasPes || hasContent(diag.priority_diagnosis);

  if (hasDiag) {
    parts.push(sectionHeader('NUTRITION DIAGNOSIS'));
    for (let i = 0; i < pes.length; i++) {
      const row = pes[i];
      if (
        !hasContent(row?.problem) &&
        !hasContent(row?.etiology) &&
        !hasContent(row?.signs_symptoms)
      )
        continue;
      const stmt =
        `P: ${row?.problem || ''}; E: ${row?.etiology || ''}; S: ${row?.signs_symptoms || ''}`.trim();
      parts.push(labelValue(`PES #${i + 1}`, stmt));
    }
    if (hasContent(diag.priority_diagnosis)) {
      parts.push(labelValue('Priority Diagnosis', diag.priority_diagnosis));
    }
  }

  // Scheduling
  const sched = draft.scheduling || {};
  const appts = Array.isArray(sched.appointments) ? sched.appointments.length : 0;
  const rounds = Array.isArray(sched.mealRounds) ? sched.mealRounds.length : 0;
  if (appts || rounds) {
    parts.push(sectionHeader('SCHEDULING'));
    if (appts) parts.push(labelValue('Appointments', `${appts} scheduled`));
    if (rounds) parts.push(labelValue('Meal Rounds', `${rounds} scheduled`));
  }

  // Billing
  const bill = draft.billing || {};
  const hasBilling =
    hasContent(bill.cpt_code) ||
    hasContent(bill.units) ||
    hasContent(bill.time_minutes) ||
    hasContent(bill.diagnosis_codes) ||
    hasContent(bill.justification);
  if (hasBilling) {
    parts.push(sectionHeader('BILLING'));
    if (hasContent(bill.cpt_code)) parts.push(labelValue('CPT Code', bill.cpt_code));
    if (hasContent(bill.units)) parts.push(labelValue('Units', String(bill.units)));
    if (hasContent(bill.time_minutes))
      parts.push(labelValue('Time (minutes)', String(bill.time_minutes)));
    if (hasContent(bill.diagnosis_codes)) {
      const dxStr = Array.isArray(bill.diagnosis_codes)
        ? bill.diagnosis_codes.join(', ')
        : String(bill.diagnosis_codes);
      parts.push(labelValue('Diagnosis Codes', dxStr));
    }
    if (hasContent(bill.justification))
      parts.push(labelValue('Medical Necessity', bill.justification));
  }

  return parts;
}

/* ---- Signature block ---- */

function buildSignatureBlock(draft) {
  const sig = draft?.meta?.signature;
  if (!sig) return null;

  return el('div', { class: 'signed-note__signature-block' }, [
    el('div', { class: 'signed-note__sig-line' }),
    el('p', { class: 'signed-note__sig-name' }, [sig.name || 'Unsigned']),
    ...(sig.title ? [el('p', { class: 'signed-note__sig-title' }, [sig.title])] : []),
    el('p', { class: 'signed-note__sig-date' }, [
      `Signed: ${sig.signedAt ? fmtDate(sig.signedAt) : 'N/A'}`,
    ]),
  ]);
}

/* ---- Amendments ---- */

function buildAmendments(draft) {
  if (!draft.amendments || !draft.amendments.length) return null;
  const items = draft.amendments.map((a) =>
    el('li', { class: 'signed-note__amendment-entry' }, [
      el('span', { class: 'signed-note__amendment-date' }, [fmtTimestamp(a.timestamp)]),
      el('span', { class: 'signed-note__amendment-text' }, [a.text]),
    ]),
  );
  return el('div', { class: 'signed-note__amendments' }, [
    el('h4', { class: 'signed-note__subsection-header' }, ['Amendments']),
    el('ul', { class: 'signed-note__amendment-list' }, items),
  ]);
}

/* ---- Public API ---- */

/**
 * Render a read-only view of a signed note inside `container`.
 *
 * @param {HTMLElement} container – the detail-panel body
 * @param {Object}      caseObj  – full case object (patient info)
 * @param {Object}      draft    – draft data from storage
 * @param {Object}      opts
 * @param {Function}    [opts.onAmend]  – called when user clicks "Amend"
 * @param {Function}    [opts.onBack]   – called when user clicks "Back to list"
 */
export function renderSignedNoteViewer(container, caseObj, draft, opts = {}) {
  container.replaceChildren();

  const isDiet = isDieteticsDraft(draft);
  const noteType = getDraftTemplateLabel(draft);
  const hasAmendments = draft.amendments && draft.amendments.length > 0;

  const doc = el(
    'div',
    { class: 'signed-note' },
    [
      // Document title bar
      el('div', { class: 'signed-note__title-bar' }, [
        el('span', { class: 'signed-note__type' }, [noteType]),
        el(
          'span',
          {
            class: `signed-note__status-pill ${hasAmendments ? 'signed-note__status-pill--amended' : 'signed-note__status-pill--signed'}`,
          },
          [hasAmendments ? 'AMENDED' : 'SIGNED'],
        ),
      ]),

      // Patient info
      buildPatientInfo(caseObj, draft),

      // Clinical sections
      ...(isDiet ? buildDieteticsSections(draft) : buildPtSections(draft)),

      // Signature block
      buildSignatureBlock(draft),

      // Amendments
      buildAmendments(draft),

      // Action buttons
      el('div', { class: 'signed-note__actions' }, [
        ...(opts.onBack
          ? [
              el(
                'button',
                {
                  class: 'btn btn--sm btn--outline',
                  onClick: opts.onBack,
                },
                '\u2190 Back',
              ),
            ]
          : []),
        ...(opts.onAmend
          ? [
              el(
                'button',
                {
                  class: 'btn btn--sm primary',
                  onClick: opts.onAmend,
                  title: 'Unlock this note for amendment — will require re-signing',
                },
                '\uD83D\uDD13 Amend Note',
              ),
            ]
          : []),
      ]),
    ].filter(Boolean),
  );

  container.appendChild(doc);
}
