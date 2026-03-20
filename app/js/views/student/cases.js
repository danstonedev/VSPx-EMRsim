import { route } from '../../core/router.js';
import { navigate as urlNavigate } from '../../core/url.js';
import { createCaseBadge, createAuthorBadge } from '../../ui/CaseBadge.js';
async function _listCaseSummaries(opts) {
  const store = await import('../../core/store.js');
  if (typeof store.listCaseSummaries === 'function') {
    return store.listCaseSummaries(opts);
  }
  // Fallback for older bundles: load full cases and map to summaries
  if (typeof store.listCases === 'function') {
    const list = await store.listCases();
    return (list || []).map((c) => ({
      id: c.id,
      title: c.title || c.caseObj?.meta?.title || 'Untitled Case',
      latestVersion: c.latestVersion || 0,
      isStored: true,
    }));
  }
  throw new Error('Store API not available');
}
import { storage } from '../../core/index.js';
import { el } from '../../ui/utils.js';

// Shared icon helper (inline SVG sprite)
function spriteIcon(name, { className = 'icon', size } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', className);
  const sz = size || '18px';
  svg.style.width = sz;
  svg.style.height = sz;
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#icon-${name}`);
  svg.appendChild(use);
  return svg;
}

// ── Patient metadata helpers ──
// Stored as patient_{id} → { name, dob, sex, created }

function savePatientMeta(patientId, meta) {
  storage.setItem(`patient_${patientId}`, JSON.stringify(meta));
}

function getPatientMeta(patientId) {
  return safeJsonParse(storage.getItem(`patient_${patientId}`));
}

function deletePatientMeta(patientId) {
  storage.removeItem(`patient_${patientId}`);
}

/** Parse MM/DD/YYYY or YYYY-MM-DD → { m, d, y } or null */
function parseDob(str) {
  if (!str) return null;
  let m, d, y;
  if (str.includes('-')) {
    [y, m, d] = str.split('-').map(Number);
  } else {
    [m, d, y] = str.split('/').map(Number);
  }
  if (!m || !d || !y || y < 1900) return null;
  return { m, d, y };
}

function calcAge(dobStr) {
  const p = parseDob(dobStr);
  if (!p) return '';
  const dob = new Date(p.y, p.m - 1, p.d);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const md = now.getMonth() - dob.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 && age < 150 ? String(age) : '';
}

