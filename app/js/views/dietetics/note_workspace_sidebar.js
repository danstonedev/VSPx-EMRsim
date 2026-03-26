import { storage } from '../../core/index.js';
import { el } from '../../ui/utils.js';
import { getCaseFileEntryMeta, groupCaseFileEntries } from '../../core/casefile-repository.js';
const NOTE_GROUP_COLLAPSED_KEY = 'pilot_workspace_note_group_collapsed_v1';
const PT_SECTION_COLLAPSE_KEY = 'pilot_workspace_pt_section_collapse_v1';

function loadBooleanState(key, fallback = false) {
  try {
    return storage.getItem(key) === '1';
  } catch {
    return fallback;
  }
}

function saveBooleanState(key, value) {
  try {
    storage.setItem(key, value ? '1' : '0');
  } catch (e) {
    console.warn('[Dietetics] save boolean sidebar state failed:', e);
  }
}

function loadJsonState(key) {
  try {
    return JSON.parse(storage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
}

function saveJsonState(key, value) {
  try {
    storage.setItem(key, JSON.stringify(value || {}));
  } catch (e) {
    console.warn('[Dietetics] save sidebar JSON state failed:', e);
  }
}

function getAggregateStatus(statuses = []) {
  const hasComplete = statuses.includes('complete');
  const hasEmpty = statuses.includes('empty');
  const hasPartial = statuses.includes('partial');
  if (hasPartial || (hasComplete && hasEmpty)) return 'partial';
  if (hasComplete && !hasEmpty) return 'complete';
  return 'empty';
}

export function createPilotWorkspaceSidebar({
  caseObj,
  isFacultyMode,
  getCaseModules,
  saveCaseModules,
  openCaseFileViewer,
  getArtifactTypeLabel,
  noteSession,
  workspaceController,
  onSectionChange,
  onLaunch,
  materialIcon,
}) {
  let noteGroupCollapsed = loadBooleanState(NOTE_GROUP_COLLAPSED_KEY, false);
  let ptSectionCollapseState = loadJsonState(PT_SECTION_COLLAPSE_KEY);

  const caseFileBody = el('div', {
    class: 'note-editor__casefile-body',
    'data-sidebar-section': 'case-file',
  });

  const navList = el('div', {
    class: 'note-editor__sections-list',
    'data-sidebar-section': 'current-note',
  });

  const signExportMount = el('div', {
    class: 'note-editor__sidebar-signexport',
    'data-sidebar-section': 'sign-export',
  });

  const sidebar = el('nav', { class: 'note-editor__sidebar', 'aria-label': 'Note workspace' }, [
    caseFileBody,
    navList,
    signExportMount,
  ]);

  function applySidebarFilter() {
    const activeFilter = sidebar.getAttribute('data-sidebar-filter') || '';
    const sectionNodes = sidebar.querySelectorAll('[data-sidebar-section]');

    sectionNodes.forEach((node) => {
      const section = node.getAttribute('data-sidebar-section') || '';
      const isVisible =
        !activeFilter ||
        section === activeFilter ||
        (activeFilter === 'current-note' && section === 'sign-export');

      node.hidden = !isVisible;
      node.setAttribute('aria-hidden', String(!isVisible));
      node.style.display = isVisible ? '' : 'none';
    });
  }

  const filterObserver = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.attributeName === 'data-sidebar-filter')) {
      applySidebarFilter();
    }
  });

  filterObserver.observe(sidebar, {
    attributes: true,
    attributeFilter: ['data-sidebar-filter'],
  });

  function setNoteGroupCollapsed(nextValue) {
    noteGroupCollapsed = !!nextValue;
    saveBooleanState(NOTE_GROUP_COLLAPSED_KEY, noteGroupCollapsed);
  }

  function getWorkspaceSectionCollapsed(workspaceId, sectionId, activeSectionId) {
    const workspaceState = ptSectionCollapseState[workspaceId] || {};
    if (Object.prototype.hasOwnProperty.call(workspaceState, sectionId)) {
      return !!workspaceState[sectionId];
    }
    return sectionId !== activeSectionId;
  }

  function setWorkspaceSectionCollapsed(workspaceId, sectionId, nextValue) {
    ptSectionCollapseState = {
      ...ptSectionCollapseState,
      [workspaceId]: {
        ...(ptSectionCollapseState[workspaceId] || {}),
        [sectionId]: !!nextValue,
      },
    };
    saveJsonState(PT_SECTION_COLLAPSE_KEY, ptSectionCollapseState);
  }

  function renderSimpleSectionButtons(sidebarModel, tracker) {
    const activeSectionId = workspaceController.getActiveSection();

    return sidebarModel.sections.map((section) =>
      el(
        'button',
        {
          class: `note-editor__sidebar-item ${section.id === activeSectionId ? 'note-editor__sidebar-item--active' : ''}`,
          'data-section': section.id,
          onclick: () => {
            workspaceController.setActiveSection(section.id);
            onSectionChange();
            updateSidebarStatus();
          },
        },
        [
          tracker.createIndicator(section.status),
          el('span', { class: 'note-editor__sidebar-icon' }, [materialIcon(section.icon)]),
          el('span', {}, section.label),
        ],
      ),
    );
  }

  function renderPtSectionCards(adapter, sidebarModel) {
    const activeSectionId = workspaceController.getActiveSection();
    const activeSubsectionId = workspaceController.getActiveSubsection?.() || '';
    const noteStatus = getAggregateStatus(sidebarModel.sections.map((section) => section.status));

    const noteHeader = el(
      'button',
      {
        class: 'note-editor__pt-note-header',
        'aria-expanded': String(!noteGroupCollapsed),
        'data-status': noteStatus,
        onclick: () => {
          setNoteGroupCollapsed(!noteGroupCollapsed);
          renderCurrentNoteWorkspace();
        },
      },
      [
        el(
          'span',
          { class: 'note-editor__pt-note-header-title' },
          sidebarModel.noteLabel || 'My Note',
        ),
        el('span', { class: 'note-editor__pt-note-header-twisty', 'aria-hidden': 'true' }, ''),
      ],
    );

    const sectionsWrap = el('div', {
      class: `note-editor__pt-sections ${noteGroupCollapsed ? 'is-collapsed' : ''}`,
    });

    if (!noteGroupCollapsed) {
      sectionsWrap.replaceChildren(
        ...sidebarModel.sections.map((section) => {
          const isActive = section.id === activeSectionId;
          const isCollapsed = getWorkspaceSectionCollapsed(adapter.id, section.id, activeSectionId);
          const mainButton = el(
            'button',
            {
              class: `note-editor__pt-section-button ${isActive ? 'is-active' : ''}`,
              'data-section': section.id,
              onclick: () => {
                workspaceController.setActiveSection(section.id);
                setWorkspaceSectionCollapsed(adapter.id, section.id, false);
                onSectionChange();
                updateSidebarStatus();
              },
            },
            [
              adapter.tracker.createIndicator(section.status),
              el('span', { class: 'note-editor__sidebar-icon' }, [materialIcon(section.icon)]),
              el('span', { class: 'note-editor__pt-section-label' }, section.label),
            ],
          );

          const collapseButton = el(
            'button',
            {
              class: `note-editor__pt-section-toggle ${isCollapsed ? 'is-collapsed' : ''}`,
              'aria-label': `${isCollapsed ? 'Expand' : 'Collapse'} ${section.label} subsections`,
              'aria-expanded': String(!isCollapsed),
              onclick: (event) => {
                event.preventDefault();
                event.stopPropagation();
                setWorkspaceSectionCollapsed(adapter.id, section.id, !isCollapsed);
                renderCurrentNoteWorkspace();
              },
            },
            '',
          );

          const subsectionList = el('div', {
            class: `note-editor__pt-subsections ${isCollapsed ? 'is-collapsed' : ''}`,
          });

          if (!isCollapsed) {
            subsectionList.replaceChildren(
              ...section.subsections.map((subsection) =>
                el(
                  'button',
                  {
                    class: `note-editor__pt-subsection-item ${isActive && activeSubsectionId === subsection.id ? 'is-active' : ''}`,
                    'data-subsection': subsection.id,
                    onclick: () => {
                      setWorkspaceSectionCollapsed(adapter.id, section.id, false);
                      workspaceController.setActiveSection(section.id);
                      workspaceController.setActiveSubsection?.(subsection.id);
                      onSectionChange();
                      updateSidebarStatus();
                    },
                  },
                  [
                    adapter.tracker.createIndicator(subsection.status),
                    el('span', { class: 'note-editor__pt-subsection-label' }, subsection.label),
                  ],
                ),
              ),
            );
          }

          return el(
            'div',
            {
              class: `note-editor__pt-section-card ${isActive ? 'is-active' : ''} ${isCollapsed ? 'is-collapsed' : ''}`,
              'data-status': section.status,
            },
            [
              el('div', { class: 'note-editor__pt-section-header' }, [mainButton, collapseButton]),
              subsectionList,
            ],
          );
        }),
      );
    }

    return [noteHeader, sectionsWrap];
  }

  function renderCurrentNoteWorkspace() {
    const selectedTemplateId = noteSession.getSelectedTemplateId();
    const adapter = workspaceController.getCurrentAdapter();
    const sidebarModel = adapter.getSidebarModel?.() || {
      variant: 'simple',
      noteLabel: 'Chart Sections',
      sections: adapter.sections,
    };

    const selectorCard = el('div', { class: 'note-editor__pilot-selector' }, [
      el('div', { class: 'note-editor__sidebar-title' }, 'Note Workspace'),
      el('p', { class: 'note-editor__pilot-helper text-secondary' }, adapter.helperText),
      el(
        'button',
        {
          class: 'btn primary note-editor__pilot-launch',
          onclick: () => onLaunch(selectedTemplateId),
        },
        adapter.launchLabel,
      ),
    ]);

    const children = [selectorCard];

    if (adapter.introCard) {
      children.push(
        el('div', { class: 'note-editor__pilot-handoff' }, [
          el('h3', { class: 'note-editor__pilot-handoff-title' }, adapter.introCard.title),
          el('p', { class: 'text-secondary' }, adapter.introCard.description),
          el('p', { class: 'note-editor__pilot-handoff-status' }, adapter.introCard.status),
        ]),
      );
    }

    if (sidebarModel.variant === 'pt-cards') {
      children.push(...renderPtSectionCards(adapter, sidebarModel));
    } else {
      children.push(el('div', { class: 'note-editor__sidebar-title' }, sidebarModel.noteLabel));
      children.push(...renderSimpleSectionButtons(sidebarModel, adapter.tracker));
    }

    navList.replaceChildren(...children);
    applySidebarFilter();
  }

  function renderCaseFileBody() {
    const modules = getCaseModules();
    const groupedRows = groupCaseFileEntries(modules).map((group) =>
      el('section', { class: 'note-editor__casefile-group' }, [
        el('h3', { class: 'note-editor__casefile-group-title' }, group.label),
        el(
          'div',
          { class: 'note-editor__casefile-group-list' },
          group.items.map((mod) =>
            el(
              'button',
              {
                class: 'note-editor__casefile-item',
                title: mod.title || 'Case File Entry',
                onclick: () =>
                  openCaseFileViewer(mod, {
                    onRemove: (id) => {
                      const next = getCaseModules().filter((m) => m.id !== id);
                      saveCaseModules(next);
                      renderCaseFileBody();
                    },
                    onAmend: () => renderCaseFileBody(),
                  }),
              },
              [
                el(
                  'span',
                  { class: 'note-editor__casefile-item-title' },
                  mod.title || 'Untitled entry',
                ),
                el(
                  'span',
                  { class: 'note-editor__casefile-item-type' },
                  getArtifactTypeLabel(mod.type),
                ),
                ...(getCaseFileEntryMeta(mod).length
                  ? [
                      el(
                        'span',
                        { class: 'note-editor__casefile-item-meta' },
                        getCaseFileEntryMeta(mod).join(' • '),
                      ),
                    ]
                  : []),
              ],
            ),
          ),
        ),
      ]),
    );

    const controls = isFacultyMode
      ? [
          el(
            'button',
            {
              class: 'btn secondary small note-editor__casefile-add',
              title: 'Add Case File entry',
              onclick: async () => {
                try {
                  const { openAddArtifactModal } =
                    await import('../../features/navigation/ChartNavigation.js');
                  openAddArtifactModal((mod) => {
                    const next = [...getCaseModules(), mod];
                    saveCaseModules(next);
                    renderCaseFileBody();
                  });
                } catch (e) {
                  console.warn('[Dietetics] openAddArtifactModal failed:', e);
                }
              },
            },
            '+ Add',
          ),
        ]
      : [];

    caseFileBody.replaceChildren(
      ...(groupedRows.length
        ? groupedRows
        : [el('div', { class: 'note-editor__casefile-empty' }, 'No Case File entries yet.')]),
      ...controls,
    );
    applySidebarFilter();
  }

  function mountSignExport() {
    setTimeout(() => {
      import('../../features/navigation/sign-export-panel.js')
        .then((m) => {
          try {
            m.render(signExportMount, { caseData: caseObj || {} });
          } catch (e) {
            console.warn('[Dietetics] sign-export mount failed:', e);
          }
        })
        .catch((e) => console.warn('[Dietetics] sign-export import failed:', e));
    }, 0);
  }

  function updateSidebarStatus() {
    renderCurrentNoteWorkspace();
    applySidebarFilter();
  }

  renderCurrentNoteWorkspace();
  renderCaseFileBody();
  mountSignExport();
  applySidebarFilter();

  return {
    sidebar,
    rerenderCurrentNoteWorkspace: renderCurrentNoteWorkspace,
    updateSidebarStatus,
    refreshCaseFileView: renderCaseFileBody,
  };
}
