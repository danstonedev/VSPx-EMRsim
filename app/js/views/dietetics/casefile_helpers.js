import { el } from '../../ui/utils.js';
import { buildBrandedModal, closeBrandedModal, openBrandedModal } from '../../ui/ModalShell.js';
import {
  getCaseFileCategoryLabel,
  getCaseFileEntryMeta,
  getCaseFileTypeLabel,
} from '../../core/casefile-repository.js';
import { finalizeDraftSignature } from '../../core/noteLifecycle.js';

export function getArtifactTypeLabel(type) {
  return getCaseFileTypeLabel({ type });
}

/* ── Rendering helpers (read-only, mirrors NotePreviewModal / export) ── */

function sectionHeader(text, level = 1) {
  const tag = level === 1 ? 'h3' : 'h4';
  const cls = level === 1 ? 'signed-note__section-header' : 'signed-note__subsection-header';
  return el(tag, { class: cls }, [text]);
}

function labelValue(label, value) {
  return el('p', { class: 'signed-note__label-value' }, [
    el('strong', {}, [`${label}: `]),
    value || '',
  ]);
}

function bodyText(text) {
  return el('div', { class: 'signed-note__body' }, [el('p', {}, [text])]);
}

function hasContent(v) {
  if (!v) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.some(hasContent);
  if (typeof v === 'object') return Object.values(v).some(hasContent);
  return true;
}

function fmtDate(d) {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

/* ── Patient info block ── */

function buildPatientInfo(entry, draft) {
  const items = [];
  const name = entry?.data?.patientName || entry?.title || '';
  if (name) items.push(labelValue('Patient Name', name));

  const signedAt = entry?.signedAt || entry?.data?.signedAt || '';
  if (signedAt) items.push(labelValue('Date of Evaluation', fmtDate(signedAt)));

  const complaint = isDieteticsDraft(draft)
    ? draft?.nutrition_diagnosis?.priority_diagnosis || ''
    : draft?.subjective?.chiefComplaint || '';
  if (complaint) items.push(labelValue('Primary Complaint', complaint));

  if (!items.length) return null;
  return el('div', { class: 'signed-note__patient-info' }, [
    sectionHeader('Patient Information', 2),
    ...items,
  ]);
}

/* ── PT read-only sections ── */

function buildReadOnlyPtSections(draft) {
  const subj = draft.subjective || {};
  const obj = draft.objective || {};
  const parts = [];

  // SUBJECTIVE
  const hasSubjective =
    hasContent(subj.chiefComplaint) ||
    hasContent(subj.hpi) ||
    hasContent(subj.painAssessment) ||
    hasContent(subj.socialHistory || subj.social_history) ||
    hasContent(subj.medications || subj.currentMedications);

  if (hasSubjective) {
    parts.push(sectionHeader('SUBJECTIVE'));
    if (hasContent(subj.chiefComplaint))
      parts.push(labelValue('Chief Complaint', subj.chiefComplaint));
    if (hasContent(subj.hpi)) parts.push(labelValue('HPI', subj.hpi));

    const painRaw = subj.painAssessment;
    if (hasContent(painRaw)) {
      if (typeof painRaw === 'string') {
        parts.push(labelValue('Pain Assessment', painRaw));
      } else {
        parts.push(labelValue('Pain Assessment', 'Documented (complex format)'));
      }
    }

    const socialRaw = subj.socialHistory || subj.social_history || '';
    if (hasContent(socialRaw)) {
      parts.push(
        labelValue(
          'Social History',
          typeof socialRaw === 'string' ? socialRaw : 'Documented (complex format)',
        ),
      );
    }

    const medsRaw = subj.medications || subj.currentMedications || '';
    if (hasContent(medsRaw)) {
      const medsStr = Array.isArray(medsRaw) ? medsRaw.join(', ') : String(medsRaw);
      parts.push(labelValue('Medications', medsStr));
    }
  }

  // OBJECTIVE
  const hasObjective =
    hasContent(obj.text) ||
    hasContent(obj.vitalSigns) ||
    hasContent(obj.rom || obj.combinedRomData) ||
    hasContent(obj.mmt || obj.strength) ||
    hasContent(obj.specialTests);

  if (hasObjective) {
    parts.push(sectionHeader('OBJECTIVE'));
    if (hasContent(obj.text)) parts.push(labelValue('Findings', obj.text));

    if (hasContent(obj.vitalSigns)) {
      const vitalsText =
        typeof obj.vitalSigns === 'string'
          ? obj.vitalSigns
          : Object.entries(obj.vitalSigns)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ');
      parts.push(labelValue('Vital Signs', vitalsText));
    }
    if (hasContent(obj.rom || obj.combinedRomData))
      parts.push(labelValue('Range of Motion', 'Documented \u2014 see Word export for tables'));
    if (hasContent(obj.mmt || obj.strength))
      parts.push(
        labelValue('Manual Muscle Testing', 'Documented \u2014 see Word export for tables'),
      );
    if (hasContent(obj.specialTests)) {
      parts.push(
        labelValue(
          'Special Tests',
          typeof obj.specialTests === 'string' ? obj.specialTests : 'Documented (complex format)',
        ),
      );
    }
  }

  // ASSESSMENT
  if (hasContent(draft.assessment)) {
    parts.push(sectionHeader('ASSESSMENT'));
    parts.push(bodyText(draft.assessment));
  }

  // GOALS
  if (hasContent(draft.goals)) {
    parts.push(sectionHeader('GOALS'));
    const goalsText =
      typeof draft.goals === 'string'
        ? draft.goals
        : Array.isArray(draft.goals)
          ? draft.goals.join('\n')
          : '';
    parts.push(bodyText(goalsText));
  }

  // PLAN
  if (hasContent(draft.plan)) {
    parts.push(sectionHeader('PLAN'));
    parts.push(bodyText(typeof draft.plan === 'string' ? draft.plan : ''));
  }

  return parts;
}

/* ── Dietetics read-only sections ── */

function buildReadOnlyDieteticsSections(draft) {
  const parts = [];

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
      parts.push(labelValue(label, source[fieldKey]));
    }
  }

  // Nutrition Diagnosis – PES statements
  const diag = draft.nutrition_diagnosis || {};
  const pes = Array.isArray(diag.pes_statements) ? diag.pes_statements : [];
  const hasPes = pes.some(
    (r) => hasContent(r?.problem) || hasContent(r?.etiology) || hasContent(r?.signs_symptoms),
  );
  if (hasPes || hasContent(diag.priority_diagnosis)) {
    parts.push(sectionHeader('NUTRITION DIAGNOSIS'));
    for (let i = 0; i < pes.length; i++) {
      const row = pes[i] || {};
      if (!hasContent(row.problem) && !hasContent(row.etiology) && !hasContent(row.signs_symptoms))
        continue;
      parts.push(sectionHeader(`PES #${i + 1}`, 2));
      if (hasContent(row.problem)) parts.push(labelValue('Problem', row.problem));
      if (hasContent(row.etiology)) parts.push(labelValue('Etiology', row.etiology));
      if (hasContent(row.signs_symptoms))
        parts.push(labelValue('Signs/Symptoms', row.signs_symptoms));
    }
    if (hasContent(diag.priority_diagnosis))
      parts.push(labelValue('Priority Diagnosis', diag.priority_diagnosis));
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

/* ── Signature block ── */

function buildSignatureBlock(draft) {
  const sig = draft?.meta?.signature;
  if (!sig) return null;
  return el(
    'div',
    { class: 'signed-note__signature-block' },
    [
      el('div', { class: 'signed-note__sig-line' }),
      sig.name ? el('div', { class: 'signed-note__sig-name' }, [sig.name]) : null,
      sig.title ? el('div', { class: 'signed-note__sig-title' }, [sig.title]) : null,
      sig.signedAt ? el('div', { class: 'signed-note__sig-date' }, [fmtDate(sig.signedAt)]) : null,
    ].filter(Boolean),
  );
}

/* ── Amendments block ── */

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
    sectionHeader('Amendments', 2),
    el('ul', { class: 'signed-note__amendment-list' }, items),
  ]);
}