/** MM/DD/YYYY → YYYY-MM-DD (for <input type="date">) */
function dobToIso(dobStr) {
  const p = parseDob(dobStr);
  if (!p) return '';
  return `${String(p.y).padStart(4, '0')}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** YYYY-MM-DD → MM/DD/YYYY (for storage) */
function isoToDob(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  return `${m}/${d}/${y}`;
}

/** Normalize sex to editor-consistent lowercase values */
function normalizeSex(val) {
  const v = String(val || '')
    .trim()
    .toLowerCase();
  if (v === 'm' || v === 'male') return 'male';
  if (v === 'f' || v === 'female') return 'female';
  if (v === 'other') return 'other';
  if (v === 'unspecified' || v === 'prefer not to say' || v === 'prefer-not-to-say')
    return 'unspecified';
  return v;
}

function formatPatientTitle(name, dob, sex) {
  const age = calcAge(dob);
  const namePart = name ? (age ? `${name} (${age} yo)` : name) : '';
  const sexDisplay = sex && sex !== 'unspecified' ? sex.charAt(0).toUpperCase() + sex.slice(1) : '';
  const parts = [namePart, sexDisplay].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '';
}

// Helper: scan localStorage-backed drafts and compute completion summary per case/encounter
function sectionCompletionCount(draftData) {
  const sections = ['subjective', 'assessment', 'goals', 'plan', 'billing'];
  let completed = 0;
  sections.forEach((section) => {
    const sectionData = draftData[section];
    if (!sectionData) return;
    if (typeof sectionData === 'string') {
      if (sectionData.trim().length > 0) completed++;
    } else if (
      typeof sectionData === 'object' &&
      (section === 'subjective' || section === 'assessment')
    ) {
      const hasContent = Object.values(sectionData).some(
        (v) => v && typeof v === 'string' && v.trim().length > 0,
      );
      if (hasContent) completed++;
    }
  });
  return completed;
}

function hasObjectiveContent(draftData) {
  const objectiveData = draftData.objective;
  if (!objectiveData) return false;
  if (objectiveData.text && objectiveData.text.trim().length > 0) return true;
  if (objectiveData.selectedRegions && objectiveData.selectedRegions.length > 0) return true;
  return false;
}

function scanDrafts(storage) {
  const drafts = {};
  const keys = storage.keys();
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key || !key.startsWith('draft_')) continue;
    try {
      const draftData = JSON.parse(storage.getItem(key));
      const draftPrefix = 'draft_';
      const keyWithoutPrefix = key.substring(draftPrefix.length);
      const lastUnderscoreIndex = keyWithoutPrefix.lastIndexOf('_');
      if (lastUnderscoreIndex === -1) continue;

      const caseId = keyWithoutPrefix.substring(0, lastUnderscoreIndex);
      const encounter = keyWithoutPrefix.substring(lastUnderscoreIndex + 1);
      let completedSections = 0;
      let totalSections = 1;
      let completionPercent = 0;

      if (draftData.noteType === 'simple-soap') {
        const soap = draftData.simpleSOAP || {};
        const hasContent = ['subjective', 'objective', 'assessment', 'plan'].some(
          (k) => typeof soap[k] === 'string' && soap[k].trim().length > 0,
        );
        completedSections = hasContent ? 1 : 0;
        completionPercent = hasContent ? 100 : 0;
      } else {
        completedSections = sectionCompletionCount(draftData);
        if (hasObjectiveContent(draftData)) completedSections++;
        totalSections = 6; // 5 sections + 1 objective
        completionPercent = Math.round((completedSections / totalSections) * 100);
      }

      if (!drafts[caseId]) drafts[caseId] = {};
      drafts[caseId][encounter] = {
        completionPercent,
        hasContent: completedSections > 0,
      };
    } catch (error) {
      console.warn('Could not parse draft data for key:', key, error);
      storage.removeItem(key); // prune corrupted
    }
  }
  return drafts;
}

// Build a lowercased search string for a case
function getCaseSearchText(c) {
  // Manifest-first: only title is guaranteed
  const vals = [c.title].filter(Boolean);
  return vals.join(' ').toLowerCase();
}

function buildFilterPredicate(searchTerm) {
  const term = (searchTerm || '').toLowerCase();
  if (!term) return () => true;
  return (c) => getCaseSearchText(c).includes(term);
}

function getStatusOrderForCase(caseObj, drafts) {
  const draftInfo = drafts[caseObj.id];
  const evalDraft = draftInfo?.eval;
  if (!evalDraft || !evalDraft.hasContent) return 0; // not started
  return evalDraft.completionPercent === 100 ? 2 : 1; // complete : inprogress
}

function buildComparator(sortColumn, sortDirection, drafts) {
  const dir = sortDirection === 'desc' ? -1 : 1;
  return (a, b) => {
    const aVal = getSortValue(a);
    const bVal = getSortValue(b);
    if (aVal > bVal) return dir;
    if (aVal < bVal) return -dir;
    return 0;
  };
  function getSortValue(caseObj) {
    const accessors = {
      title: (obj) => (obj.title || '').toLowerCase(),
      // setting/diagnosis not available without full case load
      setting: () => '',
      diagnosis: () => '',
      status: (obj) => String(getStatusOrderForCase(obj, drafts)),
    };
    const accessor = accessors[sortColumn] || (() => '');
    return accessor(caseObj);
  }
}

// Build simple SOAP Word export — only 4 free-text sections
function createSimpleSOAPExportDocHTML(c, draft) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const exportStyles =
    "body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;margin:0;padding:0;color:#000;text-align:left}h1{font-size:14pt;font-weight:bold;text-align:center;margin:0 0 18pt 0;text-decoration:underline}h2{font-size:13pt;font-weight:bold;margin:18pt 0 8pt 0;color:#2c5aa0;border-bottom:1px solid #ccc;padding-bottom:3pt}p{margin:0 0 8pt 0}.section{margin-bottom:20pt;page-break-inside:avoid}.signature-line{border-bottom:1px solid #000;width:300pt;margin:24pt 0 6pt 0}.footer{margin-top:36pt;font-size:9pt;color:#666;text-align:center;border-top:1px solid #ccc;padding-top:12pt}";
  const soap = draft.simpleSOAP || {};
  const nl = (s) => (s || '').replace(/\n/g, '<br>');
  const noteTitle = draft.noteTitle || c.title || 'Simple SOAP Note';

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Word.Document">
      <meta name="Generator" content="Microsoft Word">
      <meta name="Originator" content="Microsoft Word">
      <style>${exportStyles}</style>
    </head>
    <body>
      <div class="header">
        <div class="clinic-name">Physical Therapy Clinic</div>
        <div class="clinic-info">Student Clinical Documentation | Academic Exercise</div>
      </div>
      <div class="patient-info">
        <div class="info-row"><span class="info-label">Note:</span><span>${noteTitle}</span></div>
        <div class="info-row"><span class="info-label">Date of Service:</span><span>${currentDate}</span></div>
        <div class="info-row"><span class="info-label">Student:</span><span>_________________________________</span></div>
      </div>
      <h1>SIMPLE SOAP NOTE</h1>
      <div class="section"><h2>SUBJECTIVE</h2><p>${nl(soap.subjective) || 'Not documented.'}</p></div>
      <div class="section"><h2>OBJECTIVE</h2><p>${nl(soap.objective) || 'Not documented.'}</p></div>
      <div class="section"><h2>ASSESSMENT</h2><p>${nl(soap.assessment) || 'Not documented.'}</p></div>
      <div class="section"><h2>PLAN</h2><p>${nl(soap.plan) || 'Not documented.'}</p></div>
      <div class="signature-section">
        <div class="info-row"><span class="info-label">Student Signature:</span><span class="signature-line"></span><span class="ml-12pt">Date: ___________</span></div>
        <br>
        <div class="info-row"><span class="info-label">Instructor Signature:</span><span class="signature-line"></span><span class="ml-12pt">Date: ___________</span></div>
      </div>
      <div class="footer">Generated by PT EMR Simulator</div>
    </body></html>`;
}

