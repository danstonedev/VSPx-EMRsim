/**
 * NotePreviewModal – full-screen modal showing the note rendered like
 * the final .docx export, with **only populated fields** shown and
 * those fields editable for last-minute tweaks.
 *
 * Modes:
 *   'sign'   – opened from Sign & Export  (confirm → signature dialog)
 *   'amend'  – opened from My Notes Amend (confirm → save & re-sign)
 *
 * Empty sections are omitted, mirroring the Word export behaviour.
 */

import { el } from '../../../ui/utils.js';
import {
  getPatientDisplayName,
  getPatientDOB,
  getPatientSex,
  getCaseInfo,
} from '../../../views/CaseEditorUtils.js';

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

function isDieteticsDraft(draft) {
  return !!(
    draft &&
    (draft.nutrition_assessment ||
      draft.nutrition_diagnosis ||
      draft.nutrition_intervention ||
      draft.nutrition_monitoring)
  );
}

/** True if v has meaningful text content */
function hasContent(v) {
  if (!v) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.some(hasContent);
  if (typeof v === 'object') return Object.values(v).some(hasContent);
  return true;
}

function autoResize(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}

/* ---- Editable field factories ---- */

/** Multi-line editable textarea (auto-resizes) */
function editableField(value, opts = {}) {
  const { rows = 1 } = opts;
  const ta = el('textarea', {
    class: 'note-preview__field',
    rows: String(rows),
  });
  ta.value = value || '';
  ta.addEventListener('input', () => autoResize(ta));
  return ta;
}

/** Single-line editable input */
function editableInput(value) {
  const inp = el('input', { type: 'text', class: 'note-preview__input' });
  inp.value = value || '';
  return inp;
}

/* ---- Layout helpers ---- */

function sectionHeader(text, level = 1) {
  const tag = level === 1 ? 'h3' : 'h4';
  const cls = level === 1 ? 'signed-note__section-header' : 'signed-note__subsection-header';
  return el(tag, { class: cls }, [text]);
}

/** Read-only label: value (same line, matches export/viewer) */
function labelValue(label, value) {
  return el('p', { class: 'signed-note__label-value' }, [
    el('strong', {}, [`${label}: `]),
    value || '',
  ]);
}

/**
 * Inline-editable label row: bold label on the left, editable input inline.
 * Mirrors the export's "Label: Value" format but the value is an <input>.
 */
function editableLabelRow(label, inputEl) {
  return el('div', { class: 'note-preview__inline-row' }, [
    el('strong', { class: 'note-preview__inline-label' }, [`${label}: `]),
    inputEl,
  ]);
}

/**
 * Block-editable label row: bold label above, textarea below.
 * For longer content like HPI, assessment, plan.
 */
function editableLabelBlock(label, textareaEl) {
  return el('div', { class: 'note-preview__block-row' }, [
    el('strong', { class: 'note-preview__block-label' }, [`${label}:`]),
    textareaEl,
  ]);
}

/* ---- Patient info (read-only, always shown) ---- */

function buildPatientInfo(caseData, draft) {
  const subj = draft?.subjective || {};
  const caseInfo = getCaseInfo(caseData || {});

  const name = subj.patientName || getPatientDisplayName(caseData || {}) || 'N/A';
  const dob = subj.patientBirthday || getPatientDOB(caseData || {}) || '';
  const sex = subj.patientGender || getPatientSex(caseData || {}) || '';
  const age = subj.patientAge || caseInfo.age || '';

  const isDiet = isDieteticsDraft(draft);
  const complaint = isDiet
    ? safe(draft, 'nutrition_diagnosis.priority_diagnosis', '')
    : safe(draft, 'subjective.chiefComplaint') || safe(caseData, 'history.chief_complaint', '');

  const items = [labelValue('Patient Name', name)];
  if (dob) items.push(labelValue('DOB', dob));
  if (age) items.push(labelValue('Age', String(age)));
  if (sex) items.push(labelValue('Sex', sex));
  if (complaint) items.push(labelValue('Primary Complaint', complaint));
  items.push(labelValue('Date of Evaluation', fmtDate(new Date())));

  return el('div', { class: 'signed-note__patient-info' }, [
    sectionHeader('Patient Information', 2),
    ...items,
  ]);
}