/* ── Signed-note rich renderer ── */

function buildSignedNoteContent(entry) {
  const draft = entry?.data?.note;
  if (!draft) return null;

  const isDiet = isDieteticsDraft(draft);
  const noteType = entry?.data?.templateLabel || (isDiet ? 'Dietetics Note' : 'PT Evaluation');
  const statusText = entry?.status || 'signed';
  const statusCls =
    statusText === 'amended'
      ? 'signed-note__status-pill signed-note__status-pill--amended'
      : 'signed-note__status-pill signed-note__status-pill--signed';

  const contentParts = isDiet
    ? buildReadOnlyDieteticsSections(draft)
    : buildReadOnlyPtSections(draft);

  return el(
    'div',
    { class: 'signed-note' },
    [
      // Title bar
      el('div', { class: 'signed-note__title-bar' }, [
        el('span', { class: 'signed-note__type' }, [noteType]),
        el('span', { class: statusCls }, [statusText.toUpperCase()]),
      ]),
      buildPatientInfo(entry, draft),
      ...contentParts,
      buildSignatureBlock(draft),
      buildAmendments(draft),
    ].filter(Boolean),
  );
}

/* ── Fallback metadata viewer (non-note entries) ── */

function buildMetadataContent(entry) {
  const data = entry?.data && typeof entry.data === 'object' ? entry.data : {};
  const rows = Object.entries(data).filter(([k]) => !['attachments', 'note'].includes(k));
  const meta = getCaseFileEntryMeta(entry);

  return el('div', {}, [
    el('div', { class: 'dietetics-casefile-view-meta' }, [
      el('div', { class: 'dietetics-casefile-view-row' }, [
        el('span', { class: 'label' }, 'Category'),
        el('span', { class: 'value' }, getCaseFileCategoryLabel(entry)),
      ]),
      el('div', { class: 'dietetics-casefile-view-row' }, [
        el('span', { class: 'label' }, 'Document Type'),
        el('span', { class: 'value' }, getCaseFileTypeLabel(entry)),
      ]),
      ...(meta.length
        ? [
            el('div', { class: 'dietetics-casefile-view-row' }, [
              el('span', { class: 'label' }, 'Details'),
              el('span', { class: 'value' }, meta.join(' \u2022 ')),
            ]),
          ]
        : []),
    ]),
    rows.length
      ? el(
          'div',
          { class: 'dietetics-casefile-view-meta' },
          rows.map(([k, v]) =>
            el('div', { class: 'dietetics-casefile-view-row' }, [
              el(
                'span',
                { class: 'label' },
                k.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
              ),
              el('span', { class: 'value' }, typeof v === 'string' ? v : JSON.stringify(v)),
            ]),
          ),
        )
      : el('p', { class: 'text-secondary' }, 'No additional details documented for this entry.'),
    Array.isArray(data.attachments) && data.attachments.length
      ? el(
          'p',
          { class: 'text-secondary' },
          `Attachments: ${data.attachments.length} (editable in PT-style Case File workflows)`,
        )
      : null,
  ]);
}

