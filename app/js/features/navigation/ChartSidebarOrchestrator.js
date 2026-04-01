/**
 * ChartSidebarOrchestrator — discipline-agnostic
 *
 * Wires the ChartRail (icon column) + ChartDetailPanel (sliding panel)
 * together with ANY discipline's existing sidebar.  The caller supplies
 * an `embedStrategy` that knows how to reparent and restore the sidebar
 * for their specific discipline.
 *
 * Usage (any discipline):
 *   createChartSidebar({
 *     notesSidebar:  myDisciplineSidebar,
 *     caseObj:       caseObject,
 *     embedStrategy: { embed(el, container), restore(el) },
 *   });
 *
 * Returns a wrapper element + public helpers that any editor can mount.
 */

import { createChartRail } from './ChartRail.js';
import { createChartDetailPanel } from './ChartDetailPanel.js';
import { getChartTabs } from './chart-tab-config.js';
import { renderPatientSummary } from './panels/PatientSummaryPanel.js';
import { renderMyNotes } from './panels/MyNotesPanel.js';
import { mountNoteStatusBadge, deriveNoteStatus } from './panels/NoteStatusBadge.js';
import { mountActiveNoteIndicator } from './panels/ActiveNoteIndicator.js';
import { getDraftTemplateLabel, getProfessionLabel } from '../../core/noteCatalog.js';

/** Tabs that display the discipline sidebar inside the panel */
const SIDEBAR_TABS = new Set(['current-note', 'case-file']);

function normalizeCurrentNoteVisibility(sidebar) {
  const currentNoteHeader = sidebar.querySelector('.current-encounter-header');
  const currentNoteSections = sidebar.querySelector('.note-sections');

  if (!currentNoteHeader || !currentNoteSections) return;

  currentNoteHeader.setAttribute('aria-expanded', 'true');
  currentNoteSections.classList.remove('is-collapsed');
  currentNoteSections.style.maxHeight = 'none';
  currentNoteSections.style.opacity = '1';
  currentNoteSections.style.transform = 'translateY(0)';
}

/**
 * @param {Object} opts
 * @param {HTMLElement}  opts.notesSidebar   – the discipline's sidebar element
 * @param {Object}       opts.caseObj        – full case object (for patient summary)
 * @param {string}       [opts.caseId='']    – case identifier for draft lookups
 * @param {number}       [opts.maxPhase=1]   – which tabs are visible
 * @param {string}       [opts.defaultTab='current-note'] – tab to auto-open on mount
 * @param {{embed:(el:HTMLElement,container:HTMLElement)=>void, restore:(el:HTMLElement)=>void}} opts.embedStrategy
 * @param {Object}       [opts.panelRenderers] – optional {tabId:(container,caseObj)=>void}
 * @returns {{
 *   wrapper: HTMLElement,
 *   rail: HTMLElement,
 *   detailPanel: HTMLElement,
 *   notesSidebar: HTMLElement,
 *   openTab: (tabId:string)=>void,
 *   closePanel: ()=>void,
 * }}
 */