// Build the exportable Word HTML content from a draft
function createExportDocHTML(c, draft) {
  // Simple SOAP Note: export only 4 free-text sections
  if (draft.noteType === 'simple-soap') {
    return createSimpleSOAPExportDocHTML(c, draft);
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const exportStyles =
    "body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;margin:0;padding:0;color:#000;text-align:left}h1{font-size:14pt;font-weight:bold;text-align:center;margin:0 0 18pt 0;text-decoration:underline}h2{font-size:13pt;font-weight:bold;margin:18pt 0 8pt 0;color:#2c5aa0;border-bottom:1px solid #ccc;padding-bottom:3pt}h3{font-size:12pt;font-weight:bold;margin:12pt 0 6pt 0;color:#444}p{margin:0 0 8pt 0}.section{margin-bottom:20pt;page-break-inside:avoid}table{border-collapse:collapse;width:100%;font-size:10pt}th,td{border:1px solid #000;padding:4pt 8pt}th{font-weight:bold;background-color:#f5f5f5}.signature-line{border-bottom:1px solid #000;width:300pt;margin:24pt 0 6pt 0}.footer{margin-top:36pt;font-size:9pt;color:#666;text-align:center;border-top:1px solid #ccc;padding-top:12pt}";
  let content = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Word.Document">
      <meta name="Generator" content="Microsoft Word">
      <meta name="Originator" content="Microsoft Word">
      <style>${exportStyles}</style>
    </head>
    <body>
      <div class="header">
        <div class="clinic-name">Physical Therapy Clinic</div>
        <div class="clinic-info">Student Clinical Documentation | Academic Exercise</div>
      </div>
      <div class="patient-info">
        <div class="info-row"><span class="info-label">Case:</span><span>${c.title}</span></div>
        <div class="info-row"><span class="info-label">Encounter Type:</span><span>EVAL</span></div>
        <div class="info-row"><span class="info-label">Date of Service:</span><span>${currentDate}</span></div>
        <div class="info-row"><span class="info-label">Student:</span><span>_________________________________</span></div>
      </div>
      <h1>PHYSICAL THERAPY EVAL NOTE</h1>
      <div class="section">
        <h2>SUBJECTIVE</h2>
        <p>${buildSubjectiveHtml(draft).replace(/\n/g, '<br>')}</p>
      </div>
      <div class="section">
        <h2>OBJECTIVE</h2>
        <h3>Observations & Vital Signs</h3>
        <p>${(draft.objective?.text || 'Clinical observations not documented at this time.').replace(/\n/g, '<br>')}</p>
  `;

  // ROM table
  if (draft.objective?.rom && Object.keys(draft.objective.rom).length > 0) {
    content += `
      <h3>Range of Motion Assessment</h3>
      <table><thead><tr>
        <th>Joint/Movement</th><th>AROM (°)</th><th>PROM (°)</th><th>Notes</th>
      </tr></thead><tbody>`;
    Object.entries(draft.objective.rom).forEach(([joint, movements]) => {
      Object.entries(movements).forEach(([movement, values]) => {
        content += `<tr><td>${joint} ${movement}</td><td>${values.arom || '-'}</td><td>${values.prom || '-'}</td><td>${values.notes || ''}</td></tr>`;
      });
    });
    content += `</tbody></table>`;
  }

  // MMT table
  if (draft.objective?.mmt?.rows?.length > 0) {
    content += `
      <h3>Manual Muscle Testing</h3>
      <table><thead><tr>
        <th>Muscle Group</th><th>Side</th><th>Grade (0-5)</th><th>Comments</th>
      </tr></thead><tbody>`;
    draft.objective.mmt.rows.forEach((r) => {
      content += `<tr><td>${r.muscle}</td><td>${r.side}</td><td>${r.grade || '-'}</td><td></td></tr>`;
    });
    content += `</tbody></table>`;
  }

  content += `</div>`; // close OBJECTIVE section

  // Remaining narrative sections
  const sections = [
    {
      name: 'ASSESSMENT',
      content: draft.assessment,
      placeholder: 'Clinical assessment and diagnostic reasoning not documented at this time.',
    },
    {
      name: 'GOALS',
      content: draft.goals,
      placeholder: 'Treatment goals not established at this time.',
    },
    {
      name: 'PLAN',
      content: draft.plan,
      placeholder: 'Treatment plan not documented at this time.',
    },
    {
      name: 'BILLING & CODING',
      content: draft.billing,
      placeholder: 'Billing codes not documented.',
    },
  ];
  sections.forEach((section) => {
    let contentText = section.content;
    if (section.name === 'ASSESSMENT' && section.content && typeof section.content === 'object') {
      contentText = buildAssessmentHtml(section.content);
    }
    content += `<div class="section"><h2>${section.name}</h2><p>${(contentText || section.placeholder).replace(/\n/g, '<br>')}</p></div>`;
  });

  // Signature
  content += `
    <div class="signature-section">
  <div class="info-row"><span class="info-label">Student Signature:</span><span class="signature-line"></span><span class="ml-12pt">Date: ___________</span></div>
      <br>
  <div class="info-row"><span class="info-label">Instructor Signature:</span><span class="signature-line"></span><span class="ml-12pt">Date: ___________</span></div>
    </div>
    <div class="footer">Generated by PT EMR Simulator</div>
    </body></html>`;

  return content;
}

function buildSubjectiveHtml(draft) {
  if (!draft.subjective || typeof draft.subjective === 'string') {
    return draft.subjective || 'Patient subjective findings not documented at this time.';
  }
  const s = draft.subjective;
  const fields = [
    ['chiefComplaint', 'Chief Concern'],
    ['historyOfPresentIllness', 'History of Present Illness'],
    ['painLocation', 'Pain Location'],
    ['painScale', 'Pain Scale', (v) => `${v}/10`],
    ['painQuality', 'Pain Quality'],
    ['aggravatingFactors', 'Aggravating Factors'],
    ['easingFactors', 'Easing Factors'],
    ['functionalLimitations', 'Functional Limitations'],
    ['priorLevel', 'Prior Level of Function'],
    ['patientGoals', 'Patient Goals'],
    ['medicationsCurrent', 'Current Medications'],
    ['redFlags', 'Red Flags/Screening'],
    ['additionalHistory', 'Additional History'],
  ];
  const parts = [];
  for (const [key, label, fmt] of fields) {
    const val = s[key];
    if (val) parts.push(`<strong>${label}:</strong> ${fmt ? fmt(val) : val}`);
  }
  return parts.length > 0
    ? parts.join('<br><br>')
    : 'Patient subjective findings not documented at this time.';
}

function buildAssessmentHtml(assessmentObj) {
  const parts = [];
  if (assessmentObj.primaryImpairments)
    parts.push(`<strong>Primary Impairments:</strong> ${assessmentObj.primaryImpairments}`);
  if (assessmentObj.bodyFunctions)
    parts.push(`<strong>Body Functions & Structures:</strong> ${assessmentObj.bodyFunctions}`);
  if (assessmentObj.activityLimitations)
    parts.push(`<strong>Activity Limitations:</strong> ${assessmentObj.activityLimitations}`);
  if (assessmentObj.participationRestrictions)
    parts.push(
      `<strong>Participation Restrictions:</strong> ${assessmentObj.participationRestrictions}`,
    );
  if (assessmentObj.ptDiagnosis)
    parts.push(`<strong>PT Diagnosis:</strong> ${assessmentObj.ptDiagnosis}`);
  if (assessmentObj.clinicalReasoning)
    parts.push(`<strong>Clinical Reasoning:</strong> ${assessmentObj.clinicalReasoning}`);
  return parts.length > 0 ? parts.join('<br><br>') : null;
}

function buildStatusContent(evalDraft) {
  if (evalDraft && evalDraft.hasContent) {
    const isComplete = evalDraft.completionPercent === 100;
    const statusText = isComplete ? 'Complete' : 'In-Progress';
    const statusClass = isComplete ? 'status--complete' : 'status--in-progress';
    return el('span', { class: `status ${statusClass}` }, statusText);
  }
  return el('span', { class: 'status status--not-started' }, 'Not Started');
}

function buildActionButtons(c, evalDraft, storage, urlNavigate, onRefresh) {
  const buttonText = evalDraft && evalDraft.hasContent ? 'Continue Working' : 'Start Case';
  const buttons = [
    el(
      'button',
      {
        class: 'btn primary small',
        onClick: () => urlNavigate('/student/editor', { case: c.id, v: 0, encounter: 'eval' }),
      },
      buttonText,
    ),
  ];
  const isBlankNote = String(c.id || '').startsWith('blank');
  const localStorageKey = `draft_${c.id}_eval`;
  const confirmAnd = (msg, fn) => {
    if (confirm(msg)) fn();
  };
  if (isBlankNote) {
    buttons.push(' ');
    buttons.push(
      el(
        'button',
        {
          class: 'btn subtle-danger small',
          title: 'Delete this blank note',
          onClick: () =>
            confirmAnd('Delete this blank SOAP note? This cannot be undone.', () => {
              storage.removeItem(localStorageKey);
              if (onRefresh) onRefresh();
            }),
        },
        'Remove',
      ),
    );
  } else {
    buttons.push(' ');
    buttons.push(
      el(
        'button',
        {
          class: 'btn subtle-danger small',
          title: 'Reset your draft work for this case',
          onClick: () =>
            confirmAnd('Reset your draft for this case? This will clear your local work.', () => {
              storage.removeItem(localStorageKey);
              if (onRefresh) onRefresh();
            }),
        },
        'Reset',
      ),
    );
  }
  if (evalDraft && evalDraft.completionPercent === 100) {
    buttons.push(' ');
    buttons.push(
      el(
        'button',
        {
          class: 'btn success small',
          onClick: async () => {
            try {
              const draftKey = `draft_${c.id}_eval`;
              const savedDraft = storage.getItem(draftKey);
              if (!savedDraft) {
                alert('Could not find draft data for export.');
                return;
              }
              const draft = JSON.parse(savedDraft);
              const content = createExportDocHTML(c, draft);
              const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${c.title.replace(/[^a-z0-9]/gi, '_')}_EVAL_NOTE.doc`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch (err) {
              console.error('Export failed:', err);
              alert('Export failed. Please try again.');
            }
          },
        },
        'Download Word',
      ),
    );
  }
  return buttons;
}

