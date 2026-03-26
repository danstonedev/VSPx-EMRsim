/**
 * ChartRail – 56 px icon column for Hybrid Two-Panel chart navigation.
 *
 * Renders an accessible tab list of chart section icons. Selecting a tab
 * dispatches a 'chart-tab-select' CustomEvent.  Keyboard arrow navigation
 * and roving tabindex are wired for WCAG compliance.
 */

import { el } from '../../ui/utils.js';

/**
 * @param {Object} opts
 * @param {Array<{id:string, icon:string, label:string}>} opts.tabs
 * @param {string} [opts.activeTab]            – initially active tab id
 * @param {(tabId:string)=>void} [opts.onSelect] – callback on tab change
 * @returns {HTMLElement}                       – <nav class="chart-rail">
 */
export function createChartRail({ tabs, activeTab = '', onSelect }) {
  const nav = el('nav', {
    class: 'chart-rail',
    role: 'tablist',
    'aria-label': 'Chart sections',
    'aria-orientation': 'vertical',
  });

  /** Build one icon button per tab */
  tabs.forEach((tab, idx) => {
    const isActive = tab.id === activeTab;
    const btn = el('button', {
      class: `chart-rail__tab${isActive ? ' chart-rail__tab--active' : ''}`,
      role: 'tab',
      'aria-selected': String(isActive),
      'aria-controls': `panel-${tab.id}`,
      'aria-label': tab.label,
      'data-tab': tab.id,
      'data-label': tab.label,
      tabindex: isActive || (!activeTab && idx === 0) ? '0' : '-1',
      title: tab.label,
    });

    // Icon via SVG sprite (preferred path – stays sharp at any density)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'chart-rail__icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#icon-${tab.icon}`);
    svg.appendChild(use);
    btn.appendChild(svg);

    // Visible mini-label below icon
    const label = el('span', { class: 'chart-rail__label' }, [tab.label]);
    btn.appendChild(label);

    btn.addEventListener('click', () => selectTab(tab.id));
    nav.appendChild(btn);
  });

  /* ---- Roving tabindex keyboard support ---- */
  nav.addEventListener('keydown', (e) => {
    const btns = Array.from(nav.querySelectorAll('[role="tab"]'));
    const idx = btns.indexOf(document.activeElement);
    if (idx === -1) return;

    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      next = (idx + 1) % btns.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      next = (idx - 1 + btns.length) % btns.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = btns.length - 1;
    }
    if (next !== -1) {
      e.preventDefault();
      btns[idx].setAttribute('tabindex', '-1');
      btns[next].setAttribute('tabindex', '0');
      btns[next].focus();
    }
  });

  /* ---- Public helpers ---- */
  function selectTab(tabId) {
    const btns = nav.querySelectorAll('[role="tab"]');
    btns.forEach((b) => {
      const match = b.dataset.tab === tabId;
      b.classList.toggle('chart-rail__tab--active', match);
      b.setAttribute('aria-selected', String(match));
      b.setAttribute('tabindex', match ? '0' : '-1');
    });
    nav.dispatchEvent(new CustomEvent('chart-tab-select', { bubbles: true, detail: { tabId } }));
    if (onSelect) onSelect(tabId);
  }

  /** Programmatically highlight a tab without firing callbacks. */
  nav.setActiveTab = (tabId) => {
    const btns = nav.querySelectorAll('[role="tab"]');
    btns.forEach((b) => {
      const match = b.dataset.tab === tabId;
      b.classList.toggle('chart-rail__tab--active', match);
      b.setAttribute('aria-selected', String(match));
      b.setAttribute('tabindex', match ? '0' : '-1');
    });
  };

  return nav;
}
