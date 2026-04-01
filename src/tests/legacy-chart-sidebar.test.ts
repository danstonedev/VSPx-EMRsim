// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createChartSidebar } from '../../app/js/features/navigation/ChartSidebarOrchestrator.js';

function flushAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('legacy chart sidebar orchestrator', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="patient-header-actions"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the default tab and never falls back to a placeholder for supported tabs', async () => {
    const notesSidebar = document.createElement('div');
    notesSidebar.textContent = 'Legacy Sidebar';

    const sidebar = createChartSidebar({
      notesSidebar,
      caseObj: {},
      caseId: 'case-1',
      defaultTab: 'current-note',
      embedStrategy: {
        embed(el, container) {
          container.replaceChildren(el);
        },
        restore() {},
      },
      panelRenderers: {
        'patient-summary': (container) => {
          container.textContent = 'Patient Profile Panel';
        },
        'my-notes': (container) => {
          container.textContent = 'Note History Panel';
        },
      },
    });

    document.body.appendChild(sidebar.wrapper);
    await flushAnimationFrame();

    expect(sidebar.detailPanel.isOpen()).toBe(true);
    expect(sidebar.detailPanel.textContent).toContain('Legacy Sidebar');
    expect(sidebar.detailPanel.textContent).not.toContain('Coming soon');

    sidebar.openTab('patient-summary');
    expect(sidebar.detailPanel.textContent).toContain('Patient Profile Panel');
    expect(sidebar.detailPanel.textContent).not.toContain('Coming soon');

    sidebar.openTab('my-notes');
    expect(sidebar.detailPanel.textContent).toContain('Note History Panel');
    expect(sidebar.detailPanel.textContent).not.toContain('Coming soon');

    sidebar.openTab('case-file');
    expect(notesSidebar.getAttribute('data-sidebar-filter')).toBe('case-file');
    expect(sidebar.detailPanel.textContent).toContain('Legacy Sidebar');
    expect(sidebar.detailPanel.textContent).not.toContain('Coming soon');
  });
});
