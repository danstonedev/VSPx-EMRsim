// SidebarProgressTracker.js — Reusable progress-tracking engine for editor sidebars
//
// Extracts the discipline-agnostic parts of ChartNavigation's progress system
// so that any profession (PT, Dietetics, OT, SLP…) can get tri-state
// completion tracking by supplying a discipline config object.
//
// Usage:
//   import { createProgressTracker } from './SidebarProgressTracker.js';
//   const tracker = createProgressTracker(ptDisciplineConfig);
//   const status  = tracker.getSectionStatus('subjective', draftData);
//   const dot     = tracker.createIndicator(status);

import { el } from '../../ui/utils.js';

// ── Field-level helpers (generic) ──────────────────────────────────

/** Returns true when a value contains meaningful user content. */
export function isFieldComplete(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0 && value.some((item) => isFieldComplete(item));
  if (typeof value === 'object') {
    return Object.values(value).some((val) => isFieldComplete(val));
  }
  return Boolean(value);
}

/** Returns true when *any* descendant field has content (for 'partial' state). */
export function hasAnyContent(data) {
  function hasContent(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value)) return value.some((item) => hasContent(item));
    if (typeof value === 'object') {
      return Object.values(value).some((val) => hasContent(val));
    }
    return Boolean(value);
  }
  return hasContent(data);
}

/** Fallback status for unknown subsection shapes. */
export function genericSubsectionCheck(data) {
  if (Array.isArray(data)) {
    const filled = data.filter((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') {
        return Object.values(item).some((v) => v && v.toString().trim());
      }
      return false;
    });
    if (filled.length === 0) return 'empty';
    if (filled.length === data.length) return 'complete';
    return 'partial';
  }
  if (typeof data === 'string') return data.trim() ? 'complete' : 'empty';
  if (typeof data === 'object' && data !== null) {
    const vals = Object.values(data);
    const filled = vals.filter((v) => v && v.toString().trim());
    if (filled.length === 0) return 'empty';
    if (filled.length === vals.length) return 'complete';
    return 'partial';
  }
  return 'empty';
}

// ── Subsection status engine ───────────────────────────────────────

/**
 * Compute tri-state status for a single subsection.
 *
 * @param {*}      subsectionData   - Resolved data for this subsection
 * @param {string} subsectionType   - ID key (e.g. 'pain-assessment')
 * @param {*}      fullSectionData  - Entire parent section data (for validators that need siblings)
 * @param {Object} requirementsMap  - Discipline-supplied `{ [subsectionId]: (data, section) => bool }`
 * @returns {'empty'|'partial'|'complete'}
 */
export function getSubsectionStatus(
  subsectionData,
  subsectionType,
  fullSectionData,
  requirementsMap,
) {
  if (subsectionData === undefined || subsectionData === null) return 'empty';

  const requirement = requirementsMap[subsectionType];
  if (requirement) {
    const isComplete = requirement(subsectionData, fullSectionData);
    return isComplete ? 'complete' : hasAnyContent(subsectionData) ? 'partial' : 'empty';
  }
  return genericSubsectionCheck(subsectionData);
}

// ── Section-level aggregation ──────────────────────────────────────

/**
 * Aggregate subsection statuses into one section-level status.
 *
 * @param {string}   sectionId      - e.g. 'subjective'
 * @param {Object}   draftData      - Full draft/caseData object
 * @param {Object}   disciplineConfig - See createProgressTracker for shape
 * @returns {'empty'|'partial'|'complete'}
 */
export function calculateSectionStatus(sectionId, draftData, disciplineConfig) {
  const { subsections, dataResolvers, requirements } = disciplineConfig;
  const sectionData = draftData?.[sectionId];
  const subIds = subsections[sectionId] || [];
  if (subIds.length === 0) return 'empty';

  const statuses = subIds.map((subId) => {
    const resolver = dataResolvers[subId];
    const subData = resolver ? resolver(sectionData) : sectionData?.[subId];
    return getSubsectionStatus(subData, subId, sectionData, requirements);
  });

  if (statuses.every((s) => s === 'complete')) return 'complete';
  if (statuses.every((s) => s === 'empty')) return 'empty';
  return 'partial';
}

// ── Visual indicator ───────────────────────────────────────────────

const STATUS_COLORS = {
  empty: 'var(--border)',
  partial: 'var(--und-orange)',
  complete: 'var(--und-green)',
};

/**
 * Render a small coloured dot representing a tri-state status.
 * Returns an HTMLElement.
 */
export function createProgressIndicator(status) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.empty;
  return el('div', {
    class: 'progress-indicator',
    'data-status': status,
    'aria-label': `Status: ${status}`,
    style: [
      'width:12px',
      'height:12px',
      'border-radius:50%',
      `background:${status === 'empty' ? 'var(--bg)' : color}`,
      `border:2px solid ${color}`,
      'margin-right:10px',
      'flex-shrink:0',
    ].join(';'),
  });
}

// ── Factory ────────────────────────────────────────────────────────

/**
 * Create a progress tracker bound to a discipline config.
 *
 * @param {Object} disciplineConfig
 * @param {Object} disciplineConfig.sections        - Array of `{ id, label, icon }` for top-level sections
 * @param {Object} disciplineConfig.subsections      - `{ [sectionId]: ['sub-a', 'sub-b', …] }`
 * @param {Object} disciplineConfig.subsectionLabels - `{ [subId]: 'Human-Readable Title' }`
 * @param {Object} disciplineConfig.dataResolvers    - `{ [subId]: (sectionData) => resolvedData }`
 * @param {Object} disciplineConfig.requirements     - `{ [subId]: (data, sectionData) => boolean }`
 *
 * @returns {{ getSectionStatus, getSubsectionStatus, createIndicator, sections }}
 */
export function createProgressTracker(disciplineConfig) {
  const { sections, requirements, dataResolvers, subsections } = disciplineConfig;

  return {
    /** Top-level section definitions for sidebar rendering. */
    sections,

    /**
     * Get tri-state status for a whole section.
     * @param {string} sectionId
     * @param {Object} draftData - Full draft object
     * @returns {'empty'|'partial'|'complete'}
     */
    getSectionStatus(sectionId, draftData) {
      return calculateSectionStatus(sectionId, draftData, disciplineConfig);
    },

    /**
     * Get tri-state status for a single subsection.
     * @param {string} subId
     * @param {string} sectionId
     * @param {Object} draftData
     * @returns {'empty'|'partial'|'complete'}
     */
    getSubsectionStatus(subId, sectionId, draftData) {
      const sectionData = draftData?.[sectionId];
      const resolver = dataResolvers[subId];
      const subData = resolver ? resolver(sectionData) : sectionData?.[subId];
      return getSubsectionStatus(subData, subId, sectionData, requirements);
    },

    /** Render a progress dot for a given status string. */
    createIndicator: createProgressIndicator,

    /** Subsection IDs for a given section. */
    getSubsections(sectionId) {
      return subsections[sectionId] || [];
    },

    /** Human-readable label for a subsection ID. */
    getSubsectionLabel(subId) {
      return disciplineConfig.subsectionLabels?.[subId] || subId;
    },
  };
}
