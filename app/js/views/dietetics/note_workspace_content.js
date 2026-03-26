import { el } from '../../ui/utils.js';

export function createPilotWorkspaceContent({ workspaceController, onSyncGlobals }) {
  const contentPane = el('div', { class: 'note-editor__content' });
  let contentRenderVersion = 0;
  let lastRenderedSectionId = '';

  function afterLayout(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  function getWorkspaceHeaderOffset() {
    const root = document.documentElement;
    const styles = window.getComputedStyle(root);
    const topbar = Number.parseFloat(styles.getPropertyValue('--topbar-h')) || 0;
    const patientHeaderVar = Number.parseFloat(styles.getPropertyValue('--patient-sticky-h')) || 0;
    const patientHeaderEl = document.getElementById('patient-sticky-header');
    const patientHeaderLive = patientHeaderEl?.offsetHeight || 0;
    const patientHeader = Math.max(patientHeaderVar, patientHeaderLive);

    if (patientHeader > 0 && patientHeader !== patientHeaderVar) {
      root.style.setProperty('--patient-sticky-h', `${patientHeader}px`);
    }

    return topbar + patientHeader + 20;
  }

  function scrollAnchorIntoView(anchor, behavior = 'auto') {
    if (!anchor) return;
    const targetTop =
      window.scrollY + anchor.getBoundingClientRect().top - getWorkspaceHeaderOffset();
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior,
    });
  }

  function realignTop({ onlyWhenNearTop = false } = {}) {
    const threshold = getWorkspaceHeaderOffset() + 180;
    if (onlyWhenNearTop && window.scrollY > threshold) return;

    afterLayout(() => {
      const primaryAnchor = contentPane.firstElementChild || contentPane;
      scrollAnchorIntoView(primaryAnchor, 'auto');
    });
  }

  function revealPendingSubsection() {
    const subsectionId = workspaceController.consumePendingSubsection?.();
    if (!subsectionId) return;

    afterLayout(() => {
      const selector = window.CSS?.escape
        ? `#${window.CSS.escape(subsectionId)}`
        : `[id="${subsectionId}"]`;
      const anchor = contentPane.querySelector(selector);
      if (!anchor) return;
      scrollAnchorIntoView(anchor, 'smooth');
    });
  }

  async function renderContent({ forceScrollTop = false } = {}) {
    const renderVersion = ++contentRenderVersion;
    workspaceController.ensureValidActiveSection();
    onSyncGlobals();
    const adapter = workspaceController.getCurrentAdapter();
    const activeSectionId = workspaceController.getActiveSection();
    const shouldResetScroll = forceScrollTop || activeSectionId !== lastRenderedSectionId;
    const loadingState = adapter.getLoadingState?.();

    if (loadingState) {
      contentPane.replaceChildren(loadingState);
    } else {
      contentPane.replaceChildren();
    }

    const sectionContent = await adapter.renderSection(activeSectionId);

    if (renderVersion !== contentRenderVersion) return;
    contentPane.replaceChildren(sectionContent || el('div', {}, 'Section unavailable.'));
    lastRenderedSectionId = activeSectionId;

    if (shouldResetScroll) {
      realignTop();
    }

    revealPendingSubsection();
  }

  return {
    contentPane,
    renderContent,
    realignTop,
  };
}
