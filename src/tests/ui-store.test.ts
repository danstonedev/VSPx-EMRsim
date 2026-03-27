import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  activeChartTab,
  isPanelOpen,
  panelWidth,
  openTab,
  closePanel,
  toggleTab,
} from '$lib/stores/ui';

describe('UI store', () => {
  beforeEach(() => {
    activeChartTab.set(null);
    isPanelOpen.set(false);
    panelWidth.set(360);
  });

  describe('openTab', () => {
    it('sets active tab and opens panel', () => {
      openTab('patient-summary');
      expect(get(activeChartTab)).toBe('patient-summary');
      expect(get(isPanelOpen)).toBe(true);
    });
  });

  describe('closePanel', () => {
    it('clears active tab and closes panel', () => {
      openTab('my-notes');
      closePanel();
      expect(get(activeChartTab)).toBeNull();
      expect(get(isPanelOpen)).toBe(false);
    });
  });

  describe('toggleTab', () => {
    it('opens panel when clicking a new tab', () => {
      toggleTab('current-note');
      expect(get(activeChartTab)).toBe('current-note');
      expect(get(isPanelOpen)).toBe(true);
    });

    it('closes panel when clicking the active tab', () => {
      openTab('case-file');
      toggleTab('case-file');
      expect(get(activeChartTab)).toBeNull();
      expect(get(isPanelOpen)).toBe(false);
    });

    it('switches tabs when clicking a different tab', () => {
      openTab('current-note');
      toggleTab('patient-summary');
      expect(get(activeChartTab)).toBe('patient-summary');
      expect(get(isPanelOpen)).toBe(true);
    });
  });

  describe('panelWidth', () => {
    it('has a default of 360', () => {
      expect(get(panelWidth)).toBe(360);
    });

    it('can be updated', () => {
      panelWidth.set(450);
      expect(get(panelWidth)).toBe(450);
    });
  });
});