function createCaseRow(c, drafts, storage, urlNavigate, onRefresh) {
  const draftInfo = drafts[c.id];
  const evalDraft = draftInfo?.eval;
  const statusContent = buildStatusContent(evalDraft);
  const actionButtons = buildActionButtons(c, evalDraft, storage, urlNavigate, onRefresh);
  const badge = createCaseBadge(c);

  return el('tr', {}, [
    el('td', {}, c.title || ''),
    el('td', {}, ''),
    el('td', {}, ''),
    el('td', {}, statusContent),
    el('td', {}, badge || ''),
    el('td', { class: 'nowrap' }, actionButtons),
  ]);
}

function appendErrorPanel(app, text) {
  app.append(el('div', { class: 'panel error' }, text));
}

function appendNoCasesPanel(app) {
  app.append(
    el('div', { class: 'panel' }, [
      el('p', {}, 'No cases are currently available.'),
      el('p', {}, 'Please contact your instructor if you believe this is an error.'),
    ]),
  );
}

function makeCasesPanel(app, initialCases, drafts) {
  let cases = initialCases;
  let searchTerm = '';

  const casesPanel = el('div', { class: 'panel' }, [
    el('div', { class: 'flex-between mb-16 ai-center' }, [
      el('div', {}, [el('h2', {}, 'Case Library')]),
    ]),
    el('input', {
      type: 'text',
      placeholder: 'Search cases by title...',
      class: 'form-input-standard w-100 mb-16',
      onInput: (e) => {
        searchTerm = (e.target.value || '').toLowerCase();
        renderTable();
      },
    }),
  ]);
  app.append(casesPanel);

  // Sorting state (match faculty behavior)
  let sortColumn = 'title';
  let sortDirection = 'asc';

  function createSortableHeader(text, column) {
    const isActive = sortColumn === column;
    const isDesc = isActive && sortDirection === 'desc';

    const header = document.createElement('th');
    header.className = 'sortable';
    if (isActive) header.setAttribute('aria-sort', isDesc ? 'descending' : 'ascending');

    const container = document.createElement('div');
    container.className = 'd-flex ai-center jc-between gap-8';

    const textSpan = document.createElement('span');
    textSpan.className = 'fw-600';
    textSpan.textContent = text;

    const icon = spriteIcon(isActive ? (isDesc ? 'sortDesc' : 'sortAsc') : 'sort', {
      className: 'icon sort-icon',
    });
    icon.classList.add(isActive ? 'opacity-90' : 'opacity-50');

    container.appendChild(textSpan);
    container.appendChild(icon);
    header.appendChild(container);

    header.addEventListener('click', () => {
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }
      renderTable();
    });

    return header;
  }

  function renderTable() {
    const filtered = cases.filter(buildFilterPredicate(searchTerm));
    if (sortColumn) filtered.sort(buildComparator(sortColumn, sortDirection, drafts));
    const table = el('table', { class: 'table cases-table' }, [
      el(
        'thead',
        {},
        el('tr', {}, [
          createSortableHeader('Case Title', 'title'),
          createSortableHeader('Setting', 'setting'),
          createSortableHeader('Diagnosis', 'diagnosis'),
          createSortableHeader('Draft Status', 'status'),
          el('th', {}, 'Source'),
          el('th', {}, ''),
        ]),
      ),
      el(
        'tbody',
        {},
        filtered.map((c) =>
          createCaseRow(c, drafts, storage, urlNavigate, () => {
            drafts = scanDrafts(storage);
            renderTable();
          }),
        ),
      ),
    ]);
    const existing = casesPanel.querySelector('.table-responsive');
    if (existing) existing.remove();
    const wrapper = el('div', { class: 'table-responsive' }, table);
    casesPanel.append(wrapper);
  }

  renderTable();

  // Return updater for background remote data refresh
  return function updateCases(newCases) {
    cases = newCases;
    renderTable();
  };
}