export function createChartSidebar({
  notesSidebar,
  caseObj,
  caseId = '',
  maxPhase = 1,
  defaultTab = 'current-note',
  embedStrategy,
  panelRenderers = {},
}) {
  const tabs = getChartTabs(maxPhase);

  /* ---- Hidden holder keeps sidebar in DOM when not in panel ---- */
  const hiddenHolder = document.createElement('div');
  hiddenHolder.style.display = 'none';
  hiddenHolder.setAttribute('aria-hidden', 'true');
  hiddenHolder.appendChild(notesSidebar);

  /** Park sidebar safely in the hidden holder */
  function parkSidebar() {
    notesSidebar.removeAttribute('data-sidebar-filter');
    embedStrategy.restore(notesSidebar);
    if (!hiddenHolder.contains(notesSidebar)) {
      hiddenHolder.appendChild(notesSidebar);
    }
  }

  /* ---- Detail Panel ---- */
  const detailPanel = createChartDetailPanel({
    renderContent(tabId, container) {
      // When switching to a non-sidebar tab, park the sidebar first
      if (!SIDEBAR_TABS.has(tabId) && !hiddenHolder.contains(notesSidebar)) {
        parkSidebar();
      }

      // Custom renderer takes priority
      if (panelRenderers[tabId]) {
        panelRenderers[tabId](container, caseObj);
        return;
      }

      // Default rendering
      if (SIDEBAR_TABS.has(tabId)) {
        notesSidebar.setAttribute('data-sidebar-filter', tabId);
        embedStrategy.embed(notesSidebar, container);
        if (tabId === 'current-note') {
          normalizeCurrentNoteVisibility(notesSidebar);
        }
      } else if (tabId === 'patient-summary') {
        renderPatientSummary(container, caseObj);
      } else if (tabId === 'my-notes') {
        renderMyNotes(container, caseObj, caseId);
      } else {
        container.replaceChildren();
        console.warn('[ChartSidebar] No renderer registered for tab:', tabId);
      }
    },
    onClose() {
      parkSidebar();
      rail.setActiveTab('');
      document.body.classList.remove('chart-panel-open');
    },
  });

  /* ---- Chart Rail ---- */
  const rail = createChartRail({
    tabs,
    activeTab: '',
    onSelect(tabId) {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;
      detailPanel.show(tabId, tab.label);

      if (detailPanel.isOpen()) {
        document.body.classList.add('chart-panel-open');
      } else {
        document.body.classList.remove('chart-panel-open');
        parkSidebar();
      }
    },
  });

  /* ---- Wrapper ---- */
  const wrapper = document.createElement('div');
  wrapper.className = 'chart-sidebar-wrapper';
  wrapper.appendChild(rail);
  wrapper.appendChild(detailPanel);
  wrapper.appendChild(hiddenHolder);

  // Auto-open the default tab after the DOM is mounted
  const defTab = tabs.find((t) => t.id === defaultTab);
  if (defTab) {
    requestAnimationFrame(() => {
      rail.setActiveTab(defaultTab);
      detailPanel.show(defaultTab, defTab.label);
      document.body.classList.add('chart-panel-open');
    });
  }

  // Mount the note-status badge + active-note label into the patient header.
  // Both mount functions try document.getElementById('patient-header-actions')
  // synchronously, but editors typically append the header to the DOM AFTER
  // createChartSidebar returns.  So we create the elements eagerly (update()
  // works on detached nodes), then ensure they're inserted once the DOM is
  // settled via requestAnimationFrame.
  const initialDraft = (typeof window !== 'undefined' && window.currentDraft) || {};
  const statusBadge = mountNoteStatusBadge(deriveNoteStatus(initialDraft));

  const noteIndicator = mountActiveNoteIndicator('', '');

  // Backfill label from the already-set globals (syncActiveNoteSession ran
  // before createChartSidebar in both editors).
  if (typeof window !== 'undefined' && window.currentEditorContext) {
    const ctx = window.currentEditorContext;
    const draft = window.currentDraft || {};
    noteIndicator.update(
      getDraftTemplateLabel(draft, ctx.encounter),
      getProfessionLabel(ctx.professionId),
    );
  }

  // Deferred DOM insertion: retry once the caller has appended the header.
  requestAnimationFrame(() => {
    const actions = document.getElementById('patient-header-actions');
    if (actions) {
      // Insert order: indicator first, then badge prepended before it
      // Visual result: [Note Label] [Status Badge] ...other buttons
      if (!actions.contains(statusBadge.element)) {
        actions.prepend(statusBadge.element);
      }
      if (!actions.contains(noteIndicator.element)) {
        actions.prepend(noteIndicator.element);
      }
    }
  });

  // Expose helpers globally so panels (MyNotesPanel) can trigger tab switches
  // and status updates without tight coupling.
  function openTab(tabId) {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      rail.setActiveTab(tabId);
      detailPanel.show(tabId, tab.label);
      document.body.classList.add('chart-panel-open');
    }
  }

  if (typeof window !== 'undefined') {
    window.chartSidebarOpenTab = openTab;
    window.updateNoteStatusBadge = (s) => statusBadge.update(s);
    window.updateActiveNoteLabel = (label, profession) => noteIndicator.update(label, profession);
  }

  return {
    wrapper,
    rail,
    detailPanel,
    notesSidebar,
    statusBadge,
    openTab,
    closePanel() {
      detailPanel.hide();
    },
  };
}