/* ---- PT sections (only populated fields) ---- */

function buildEditablePtSections(draft) {
  const subj = draft.subjective || {};
  const obj = draft.objective || {};
  const fields = {};
  const parts = [];

  // ── SUBJECTIVE ──
  const hasSubjective =
    hasContent(subj.chiefComplaint) ||
    hasContent(subj.hpi) ||
    hasContent(subj.painAssessment) ||
    hasContent(subj.socialHistory || subj.social_history) ||
    hasContent(subj.medications || subj.currentMedications);

  if (hasSubjective) {
    parts.push(sectionHeader('SUBJECTIVE'));

    if (hasContent(subj.chiefComplaint)) {
      fields.chiefComplaint = editableInput(subj.chiefComplaint);
      parts.push(editableLabelRow('Chief Complaint', fields.chiefComplaint));
    }
    if (hasContent(subj.hpi)) {
      fields.hpi = editableField(subj.hpi, { rows: 2 });
      parts.push(editableLabelBlock('HPI', fields.hpi));
    }

    const painRaw = subj.painAssessment;
    if (hasContent(painRaw)) {
      if (typeof painRaw === 'string') {
        fields.painAssessment = editableField(painRaw);
        parts.push(editableLabelBlock('Pain Assessment', fields.painAssessment));
      } else {
        parts.push(labelValue('Pain Assessment', 'Documented (complex format)'));
      }
    }

    const socialRaw = subj.socialHistory || subj.social_history || '';
    if (hasContent(socialRaw)) {
      if (typeof socialRaw === 'string') {
        fields.socialHistory = editableField(socialRaw);
        parts.push(editableLabelBlock('Social History', fields.socialHistory));
      } else {
        parts.push(labelValue('Social History', 'Documented (complex format)'));
      }
    }

    const medsRaw = subj.medications || subj.currentMedications || '';
    if (hasContent(medsRaw)) {
      const medsStr = Array.isArray(medsRaw) ? medsRaw.join(', ') : String(medsRaw);
      fields.medications = editableInput(medsStr);
      parts.push(editableLabelRow('Medications', fields.medications));
    }
  }

  // ── OBJECTIVE ──
  const hasObjective =
    hasContent(obj.text) ||
    hasContent(obj.vitalSigns) ||
    hasContent(obj.rom || obj.combinedRomData) ||
    hasContent(obj.mmt || obj.strength) ||
    hasContent(obj.specialTests);

  if (hasObjective) {
    parts.push(sectionHeader('OBJECTIVE'));

    if (hasContent(obj.text)) {
      fields.objectiveText = editableField(obj.text, { rows: 2 });
      parts.push(editableLabelBlock('Findings', fields.objectiveText));
    }
    if (hasContent(obj.vitalSigns)) {
      const vitalsText =
        typeof obj.vitalSigns === 'string'
          ? obj.vitalSigns
          : Object.entries(obj.vitalSigns)
              .map(([k, v]) => `${k}: ${v}`)
              .join('\n');
      fields.vitalSigns = editableField(vitalsText);
      parts.push(editableLabelBlock('Vital Signs', fields.vitalSigns));
    }
    if (hasContent(obj.rom || obj.combinedRomData)) {
      parts.push(labelValue('Range of Motion', 'Documented \u2014 see Word export for tables'));
    }
    if (hasContent(obj.mmt || obj.strength)) {
      parts.push(
        labelValue('Manual Muscle Testing', 'Documented \u2014 see Word export for tables'),
      );
    }
    if (hasContent(obj.specialTests)) {
      if (typeof obj.specialTests === 'string') {
        fields.specialTests = editableField(obj.specialTests);
        parts.push(editableLabelBlock('Special Tests', fields.specialTests));
      } else {
        parts.push(labelValue('Special Tests', 'Documented (complex format)'));
      }
    }
  }

  // ── ASSESSMENT ──
  if (hasContent(draft.assessment)) {
    parts.push(sectionHeader('ASSESSMENT'));
    fields.assessment = editableField(draft.assessment, { rows: 2 });
    parts.push(fields.assessment);
  }

  // ── GOALS ──
  if (hasContent(draft.goals)) {
    parts.push(sectionHeader('GOALS'));
    const goalsText =
      typeof draft.goals === 'string'
        ? draft.goals
        : Array.isArray(draft.goals)
          ? draft.goals.join('\n')
          : '';
    fields.goals = editableField(goalsText);
    parts.push(fields.goals);
  }

  // ── PLAN ──
  if (hasContent(draft.plan)) {
    parts.push(sectionHeader('PLAN'));
    fields.plan = editableField(typeof draft.plan === 'string' ? draft.plan : '', { rows: 2 });
    parts.push(fields.plan);
  }

  function collect() {
    const updates = {};
    if (hasSubjective) {
      updates.subjective = { ...subj };
      if (fields.chiefComplaint)
        updates.subjective.chiefComplaint = fields.chiefComplaint.value.trim();
      if (fields.hpi) updates.subjective.hpi = fields.hpi.value.trim();
      if (fields.painAssessment)
        updates.subjective.painAssessment = fields.painAssessment.value.trim();
      if (fields.socialHistory)
        updates.subjective.socialHistory = fields.socialHistory.value.trim();
      if (fields.medications) updates.subjective.medications = fields.medications.value.trim();
    }
    if (hasObjective) {
      updates.objective = { ...obj };
      if (fields.objectiveText) updates.objective.text = fields.objectiveText.value.trim();
      if (fields.vitalSigns) updates.objective.vitalSigns = fields.vitalSigns.value.trim();
      if (fields.specialTests) updates.objective.specialTests = fields.specialTests.value.trim();
    }
    if (fields.assessment) updates.assessment = fields.assessment.value.trim();
    if (fields.goals) updates.goals = fields.goals.value.trim();
    if (fields.plan) updates.plan = fields.plan.value.trim();
    return updates;
  }

  return { parts, collect };
}