function safeJsonParse(str) {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    /* invalid JSON — return null */
    return null;
  }
}

// ── Patient cards helpers ──

function getPatientItems() {
  const patients = new Map(); // patientId → { meta, draftKey, draftData }

  // 1. Scan patient metadata records
  storage
    .keys()
    .filter((k) => k && k.startsWith('patient_blank'))
    .forEach((key) => {
      const patientId = key.replace('patient_', '');
      const meta = safeJsonParse(storage.getItem(key)) || {};
      patients.set(patientId, { meta, draftKey: null, draftData: null });
    });

  // 2. Scan draft records
  storage
    .keys()
    .filter((k) => k && k.startsWith('draft_blank'))
    .forEach((key) => {
      const noteId = key.replace('draft_', '').replace('_eval', '');
      const draftData = safeJsonParse(storage.getItem(key)) || {};
      if (patients.has(noteId)) {
        const p = patients.get(noteId);
        p.draftKey = key;
        p.draftData = draftData;
      } else {
        // Backward compat: draft exists without patient meta
        patients.set(noteId, {
          meta: { name: '', dob: '', sex: '', created: draftData.__savedAt || 0 },
          draftKey: key,
          draftData,
        });
      }
    });

  return Array.from(patients.entries()).map(([patientId, { meta, draftKey, draftData }]) => {
    const name = meta.name || '';
    const dob = meta.dob || '';
    const sex = normalizeSex(meta.sex);
    const displayTitle =
      formatPatientTitle(name, dob, sex) ||
      (draftData && draftData.noteTitle ? draftData.noteTitle.trim() : '') ||
      'New Patient';
    const ts = (draftData && draftData.__savedAt) || meta.created || 0;
    const hasNote = !!draftKey;
    const isSimple = hasNote && draftData && draftData.noteType === 'simple-soap';
    let completed = 0;
    let totalSections = 0;
    let percent = 0;
    let statusKey = 'not-started';
    if (hasNote && draftData) {
      totalSections = isSimple ? 4 : 6;
      if (isSimple) {
        const soap = draftData.simpleSOAP || {};
        completed = ['subjective', 'objective', 'assessment', 'plan'].filter(
          (k) => typeof soap[k] === 'string' && soap[k].trim().length > 0,
        ).length;
      } else {
        completed = sectionCompletionCount(draftData);
        if (hasObjectiveContent(draftData)) completed++;
      }
      percent = totalSections > 0 ? Math.round((completed / totalSections) * 100) : 0;
      if (completed > 0 && percent < 100) statusKey = 'in-progress';
      else if (percent === 100) statusKey = 'complete';
    }
    return {
      patientId,
      name,
      dob,
      sex,
      key: draftKey,
      noteId: patientId,
      title: displayTitle,
      ts,
      isSimple,
      completed,
      totalSections,
      percent,
      statusKey,
      hasNote,
    };
  });
}

