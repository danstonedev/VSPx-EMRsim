// progress.js - extracted refresh logic from ChartNavigation.js
// Lightweight module to avoid pulling the full navigation creation code until needed.
// Eventually createChartNavigation will also be split; for now we lazy-import the monolith on demand.

import { el } from '../../ui/utils.js';

// Copied (not imported) from ChartNavigation.js so that a refresh can re-apply
// subsection visibility rules without forcing the monolith to stay resident.
function setSubsectionCollapsed(anchorEl, collapsed) {
  if (!anchorEl) return;
  const header = anchorEl.querySelector('h4.subsection-title');
  const children = Array.from(anchorEl.children || []);
  children.forEach((child) => {
    if (child !== header) child.style.display = collapsed ? 'none' : '';
  });
  if (header) header.style.opacity = collapsed ? '0.85' : '1';
}

function applySubsectionVisibilityControls({
  activeSection,
  isFacultyMode,
  caseData,
  onEditorSettingsChange,
}) {
  try {
    const sectionRoot = document.querySelector(`.${activeSection}-section`);
    if (!sectionRoot) return;
    const anchors = Array.from(sectionRoot.querySelectorAll('.section-anchor'));
    const visAll = caseData?.editorSettings?.visibility || {};
    const secVis = visAll[activeSection] || {};

    anchors.forEach((anchorEl) => {
      const subId = anchorEl.id;
      const visible = secVis[subId] !== false; // default true
      const header = anchorEl.querySelector('h4.subsection-title');
      if (!header) return;

      if (isFacultyMode) {
        if (!header.dataset.flexified) {
          header.style.display = 'flex';
          header.style.alignItems = 'center';
          header.style.justifyContent = 'space-between';
          header.dataset.flexified = 'true';
        }
        let toggleWrap = header.querySelector('.subsection-visibility-toggle');
        if (!toggleWrap) {
          toggleWrap = el(
            'label',
            {
              class: 'subsection-visibility-toggle und-toggle',
              style:
                'margin-left:auto; display:flex; align-items:center; gap:10px; font-weight:500; font-size:12px; color: var(--text-secondary); position: relative;',
            },
            [
              el('input', {
                type: 'checkbox',
                class: 'und-toggle-input',
                'aria-label': 'Toggle subsection visibility',
                'aria-checked': 'false',
                style: 'position:absolute; opacity:0; width:0; height:0;',
              }),
              el('span', { class: 'und-toggle-track', 'aria-hidden': 'true' }, [
                el('span', { class: 'und-toggle-thumb' }),
              ]),
            ],
          );
          header.appendChild(toggleWrap);
        }
        const checkbox = toggleWrap.querySelector('input[type="checkbox"]');
        checkbox.checked = !!visible;
        checkbox.setAttribute('aria-checked', checkbox.checked ? 'true' : 'false');
        checkbox.onchange = (e) => {
          const next = JSON.parse(JSON.stringify(caseData.editorSettings || { visibility: {} }));
          if (!next.visibility[activeSection]) next.visibility[activeSection] = {};
          next.visibility[activeSection][subId] = e.target.checked;
          setSubsectionCollapsed(anchorEl, !e.target.checked);
          onEditorSettingsChange?.(next);
          checkbox.setAttribute('aria-checked', e.target.checked ? 'true' : 'false');
        };
        setSubsectionCollapsed(anchorEl, !visible);
        anchorEl.style.display = '';
      } else {
        anchorEl.style.display = visible ? '' : 'none';
      }
    });
  } catch (e) {
    console.warn('applySubsectionVisibilityControls error:', e);
  }
}

/**
 * Refreshes the chart navigation with updated progress data
 * NOTE: Dynamically imports createChartNavigation to avoid pulling the full
 * implementation until first refresh is needed.
 * @param {HTMLElement} sidebar - The sidebar element to refresh
 * @param {Object} config - Updated navigation configuration
 */
export async function refreshChartNavigation(sidebar, config) {
  const { createChartNavigation } = await import('./create.js');
  const newSidebar = createChartNavigation(config);
  // Replace the entire node so a placeholder element can hydrate itself later
  if (sidebar && sidebar.parentNode) {
    try {
      sidebar.replaceWith(newSidebar);
    } catch {
      /* element may not exist */
      // Fallback: replace children if replaceWith is not supported
      sidebar.replaceChildren(...Array.from(newSidebar.children));
    }
  }
  setTimeout(() => {
    try {
      applySubsectionVisibilityControls({
        activeSection: config.activeSection,
        isFacultyMode: !!config.isFacultyMode,
        caseData: config.caseData || {},
        onEditorSettingsChange: config.onEditorSettingsChange,
      });
    } catch {
      /* element may not exist */
    }
  }, 0);
}