/* ---- Dietetics sections (only populated fields) ---- */

function buildEditableDieteticsSections(draft) {
  const fields = {};
  const parts = [];

  /* Field definitions aligned with document-export.js keys */
  const sections = [
    [
      'NUTRITION ASSESSMENT',
      'nutrition_assessment',
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
      'nutrition_intervention',
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
      'nutrition_monitoring',
      [
        ['Indicators to Monitor', 'indicators'],
        ['Criteria for Follow-up', 'criteria'],
        ['Outcomes', 'outcomes'],
        ['Follow-Up Plan', 'follow_up_plan'],
      ],
    ],
  ];

  for (const [heading, draftKey, rows] of sections) {
    const source = draft[draftKey] || {};
    const populated = rows.filter(([, fieldKey]) => hasContent(source[fieldKey]));
    if (!populated.length) continue;

    parts.push(sectionHeader(heading));
    for (const [label, fieldKey] of populated) {
      const fk = `${draftKey}.${fieldKey}`;
      fields[fk] = editableField(source[fieldKey]);
      parts.push(editableLabelBlock(label, fields[fk]));
    }
  }

  // ── Nutrition Diagnosis – PES statements ──
  const diag = draft.nutrition_diagnosis || {};
  const pes = Array.isArray(diag.pes_statements) ? diag.pes_statements : [];
  const hasPes = pes.some(
    (r) => hasContent(r?.problem) || hasContent(r?.etiology) || hasContent(r?.signs_symptoms),
  );
  const hasDiag = hasPes || hasContent(diag.priority_diagnosis);

  if (hasDiag) {
    parts.push(sectionHeader('NUTRITION DIAGNOSIS'));

    for (let i = 0; i < pes.length; i++) {
      const row = pes[i] || {};
      if (!hasContent(row.problem) && !hasContent(row.etiology) && !hasContent(row.signs_symptoms))
        continue;
      parts.push(el('h4', { class: 'signed-note__subsection-header' }, [`PES #${i + 1}`]));
      if (hasContent(row.problem)) {
        fields[`pes_${i}_problem`] = editableInput(row.problem);
        parts.push(editableLabelRow('Problem', fields[`pes_${i}_problem`]));
      }
      if (hasContent(row.etiology)) {
        fields[`pes_${i}_etiology`] = editableInput(row.etiology);
        parts.push(editableLabelRow('Etiology', fields[`pes_${i}_etiology`]));
      }
      if (hasContent(row.signs_symptoms)) {
        fields[`pes_${i}_signs`] = editableInput(row.signs_symptoms);
        parts.push(editableLabelRow('Signs/Symptoms', fields[`pes_${i}_signs`]));
      }
    }

    if (hasContent(diag.priority_diagnosis)) {
      fields.priorityDiagnosis = editableInput(diag.priority_diagnosis);
      parts.push(editableLabelRow('Priority Diagnosis', fields.priorityDiagnosis));
    }
  }

  // ── Scheduling (read-only counts) ──
  const sched = draft.scheduling || {};
  const appts = Array.isArray(sched.appointments) ? sched.appointments.length : 0;
  const rounds = Array.isArray(sched.mealRounds) ? sched.mealRounds.length : 0;
  if (appts || rounds) {
    parts.push(sectionHeader('SCHEDULING'));
    if (appts) parts.push(labelValue('Appointments', `${appts} scheduled`));
    if (rounds) parts.push(labelValue('Meal Rounds', `${rounds} scheduled`));
  }

  // ── Billing ──
  const bill = draft.billing || {};
  const hasBilling =
    hasContent(bill.cpt_code) ||
    hasContent(bill.units) ||
    hasContent(bill.time_minutes) ||
    hasContent(bill.diagnosis_codes) ||
    hasContent(bill.justification);
  if (hasBilling) {
    parts.push(sectionHeader('BILLING'));
    if (hasContent(bill.cpt_code)) {
      fields['billing.cpt_code'] = editableInput(bill.cpt_code);
      parts.push(editableLabelRow('CPT Code', fields['billing.cpt_code']));
    }
    if (hasContent(bill.units)) {
      fields['billing.units'] = editableInput(String(bill.units));
      parts.push(editableLabelRow('Units', fields['billing.units']));
    }
    if (hasContent(bill.time_minutes)) {
      fields['billing.time_minutes'] = editableInput(String(bill.time_minutes));
      parts.push(editableLabelRow('Time (minutes)', fields['billing.time_minutes']));
    }
    if (hasContent(bill.diagnosis_codes)) {
      const dxStr = Array.isArray(bill.diagnosis_codes)
        ? bill.diagnosis_codes.join(', ')
        : String(bill.diagnosis_codes);
      fields['billing.diagnosis_codes'] = editableInput(dxStr);
      parts.push(editableLabelRow('Diagnosis Codes', fields['billing.diagnosis_codes']));
    }
    if (hasContent(bill.justification)) {
      fields['billing.justification'] = editableField(bill.justification);
      parts.push(editableLabelBlock('Medical Necessity', fields['billing.justification']));
    }
  }

  const pesCount = pes.length;
  function collect() {
    const updates = {};
    for (const [, draftKey, rows] of sections) {
      const src = draft[draftKey] || {};
      const patched = { ...src };
      let changed = false;
      for (const [, fieldKey] of rows) {
        const fk = `${draftKey}.${fieldKey}`;
        if (fields[fk]) {
          patched[fieldKey] = fields[fk].value.trim();
          changed = true;
        }
      }
      if (changed) updates[draftKey] = patched;
    }
    if (hasDiag) {
      const pesStatements = [];
      for (let i = 0; i < pesCount; i++) {
        const orig = pes[i] || {};
        pesStatements.push({
          problem: fields[`pes_${i}_problem`]?.value?.trim() ?? orig.problem ?? '',
          etiology: fields[`pes_${i}_etiology`]?.value?.trim() ?? orig.etiology ?? '',
          signs_symptoms: fields[`pes_${i}_signs`]?.value?.trim() ?? orig.signs_symptoms ?? '',
        });
      }
      updates.nutrition_diagnosis = {
        ...(draft.nutrition_diagnosis || {}),
        pes_statements: pesStatements,
        priority_diagnosis:
          fields.priorityDiagnosis?.value?.trim() ?? diag.priority_diagnosis ?? '',
      };
    }
    if (hasBilling) {
      const b = { ...(draft.billing || {}) };
      if (fields['billing.cpt_code']) b.cpt_code = fields['billing.cpt_code'].value.trim();
      if (fields['billing.units']) b.units = fields['billing.units'].value.trim();
      if (fields['billing.time_minutes'])
        b.time_minutes = fields['billing.time_minutes'].value.trim();
      if (fields['billing.diagnosis_codes']) {
        b.diagnosis_codes = fields['billing.diagnosis_codes'].value
          .trim()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (fields['billing.justification'])
        b.justification = fields['billing.justification'].value.trim();
      updates.billing = b;
    }
    return updates;
  }

  return { parts, collect };
}

/* ---- Amendments (read-only) ---- */

function buildAmendments(draft) {
  if (!draft.amendments || !draft.amendments.length) return null;
  const items = draft.amendments.map((a) => {
    let ts = '';
    try {
      ts = new Date(a.timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      ts = a.timestamp || '';
    }
    return el('li', { class: 'signed-note__amendment-entry' }, [
      el('span', { class: 'signed-note__amendment-date' }, [ts]),
      el('span', { class: 'signed-note__amendment-text' }, [a.text]),
    ]);
  });
  return el('div', { class: 'signed-note__amendments' }, [
    el('h4', { class: 'signed-note__subsection-header' }, ['Amendments']),
    el('ul', { class: 'signed-note__amendment-list' }, items),
  ]);
}

/* ---- Focus trap ---- */

function trapFocus(container, onEscape) {
  function handle(e) {
    if (e.key === 'Tab') {
      const focusable = Array.from(
        container.querySelectorAll('button, input, textarea, [tabindex]'),
      ).filter((node) => !node.disabled && node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === 'Escape') {
      onEscape?.();
    }
  }
  container.addEventListener('keydown', handle);
  return () => container.removeEventListener('keydown', handle);
}

/* ---- CSS injection (once) ---- */

function injectStyles() {
  if (document.getElementById('note-preview-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'note-preview-modal-styles';
  style.textContent = `
  .note-preview-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center;
    z-index: var(--z-modal, 10000);
    padding: 24px;
    opacity: 0;
    transition: opacity 280ms ease;
  }
  .note-preview-overlay.is-open { opacity: 1; }

  .note-preview-modal {
    background: var(--surface, #fff);
    color: var(--text, #111);
    width: min(820px, 100%);
    max-height: calc(100vh - 48px);
    border-radius: var(--radius-lg, 12px);
    box-shadow: var(--shadow-2, 0 8px 32px rgba(0,0,0,.4));
    display: flex; flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--border, #ccc);
    opacity: 0; transform: translateY(12px);
    transition: opacity 280ms ease, transform 260ms ease;
  }
  .note-preview-modal.is-open { opacity: 1; transform: translateY(0); }

  @media (prefers-reduced-motion: reduce) {
    .note-preview-overlay, .note-preview-modal {
      transition: none !important; transform: none !important;
    }
  }

  /* Scrollable document body */
  .note-preview-modal > .signed-note {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 24px 28px 16px;
  }

  /* PREVIEW badge in title bar */
  .note-preview__badge {
    background: var(--warning, #f57c00);
    color: #fff;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .note-preview__badge--amend {
    background: var(--amend, #e65100);
  }

  /* Editable textarea */
  .note-preview__field {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--border, #ddd);
    border-radius: var(--radius, 6px);
    font: inherit;
    font-family: 'Calibri', 'Arial', sans-serif;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text, #111);
    background: var(--input-bg, #fafafa);
    resize: none;
    overflow: hidden;
    transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
  }
  .note-preview__field:focus {
    outline: none;
    border-color: var(--accent, #009a44);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent, #009a44) 25%, transparent);
    background: var(--surface, #fff);
  }

  /* Editable single-line input */
  .note-preview__input {
    display: block;
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--border, #ddd);
    border-radius: var(--radius, 6px);
    font: inherit;
    font-family: 'Calibri', 'Arial', sans-serif;
    font-size: 0.95rem;
    color: var(--text, #111);
    background: var(--input-bg, #fafafa);
    transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
  }
  .note-preview__input:focus {
    outline: none;
    border-color: var(--accent, #009a44);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent, #009a44) 25%, transparent);
    background: var(--surface, #fff);
  }

  /* ── Inline row: Label + input on same line (matches export inline format) ── */
  .note-preview__inline-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin: 4px 0 4px 16px;
    font-size: 0.82rem;
  }
  .note-preview__inline-label {
    flex: 0 0 auto;
    font-weight: 700;
    white-space: nowrap;
  }
  .note-preview__inline-row .note-preview__input {
    flex: 1 1 auto;
    font-size: 0.82rem;
    padding: 3px 6px;
    border: 1px dashed var(--border, #ccc);
    border-radius: 3px;
    background: transparent;
  }
  .note-preview__inline-row .note-preview__input:focus {
    border-style: solid;
    border-color: var(--accent, #009a44);
    background: var(--surface, #fff);
  }

  /* ── Block row: Label above textarea (for longer content) ── */
  .note-preview__block-row {
    margin: 8px 0 4px 16px;
    font-size: 0.82rem;
  }
  .note-preview__block-label {
    font-weight: 700;
    margin-bottom: 4px;
  }
  .note-preview__block-row .note-preview__field {
    font-size: 0.82rem;
    padding: 5px 8px;
    border: 1px dashed var(--border, #ccc);
    border-radius: 3px;
    background: transparent;
  }
  .note-preview__block-row .note-preview__field:focus {
    border-style: solid;
    border-color: var(--accent, #009a44);
    background: var(--surface, #fff);
  }

  /* Sticky action bar */
  .note-preview__actions {
    flex: 0 0 auto;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 28px;
    border-top: 1px solid var(--border, #e0e0e0);
    background: var(--surface-secondary, #f5f5f5);
  }

  @media (max-width: 600px) {
    .note-preview-overlay { padding: 8px; }
    .note-preview-modal { max-height: 100vh; border-radius: 8px; }
    .note-preview-modal > .signed-note { padding: 16px; }
    .note-preview__actions { padding: 12px 16px; flex-wrap: wrap; }
  }
  `;
  document.head.appendChild(style);
}

/* ==================================================================
 *  Public API
 * ================================================================== */

/**
 * Open a full-screen preview of the note for review / last-minute edits.
 *
 * @param {Object}   opts
 * @param {Object}   opts.caseData      – case/patient object
 * @param {Object}   opts.draft         – current draft data
 * @param {Function} opts.onConfirmSign – called with collected edits when
 *                                        user is ready to proceed
 * @param {Function} [opts.onCancel]    – called when user dismisses
 * @param {'sign'|'amend'} [opts.mode='sign'] – controls badge & button text
 */
export function openNotePreviewModal({ caseData, draft, onConfirmSign, onCancel, mode = 'sign' }) {
  injectStyles();
  const priorFocus = document.activeElement;
  const isAmend = mode === 'amend';

  const isDiet = isDieteticsDraft(draft);
  const patientName = safe(caseData, 'snapshot.name') || safe(caseData, 'title', '');
  const noteType = isDiet ? 'Dietetics Note' : 'PT Evaluation';
  const titleText = patientName ? `${noteType} \u2014 ${patientName}` : noteType;

  const { parts, collect } = isDiet
    ? buildEditableDieteticsSections(draft)
    : buildEditablePtSections(draft);

  const overlay = el('div', { class: 'note-preview-overlay', role: 'presentation' });
  const modal = el('div', {
    class: 'note-preview-modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Note preview before signing',
  });

  /* ---- Close logic ---- */

  function close(afterClose) {
    overlay.classList.remove('is-open');
    modal.classList.remove('is-open');
    const remove = () => {
      try {
        overlay.remove();
      } catch {
        /* noop */
      }
      detachTrap();
      priorFocus?.focus?.();
      afterClose?.();
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return remove();
    overlay.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 400); // safety fallback
  }

  function handleSign() {
    const errorBox = modal.querySelector('.note-preview-error');
    if (errorBox) errorBox.textContent = '';

    // Check validation of signature if fields exist
    const nameInput = modal.querySelector('#note_preview_sig_name');
    const titleInput = modal.querySelector('#note_preview_sig_title');

    let signature = null;
    if (nameInput) {
      const userVal = nameInput.value.trim();
      if (!userVal) {
        if (errorBox) errorBox.textContent = 'Name is required to sign the note.';
        nameInput.focus();
        return;
      }
      localStorage.setItem('pt_emr_signature_name', userVal);
      const titleVal = titleInput ? titleInput.value.trim() : '';
      if (titleVal) {
        localStorage.setItem('pt_emr_signature_title', titleVal);
      } else {
        localStorage.removeItem('pt_emr_signature_title');
      }
      signature = {
        name: userVal,
        title: titleVal || undefined,
        signedAt: new Date().toISOString(),
        version: 1,
      };
    }

    const updates = collect();

    // UI Loading State on the button
    const btn = modal.querySelector('.btn.primary');
    const originalText = btn.textContent;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Processing...';
    }

    const onConfirmPromise = onConfirmSign?.(updates, signature);
    if (onConfirmPromise instanceof Promise) {
      onConfirmPromise
        .then(() => close())
        .catch((e) => {
          console.error('Signing failed:', e);
          if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
          }
          if (errorBox) errorBox.textContent = 'Failed to process document. Please try again.';
        });
    } else {
      close(() => onConfirmPromise);
    }
  }

  function handleCancel() {
    close(() => onCancel?.());
  }

  /* ---- Build document body ---- */

  const amendments = buildAmendments(draft);

  const savedName =
    localStorage.getItem('pt_emr_signature_name') || draft?.meta?.signature?.name || '';
  const savedTitle =
    localStorage.getItem('pt_emr_signature_title') || draft?.meta?.signature?.title || 'SPT';

  const sigBlock = el(
    'div',
    {
      class: 'note-preview__signature-block',
      style: 'margin-top: 32px; padding-top: 24px; border-top: 2px solid var(--border, #ccc);',
    },
    [
      el('h3', { class: 'signed-note__section-header', style: 'margin: 0 0 16px;' }, [
        isAmend ? 'Re-sign Note' : 'Sign Evaluation',
      ]),
      el(
        'div',
        {
          class: 'note-preview__field-row',
          style: 'display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;',
        },
        [
          el(
            'label',
            {
              style:
                'font-weight: 600; font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary, #666);',
            },
            ['Clinician Name *'],
          ),
          el('input', {
            id: 'note_preview_sig_name',
            type: 'text',
            class: 'note-preview__input note-preview__field',
            required: true,
            value: savedName,
            placeholder: 'First Last',
          }),
        ],
      ),
      el(
        'div',
        {
          class: 'note-preview__field-row',
          style: 'display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;',
        },
        [
          el(
            'label',
            {
              style:
                'font-weight: 600; font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary, #666);',
            },
            ['Title / Credentials'],
          ),
          el('input', {
            id: 'note_preview_sig_title',
            type: 'text',
            class: 'note-preview__input note-preview__field',
            value: savedTitle,
            placeholder: 'SPT, PT, etc.',
          }),
        ],
      ),
      el(
        'div',
        {
          class: 'note-preview-error',
          style: 'color: var(--danger, #b00020); font-size: 0.85rem; min-height: 20px;',
        },
        [''],
      ),
    ],
  );

  const doc = el(
    'div',
    { class: 'signed-note' },
    [
      // Title bar
      el('div', { class: 'signed-note__title-bar' }, [
        el('span', { class: 'signed-note__type' }, [titleText]),
        el(
          'span',
          { class: `note-preview__badge${isAmend ? ' note-preview__badge--amend' : ''}` },
          [isAmend ? 'AMENDING \u2014 Review & Edit' : 'PREVIEW \u2014 Review & Edit'],
        ),
      ]),
      buildPatientInfo(caseData, draft),
      ...parts,
      amendments,
      sigBlock,
    ].filter(Boolean),
  );

  const actions = el('div', { class: 'note-preview__actions' }, [
    el(
      'button',
      {
        class: 'btn btn--outline',
        onClick: handleCancel,
      },
      isAmend ? '\u2190 Cancel' : '\u2190 Back to Editor',
    ),
    el(
      'button',
      {
        class: 'btn primary',
        onClick: handleSign,
      },
      isAmend ? 'Save & Re-sign' : 'Sign & Export',
    ),
  ]);

  modal.append(doc, actions);
  overlay.append(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) handleCancel();
  });
  document.body.appendChild(overlay);

  // Animate in and auto-resize all textareas once visible
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    modal.classList.add('is-open');
    requestAnimationFrame(() => {
      modal.querySelectorAll('.note-preview__field').forEach((ta) => autoResize(ta));
    });
  });

  const detachTrap = trapFocus(modal, handleCancel);
}