function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_LABELS = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  complete: 'Complete',
};

function buildPatientCard(item, onRefresh) {
  const card = el('div', { class: 'patient-card', 'data-patient-id': item.noteId });

  // Chevron — inline width/height prevent FOUC when CSS hasn't loaded yet
  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chevron.setAttribute('class', 'patient-card-chevron');
  chevron.setAttribute('viewBox', '0 0 20 20');
  chevron.setAttribute('width', '18');
  chevron.setAttribute('height', '18');
  chevron.setAttribute('fill', 'currentColor');
  chevron.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z',
  );
  chevron.appendChild(path);

  // Title = Name, Age, Sex (or "New Patient" if empty)
  const titleSpan = el('span', { class: 'patient-card-title' }, item.title);

  // Meta badges — only show note-type & progress if a note exists
  const metaChildren = [];
  if (item.hasNote) {
    const typeBadgeClass = item.isSimple
      ? 'patient-card-badge--simple'
      : 'patient-card-badge--soap';
    const typeBadgeText = item.isSimple ? 'Simple SOAP' : 'SOAP Note';
    metaChildren.push(
      el('span', { class: `patient-card-badge ${typeBadgeClass}` }, typeBadgeText),
      el(
        'span',
        { class: `patient-card-status patient-card-status--${item.statusKey}` },
        STATUS_LABELS[item.statusKey],
      ),
      el('span', { class: 'patient-card-progress' }, `${item.completed}/${item.totalSections}`),
    );
  } else {
    metaChildren.push(
      el('span', { class: 'patient-card-status patient-card-status--not-started' }, 'No Notes Yet'),
    );
  }
  if (item.ts) {
    metaChildren.push(el('span', { class: 'patient-card-timestamp' }, relativeTime(item.ts)));
  }

  const header = el(
    'div',
    {
      class: 'patient-card-header',
      tabindex: '0',
      role: 'button',
      'aria-expanded': 'false',
      onClick: () => toggleCard(card, header),
      onKeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCard(card, header);
        }
      },
    },
    [chevron, titleSpan, el('div', { class: 'patient-card-meta' }, metaChildren)],
  );

  // ── Expanded body ──
  const bodyChildren = [];

  // Inline edit fields — always visible in body
  let updateNoteButtons = null;
  const saveField = (field, value) => {
    const meta = getPatientMeta(item.patientId) || {
      name: '',
      dob: '',
      sex: '',
      created: Date.now(),
    };
    meta[field] = value;
    savePatientMeta(item.patientId, meta);
    // Update title in header
    titleSpan.textContent = formatPatientTitle(meta.name, meta.dob, meta.sex) || 'New Patient';
    // Also update noteTitle on the draft if one exists
    if (item.key) {
      const draft = safeJsonParse(storage.getItem(item.key));
      if (draft) {
        draft.noteTitle = formatPatientTitle(meta.name, meta.dob, meta.sex) || 'New Patient';
        storage.setItem(item.key, JSON.stringify(draft));
      }
    }
    if (updateNoteButtons) updateNoteButtons();
  };

  const nameInput = el('input', {
    type: 'text',
    class: 'patient-edit-input patient-name-input',
    placeholder: 'Patient name',
    value: item.name,
    onInput: (e) => saveField('name', e.target.value.trim()),
  });
  const dobInput = el('input', {
    type: 'date',
    class: 'patient-edit-input patient-edit-input--dob',
    value: dobToIso(item.dob),
    onChange: (e) => {
      const stored = isoToDob(e.target.value);
      saveField('dob', stored);
    },
  });

  const sexOptions = [
    { value: '', label: 'Sex' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'other', label: 'Other' },
  ];
  const sexSelect = el(
    'select',
    {
      class: 'patient-edit-input patient-edit-input--short',
      onChange: (e) => saveField('sex', e.target.value),
    },
    sexOptions.map((opt) =>
      el(
        'option',
        { value: opt.value, ...(opt.value === item.sex ? { selected: 'selected' } : {}) },
        opt.label,
      ),
    ),
  );

  bodyChildren.push(
    el('div', { class: 'patient-edit-fields' }, [
      el('div', { class: 'patient-edit-field' }, [nameInput]),
      el('div', { class: 'patient-edit-field patient-edit-field--dob' }, [dobInput]),
      el('div', { class: 'patient-edit-field patient-edit-field--short' }, [sexSelect]),
    ]),
  );

  // Existing note row (if draft exists)
  if (item.hasNote) {
    const noteTypeLabel = item.isSimple ? 'Simple SOAP Note' : 'Initial Evaluation (SOAP)';
    const noteSubtitle = item.ts
      ? `Last edited: ${new Date(item.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : '';
    const noteActions = [
      el(
        'button',
        {
          class: 'btn primary small',
          onClick: (e) => {
            e.stopPropagation();
            urlNavigate('/student/editor', { case: item.noteId, v: 0, encounter: 'eval' });
          },
        },
        'Open',
      ),
    ];
    if (item.statusKey === 'complete') {
      noteActions.push(
        el(
          'button',
          {
            class: 'btn success small',
            onClick: (e) => {
              e.stopPropagation();
              exportPatientNote(item);
            },
          },
          'Download',
        ),
      );
    }
    noteActions.push(
      el(
        'button',
        {
          class: 'btn subtle-danger small',
          title: 'Remove this note only',
          onClick: (e) => {
            e.stopPropagation();
            if (
              confirm('Remove this note from the patient record? The patient record will be kept.')
            ) {
              if (item.key) storage.removeItem(item.key);
              if (onRefresh) onRefresh();
            }
          },
        },
        'Remove Note',
      ),
    );
    bodyChildren.push(
      el('div', { class: 'patient-card-note' }, [
        spriteIcon('edit', { className: 'patient-card-note-icon' }),
        el('div', { class: 'patient-card-note-info' }, [
          el('div', { class: 'patient-card-note-title' }, noteTypeLabel),
          el('div', { class: 'patient-card-note-subtitle' }, noteSubtitle),
        ]),
        el('div', { class: 'patient-card-note-actions' }, noteActions),
      ]),
    );
  }

  // Note type buttons — create new notes
  const startNote = (isSimple) => {
    const draftKey = `draft_${item.patientId}_eval`;
    const meta = getPatientMeta(item.patientId) || { name: '', dob: '', sex: '' };
    const noteTitle = formatPatientTitle(meta.name, meta.dob, meta.sex) || 'New Patient';
    // Seed subjective patient profile from patient metadata
    const subjective = {
      patientName: meta.name || '',
      patientBirthday: meta.dob ? dobToIso(meta.dob) : '',
      patientAge: calcAge(meta.dob) || '',
      patientGender: normalizeSex(meta.sex) || '',
      patientGenderIdentityPronouns: meta.genderIdentityPronouns || '',
      patientPreferredLanguage: meta.preferredLanguage || '',
      patientInterpreterNeeded: meta.interpreterNeeded || '',
    };
    const draft = isSimple
      ? {
          noteType: 'simple-soap',
          noteTitle,
          subjective,
          simpleSOAP: { subjective: '', objective: '', assessment: '', plan: '' },
          __savedAt: Date.now(),
        }
      : { noteTitle, subjective, __savedAt: Date.now() };
    storage.setItem(draftKey, JSON.stringify(draft));
    urlNavigate('/student/editor', { case: item.patientId, v: 0, encounter: 'eval' });
  };

  const noteTypeBtns = [];
  if (!item.hasNote) {
    const hasName = !!(item.name && item.name.trim());
    const soapBtn = el(
      'button',
      {
        class: 'btn primary small',
        disabled: !hasName,
        title: hasName ? '' : 'Enter a patient name first',
        onClick: (e) => {
          e.stopPropagation();
          startNote(false);
        },
      },
      'New Eval (SOAP Note)',
    );
    const simpleBtn = el(
      'button',
      {
        class: 'btn secondary small',
        disabled: !hasName,
        title: hasName ? '' : 'Enter a patient name first',
        onClick: (e) => {
          e.stopPropagation();
          startNote(true);
        },
      },
      'Simple SOAP Note',
    );
    updateNoteButtons = () => {
      const m = getPatientMeta(item.patientId) || {};
      const filled = !!(m.name && m.name.trim());
      soapBtn.disabled = !filled;
      simpleBtn.disabled = !filled;
      soapBtn.title = filled ? '' : 'Enter a patient name first';
      simpleBtn.title = filled ? '' : 'Enter a patient name first';
    };
    noteTypeBtns.push(soapBtn, simpleBtn);
  }
  // Future note types (always shown, always disabled)
  noteTypeBtns.push(
    el(
      'button',
      { class: 'patient-card-future-btn', title: 'Coming soon', disabled: 'true' },
      '+ Treatment Note',
    ),
    el(
      'button',
      { class: 'patient-card-future-btn', title: 'Coming soon', disabled: 'true' },
      '+ Follow-up',
    ),
    el(
      'button',
      { class: 'patient-card-future-btn', title: 'Coming soon', disabled: 'true' },
      '+ Progress Note',
    ),
  );
  bodyChildren.push(el('div', { class: 'patient-card-note-types' }, noteTypeBtns));

  // Footer — danger zone (deletes patient + any notes)
  bodyChildren.push(
    el('div', { class: 'patient-card-footer patient-card-danger-zone' }, [
      el(
        'button',
        {
          class: 'btn-text-danger small',
          onClick: (e) => {
            e.stopPropagation();
            if (
              confirm(
                'Delete this entire patient record' +
                  (item.hasNote ? ' and its note' : '') +
                  '? This cannot be undone.',
              )
            ) {
              if (item.key) storage.removeItem(item.key);
              deletePatientMeta(item.patientId);
              if (onRefresh) onRefresh();
            }
          },
        },
        'Delete Patient Record',
      ),
    ]),
  );

  const body = el('div', { class: 'patient-card-body' }, bodyChildren);
  card.append(header, body);
  return card;
}

function toggleCard(card, header) {
  const isOpen = card.classList.toggle('is-open');
  header.setAttribute('aria-expanded', String(isOpen));
}

function exportPatientNote(item) {
  try {
    const savedDraft = storage.getItem(item.key);
    if (!savedDraft) {
      alert('Could not find draft data for export.');
      return;
    }
    const draft = JSON.parse(savedDraft);
    const caseObj = { id: item.noteId, title: item.title };
    const content = createExportDocHTML(caseObj, draft);
    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '_')}_EVAL_NOTE.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export failed:', err);
    alert('Export failed. Please try again.');
  }
}

// ── My Patients panel ──

function renderMyPatientsPanel(app) {
  let items = getPatientItems();
  let filterStatus = 'all';
  let sortBy = 'modified';
  let searchTerm = '';

  const section = el('div', { class: 'panel patient-cards-section' });

  // Header row: title + New Patient button
  const newPatientBtn = el(
    'button',
    {
      class: 'btn primary d-flex ai-center gap-8',
      onClick: () => {
        const patientId = `blank-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        savePatientMeta(patientId, { name: '', dob: '', sex: '', created: Date.now() });
        items = getPatientItems();
        renderCards();
        // Auto-expand the new card and focus name input
        requestAnimationFrame(() => {
          const newCard = cardList.querySelector(`[data-patient-id="${patientId}"]`);
          if (newCard) {
            newCard.classList.add('is-open');
            const hdr = newCard.querySelector('.patient-card-header');
            if (hdr) hdr.setAttribute('aria-expanded', 'true');
            const nameField = newCard.querySelector('.patient-name-input');
            if (nameField) nameField.focus();
          }
        });
      },
    },
    [spriteIcon('plus'), '+ New Patient'],
  );

  section.append(
    el('div', { class: 'flex-between mb-16 ai-center' }, [
      el('h2', { class: 'm-0' }, 'My Patients'),
      newPatientBtn,
    ]),
  );

  // Toolbar: search + sort
  const searchInput = el('input', {
    type: 'text',
    placeholder: 'Search patient records...',
    class: 'form-input-standard patient-search',
    onInput: (e) => {
      searchTerm = (e.target.value || '').toLowerCase();
      renderCards();
    },
  });

  const sortSelect = el(
    'select',
    {
      onChange: (e) => {
        sortBy = e.target.value;
        renderCards();
      },
    },
    [
      el('option', { value: 'modified' }, 'Modified (newest)'),
      el('option', { value: 'modified-asc' }, 'Modified (oldest)'),
      el('option', { value: 'title' }, 'Title (A–Z)'),
      el('option', { value: 'title-desc' }, 'Title (Z–A)'),
      el('option', { value: 'status' }, 'Status'),
    ],
  );

  section.append(
    el('div', { class: 'patient-cards-toolbar' }, [
      searchInput,
      el('div', { class: 'patient-cards-sort' }, [el('span', {}, 'Sort:'), sortSelect]),
    ]),
  );

  // Filter tabs
  const tabsRow = el('div', { class: 'patient-filter-tabs' });
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'complete', label: 'Complete' },
    { key: 'not-started', label: 'Not Started' },
  ];
  filters.forEach(({ key, label }) => {
    const tab = el(
      'button',
      {
        class: `patient-filter-tab${key === 'all' ? ' active' : ''}`,
        'data-filter': key,
        onClick: () => {
          filterStatus = key;
          tabsRow
            .querySelectorAll('.patient-filter-tab')
            .forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          renderCards();
        },
      },
      label,
    );
    tabsRow.append(tab);
  });
  section.append(tabsRow);

  // Card list container
  const cardList = el('div', { class: 'patient-card-list' });
  section.append(cardList);

  function getFilteredSorted() {
    let list = items;
    // Search
    if (searchTerm) {
      list = list.filter(
        (it) =>
          it.title.toLowerCase().includes(searchTerm) ||
          (it.name && it.name.toLowerCase().includes(searchTerm)),
      );
    }
    // Filter
    if (filterStatus !== 'all') {
      list = list.filter((it) => it.statusKey === filterStatus);
    }
    // Sort
    list = [...list];
    switch (sortBy) {
      case 'modified':
        list.sort((a, b) => b.ts - a.ts);
        break;
      case 'modified-asc':
        list.sort((a, b) => a.ts - b.ts);
        break;
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'status': {
        const order = { 'in-progress': 0, 'not-started': 1, complete: 2 };
        list.sort((a, b) => (order[a.statusKey] ?? 9) - (order[b.statusKey] ?? 9));
        break;
      }
    }
    return list;
  }

  function renderCards() {
    cardList.replaceChildren();
    const filtered = getFilteredSorted();
    if (filtered.length === 0) {
      const emptyMsg =
        items.length === 0
          ? 'No patient records yet. Click "+ New Patient" to get started.'
          : 'No patient records match your search or filter.';
      cardList.append(el('div', { class: 'patient-cards-empty' }, emptyMsg));
      return;
    }
    filtered.forEach((item) => cardList.append(buildPatientCard(item, refreshPatients)));
  }

  function refreshPatients() {
    items = getPatientItems();
    renderCards();
  }

  renderCards();
  app.append(section);

  return refreshPatients;
}

// ── Route handler ──

route('#/student/cases', async (app) => {
  app.replaceChildren();
  try {
    // My Patients (cards) first
    renderMyPatientsPanel(app);

    let updateCases = null;
    const cases = await _listCaseSummaries({
      onRemoteUpdate: (merged) => {
        if (updateCases) {
          updateCases(merged);
        } else {
          // Remote arrived before initial render finished — keep My Patients, re-render cases table
          const patientsSection = app.querySelector('.patient-cards-section');
          app.replaceChildren();
          if (patientsSection) app.append(patientsSection);
          const drafts = scanDrafts(storage);
          updateCases = makeCasesPanel(app, merged, drafts);
        }
      },
    });
    if (!Array.isArray(cases))
      return appendErrorPanel(app, 'Could not load cases. Please check the console for details.');
    const drafts = scanDrafts(storage);
    if (cases.length === 0) {
      appendNoCasesPanel(app);
    } else {
      updateCases = makeCasesPanel(app, cases, drafts);
    }
  } catch (error) {
    console.error('Failed to render student cases:', error);
    appendErrorPanel(app, 'Error loading cases. Please check the console for details.');
  }
});
