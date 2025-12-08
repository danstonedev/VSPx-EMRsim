import { route } from '../../core/router.js';
import { navigate as urlNavigate } from '../../core/url.js';
import { createCaseBadge, createAuthorBadge } from '../../ui/CaseBadge.js';
async function _listCaseSummaries() {
  const store = await import('../../core/store.js');
  if (typeof store.listCaseSummaries === 'function') {
    return store.listCaseSummaries();
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

// Modal to create a blank SOAP note (not tied to a case)
function openCreateNoteModal() {
  const overlay = el('div', {
    class:
      'modal-overlay popup-overlay-base fixed inset-0 overlay-50 d-flex ai-center jc-center z-modal',
    onclick: (e) => {
      if (e.target === overlay) close();
    },
  });
  const defaultTitle = `Blank SOAP Note — ${new Date().toLocaleDateString()}`;
  const content = el(
    'div',
    {
      class: 'modal-content case-details-modal popup-card-base',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Create SOAP Note',
      onclick: (e) => e.stopPropagation(),
    },
    [
      // Header (inherits green band styles from case-details-modal)
      el('div', { class: 'modal-header' }, [
        el('h3', {}, 'Create SOAP Note'),
        el('button', { class: 'close-btn', 'aria-label': 'Close', onclick: () => close() }, '✕'),
      ]),
      // Body
      el('div', { class: 'modal-body case-details-body' }, [
        el(
          'form',
          {
            onsubmit: (e) => {
              e.preventDefault();
              const input = content.querySelector('#student-note-title-input');
              const title = (input && input.value ? input.value : '').trim() || 'Blank SOAP Note';
              const id = `blank-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
              try {
                const draftKey = `draft_${id}_eval`;
                const initialDraft = { noteTitle: title, __savedAt: Date.now() };
                storage.setItem(draftKey, JSON.stringify(initialDraft));
              } catch (e2) {
                console.warn('Could not pre-save blank note draft:', e2);
              }
              close();
              urlNavigate('/student/editor', { case: id, v: 0, encounter: 'eval' });
            },
          },
          [
            el('div', { class: 'instructor-form-field' }, [
              el(
                'label',
                { class: 'instructor-form-label', for: 'student-note-title-input' },
                'Note Title',
              ),
              el('input', {
                id: 'student-note-title-input',
                name: 'student-note-title-input',
                type: 'text',
                class: 'instructor-form-input',
                value: defaultTitle,
                placeholder: 'e.g., Shoulder Pain Eval - Aug 2025',
              }),
            ]),
            // Actions
            el('div', { class: 'modal-actions' }, [
              el(
                'button',
                { type: 'button', class: 'btn secondary', onclick: () => close() },
                'Cancel',
              ),
              el('button', { type: 'submit', class: 'btn primary' }, 'Create'),
            ]),
          ],
        ),
      ]),
    ],
  );
  function close() {
    overlay.classList.remove('is-open');
    content.classList.remove('is-open');
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const removeNow = () => {
      try {
        document.removeEventListener('keydown', onKey);
        // Clean inline fallback styles if applied
        overlay.style.opacity = '';
        const card = overlay.querySelector('.popup-card-base');
        if (card) {
          card.style.opacity = '';
          card.style.transform = '';
        }
        overlay.remove();
      } catch {}
    };
    if (prefersReduce) return removeNow();
    overlay.addEventListener('transitionend', removeNow, { once: true });
    setTimeout(removeNow, 480);
  }
  overlay.append(content);
  document.body.append(overlay);
  // Esc to close
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    content.classList.add('is-open');
    // Mobile/sticky transition fallback
    setTimeout(() => {
      try {
        const card = overlay.querySelector('.popup-card-base');
        const overlayStyle = getComputedStyle(overlay);
        const cardStyle = card ? getComputedStyle(card) : null;
        if (overlayStyle && overlayStyle.opacity === '0') overlay.style.opacity = '1';
        if (card && cardStyle && cardStyle.opacity === '0') {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }
      } catch {}
      content.querySelector('#student-note-title-input')?.focus();
    }, 90);
  });
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
      let completedSections = sectionCompletionCount(draftData);
      if (hasObjectiveContent(draftData)) completedSections++;
      const totalSections = 6; // 5 sections + 1 objective
      const completionPercent = Math.round((completedSections / totalSections) * 100);

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

// Build the exportable Word HTML content from a draft
function createExportDocHTML(c, draft) {
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

function buildActionButtons(c, evalDraft, storage, urlNavigate) {
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
              urlNavigate('/student/cases');
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
              urlNavigate('/student/cases');
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

function createCaseRow(c, drafts, storage, urlNavigate) {
  const draftInfo = drafts[c.id];
  const evalDraft = draftInfo?.eval;
  const statusContent = buildStatusContent(evalDraft);
  const actionButtons = buildActionButtons(c, evalDraft, storage, urlNavigate);
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

function makeCasesPanel(app, cases, drafts) {
  let searchTerm = '';

  const casesPanel = el('div', { class: 'panel' }, [
    el('div', { class: 'flex-between mb-16 ai-center' }, [
      el('div', {}, [el('h2', {}, 'Student Dashboard')]),
      el('div', { class: 'd-flex gap-10' }, [
        el(
          'button',
          {
            class: 'btn primary d-flex ai-center gap-8',
            title: 'Create a blank SOAP note not attached to a case',
            onClick: () => openCreateNoteModal(),
          },
          [spriteIcon('plus'), 'Create SOAP Note'],
        ),
      ]),
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
        filtered.map((c) => createCaseRow(c, drafts, storage, urlNavigate)),
      ),
    ]);
    const existing = casesPanel.querySelector('.table-responsive');
    if (existing) existing.remove();
    const wrapper = el('div', { class: 'table-responsive' }, table);
    casesPanel.append(wrapper);
  }

  renderTable();
}

function safeJsonParse(str) {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

function getBlankNoteItems() {
  const items = storage
    .keys()
    .filter((k) => k && k.startsWith('draft_blank'))
    .map((key) => {
      const data = safeJsonParse(storage.getItem(key)) || {};
      const ts = data.__savedAt || 0;
      const title =
        (data.noteTitle && data.noteTitle.trim()) || key.replace('draft_', '').replace('_eval', '');
      return { key, title, ts };
    })
    .sort((a, b) => b.ts - a.ts || a.title.localeCompare(b.title));
  return items;
}

function renderBlankNotesPanel(app) {
  const blankItems = getBlankNoteItems();
  const headerRow = el('div', { class: 'mb-8' }, [el('h3', { class: 'm-0' }, 'My Blank Notes')]);
  const panelChildren = [
    headerRow,
    el('p', { class: 'small m-0' }, 'Manage scratch SOAP notes not tied to a case.'),
  ];
  if (blankItems.length > 0) {
    const list = el('ul', { class: 'mt-8 pl-18' });
    blankItems.forEach(({ key, title }) => {
      const noteId = key.replace('draft_', '').replace('_eval', '');
      const li = el('li', { class: 'mb-6' }, [
        el('span', { class: 'mr-12 fw-500' }, title),
        el(
          'button',
          {
            class: 'btn primary small mr-6',
            onClick: () =>
              urlNavigate('/student/editor', { case: noteId, v: 0, encounter: 'eval' }),
          },
          'Open',
        ),
        el(
          'button',
          {
            class: 'btn subtle-danger small',
            onClick: () => {
              if (confirm('Delete this blank note?')) {
                storage.removeItem(key);
                urlNavigate('/student/cases');
              }
            },
          },
          'Remove',
        ),
      ]);
      list.append(li);
    });
    panelChildren.push(list);
  } else {
    panelChildren.push(
      el(
        'p',
        { class: 'small text-secondary mt-8' },
        'No blank notes yet. Create one to get started.',
      ),
    );
  }
  app.append(el('div', { class: 'panel' }, panelChildren));
}
route('#/student/cases', async (app) => {
  app.replaceChildren();
  try {
    const cases = await _listCaseSummaries();
    if (!Array.isArray(cases))
      return appendErrorPanel(app, 'Could not load cases. Please check the console for details.');
    if (cases.length === 0) return appendNoCasesPanel(app);
    const drafts = scanDrafts(storage);
    makeCasesPanel(app, cases, drafts);
    renderBlankNotesPanel(app);
  } catch (error) {
    console.error('Failed to render student cases:', error);
    appendErrorPanel(app, 'Error loading cases. Please check the console for details.');
  }
});
