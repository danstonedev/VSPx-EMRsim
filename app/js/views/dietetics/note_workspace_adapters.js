import { getPilotTemplate } from '../../core/noteCatalog.js';
import { ptDisciplineConfig } from '../../features/navigation/pt-discipline-config.js';
import {
  getPtSectionsForTemplate,
  ptSimpleSoapDisciplineConfig,
  renderPtSectionWorkspace,
} from './pt_note_workspace.js';

function createEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'note-editor__pilot-panel-status';
  empty.textContent = 'Section unavailable.';
  return empty;
}

function buildPtSidebarModel(templateId, tracker, draft) {
  const disciplineConfig =
    templateId === 'pt-simple-soap' ? ptSimpleSoapDisciplineConfig : ptDisciplineConfig;

  return {
    variant: 'pt-cards',
    noteLabel: 'My Note',
    sections: getPtSectionsForTemplate(templateId).map((section) => ({
      ...section,
      status: tracker.getSectionStatus(section.id, draft),
      subsections: tracker.getSubsections(section.id).map((subsectionId) => ({
        id: subsectionId,
        label:
          disciplineConfig.subsectionLabels?.[subsectionId] ||
          tracker.getSubsectionLabel(subsectionId),
        status: tracker.getSubsectionStatus(subsectionId, section.id, draft),
      })),
    })),
  };
}

export function createPilotWorkspaceController({
  noteSession,
  dietTracker,
  ptTracker,
  ptSimpleTracker,
  ncpSections,
  dieteticSectionRenderers,
  onDieteticsDraftChange,
  onPtDraftChange,
}) {
  const activeSections = new Map([
    ['dietetics-ncp', 'nutrition-assessment'],
    ['pt-eval', 'subjective'],
    ['pt-simple-soap', 'subjective'],
  ]);
  const activeSubsections = new Map();
  const pendingSubsections = new Map();

  function getCurrentWorkspaceId() {
    return noteSession.getSelectedProfession() === 'dietetics'
      ? 'dietetics-ncp'
      : noteSession.getSelectedTemplateId();
  }

  function buildDieteticsAdapter() {
    return {
      id: 'dietetics-ncp',
      professionId: 'dietetics',
      templateId: 'dietetics-ncp',
      sections: ncpSections,
      tracker: dietTracker,
      helperText: 'Pilot workspace: the Dietetics note stays in this new multidisciplinary shell.',
      launchLabel: 'Continue Nutrition Note',
      introCard: null,
      getDraft() {
        return noteSession.getDietDraft();
      },
      getSidebarModel() {
        return {
          variant: 'simple',
          noteLabel: 'Chart Sections',
          sections: ncpSections.map((section) => ({
            ...section,
            status: dietTracker.getSectionStatus(section.id, noteSession.getDietDraft()),
          })),
        };
      },
      async renderSection(sectionId) {
        const renderer = dieteticSectionRenderers[sectionId];
        return renderer
          ? renderer(noteSession.getDietDraft(), onDieteticsDraftChange)
          : createEmptyState();
      },
      getLoadingState() {
        return null;
      },
    };
  }

  function buildPtAdapter(templateId) {
    const template = getPilotTemplate(templateId);
    const hasDraft = noteSession.pilotTemplateHasDraft(templateId);

    return {
      id: templateId,
      professionId: 'pt',
      templateId,
      sections: getPtSectionsForTemplate(templateId),
      tracker: templateId === 'pt-simple-soap' ? ptSimpleTracker : ptTracker,
      helperText:
        'Use the PT workspace here for section-by-section editing and shared chart navigation.',
      launchLabel: `${hasDraft ? 'Continue' : 'Start'} ${template?.shortLabel || 'PT Note'} Workspace`,
      introCard: null,
      getDraft() {
        return noteSession.ensurePilotPtDraft(templateId);
      },
      getSidebarModel() {
        return buildPtSidebarModel(
          templateId,
          this.tracker,
          noteSession.ensurePilotPtDraft(templateId),
        );
      },
      async renderSection(sectionId) {
        return renderPtSectionWorkspace({
          templateId,
          sectionId,
          draft: noteSession.ensurePilotPtDraft(templateId),
          onDraftChange: (nextDraft) => onPtDraftChange(templateId, nextDraft),
        });
      },
      getLoadingState() {
        const panel = document.createElement('div');
        panel.className = 'panel note-editor__pilot-panel';
        const title = document.createElement('h2');
        title.className = 'note-editor__pilot-panel-title';
        title.textContent = 'Loading PT workspace...';
        const body = document.createElement('p');
        body.className = 'text-secondary';
        body.textContent = 'Preparing the selected PT section inside the multidisciplinary editor.';
        panel.append(title, body);
        return panel;
      },
    };
  }

  function getCurrentAdapter() {
    return noteSession.getSelectedProfession() === 'dietetics'
      ? buildDieteticsAdapter()
      : buildPtAdapter(noteSession.getSelectedTemplateId());
  }

  function getActiveSection() {
    const adapter = getCurrentAdapter();
    return activeSections.get(adapter.id) || adapter.sections[0]?.id || '';
  }

  function setActiveSection(sectionId) {
    activeSections.set(getCurrentWorkspaceId(), sectionId);
    activeSubsections.delete(getCurrentWorkspaceId());
    pendingSubsections.delete(getCurrentWorkspaceId());
  }

  function ensureValidActiveSection() {
    const adapter = getCurrentAdapter();
    const currentSection = getActiveSection();
    if (adapter.sections.some((section) => section.id === currentSection)) return currentSection;
    const fallback = adapter.sections[0]?.id || '';
    if (fallback) {
      activeSections.set(adapter.id, fallback);
    }
    return fallback;
  }

  return {
    ensureValidActiveSection,
    getActiveSection,
    getCurrentAdapter,
    setActiveSection,
    getActiveSubsection() {
      return activeSubsections.get(getCurrentWorkspaceId()) || '';
    },
    setActiveSubsection(subsectionId) {
      const workspaceId = getCurrentWorkspaceId();
      if (subsectionId) {
        activeSubsections.set(workspaceId, subsectionId);
        pendingSubsections.set(workspaceId, subsectionId);
      } else {
        activeSubsections.delete(workspaceId);
        pendingSubsections.delete(workspaceId);
      }
    },
    consumePendingSubsection() {
      const workspaceId = getCurrentWorkspaceId();
      const subsectionId = pendingSubsections.get(workspaceId) || '';
      pendingSubsections.delete(workspaceId);
      return subsectionId;
    },
  };
}