/* ── Public API ── */

export function openCaseFileViewer(moduleItem, { isFacultyMode = false, onRemove, onAmend } = {}) {
  let modal;
  const title = moduleItem?.title || 'Case File Entry';
  const isSignedNote = moduleItem?.kind === 'signed-note' && moduleItem?.data?.note;

  const close = () => closeBrandedModal(modal);

  const bodyChildren = [
    isSignedNote ? buildSignedNoteContent(moduleItem) : buildMetadataContent(moduleItem),
  ];

  const footerChildren = [
    ...(isFacultyMode
      ? [
          el(
            'button',
            {
              class: 'btn subtle-danger',
              onclick: () => {
                if (!confirm('Remove this Case File entry?')) return;
                onRemove?.(moduleItem?.id);
                close();
              },
            },
            'Remove',
          ),
        ]
      : []),
    ...(isSignedNote
      ? [
          el(
            'button',
            {
              class: 'btn primary',
              onclick: () => {
                close();
                handleAmend(moduleItem, onAmend);
              },
            },
            '\u270E Amend',
          ),
        ]
      : []),
    el('button', { class: 'btn secondary', onclick: close }, 'Close'),
  ];

  modal = buildBrandedModal({
    title,
    contentClass: 'case-details-modal popup-card-base',
    bodyClass: 'case-details-body',
    bodyChildren,
    footerChildren,
    onRequestClose: close,
  });
  openBrandedModal(modal, { focusTarget: () => modal.closeButton, focusDelay: 0 });
}

/* ── Amend flow from Case File viewer ── */

function handleAmend(entry, onAmend) {
  const draft = entry?.data?.note;
  if (!draft) return;

  // Lazily import NotePreviewModal
  import('../../features/navigation/panels/NotePreviewModal.js')
    .then(({ openNotePreviewModal }) => {
      // Prepare for amendment: stash existing signature, clear it
      if (!draft.meta) draft.meta = {};
      draft.meta.amendingFrom = {
        signedAt: draft.meta.signature?.signedAt,
        signedBy: draft.meta.signature?.name,
      };
      delete draft.meta.signature;

      openNotePreviewModal({
        caseData: {},
        draft,
        mode: 'amend',
        async onConfirmSign(updates, signature) {
          // Apply edits back to the draft
          for (const key of Object.keys(updates)) {
            const val = updates[key];
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
              draft[key] = { ...(draft[key] || {}), ...val };
            } else {
              draft[key] = val;
            }
          }

          if (signature) {
            import('../../core/noteLifecycle.js')
              .then(({ finalizeDraftSignature }) => {
                finalizeDraftSignature(draft, signature);
                persistDraftAndClose();
              })
              .catch(persistDraftAndClose);
          } else {
            persistDraftAndClose();
          }

          function persistDraftAndClose() {
            // Persist amended note to casefile
            if (typeof window.saveSignedNoteToCasefile === 'function') {
              try {
                window.saveSignedNoteToCasefile({
                  draft,
                  context: {
                    caseId: entry.caseId || '',
                    encounterId: entry.encounterId || entry.data?.encounterId || '',
                    professionId: entry.discipline || '',
                    templateId: entry.templateId || '',
                    sourceKey: entry.sourceKey || entry.id || '',
                  },
                });
              } catch (err) {
                console.warn('[CaseFile] Failed to persist amended note:', err);
              }
            }

            onAmend?.();
          }
        },
        onCancel() {
          // Restore original signature on cancel
          if (draft.meta?.amendingFrom) {
            draft.meta.signature = {
              signedAt: draft.meta.amendingFrom.signedAt,
              name: draft.meta.amendingFrom.signedBy,
            };
            delete draft.meta.amendingFrom;
          }
        },
      });
    })
    .catch((err) => {
      console.error('[CaseFile] Failed to load amend dependencies:', err);
    });
}
