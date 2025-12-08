/**
 * CaseBadge - Visual indicators for case source/status
 */
import { el } from './utils.js';

/**
 * Get badge info for a case based on its source
 * @param {Object} caseData - Case summary with source/status fields
 * @returns {Object} Badge configuration { icon, label, className }
 */
export function getCaseBadgeInfo(caseData) {
  if (!caseData) return null;

  // Built-in cases from manifest
  if (caseData.source === 'manifest' || caseData.isBuiltIn) {
    return {
      icon: '📦',
      label: 'Built-in',
      title: 'Built-in case from manifest',
      className: 'case-badge case-badge-builtin',
    };
  }

  // Cloud cases (shared)
  if (caseData.source === 'cloud') {
    return {
      icon: '☁️',
      label: 'Shared',
      title: 'Shared case from database',
      className: 'case-badge case-badge-cloud',
    };
  }

  // Local-only cases (not published)
  if (caseData.source === 'local') {
    return {
      icon: '💾',
      label: 'Local',
      title: 'Local case (not published)',
      className: 'case-badge case-badge-local',
    };
  }

  // Draft indicator (if has draft data)
  if (caseData.isDraft) {
    return {
      icon: '✏️',
      label: 'Draft',
      title: 'Draft in progress',
      className: 'case-badge case-badge-draft',
    };
  }

  return null;
}

/**
 * Create a case badge element
 * @param {Object} caseData - Case summary with source/status fields
 * @returns {HTMLElement|null} Badge element or null
 */
export function createCaseBadge(caseData) {
  const badgeInfo = getCaseBadgeInfo(caseData);
  if (!badgeInfo) return null;

  return el(
    'span',
    {
      class: badgeInfo.className,
      title: badgeInfo.title,
      'aria-label': badgeInfo.label,
    },
    `${badgeInfo.icon} ${badgeInfo.label}`,
  );
}

/**
 * Create author attribution element
 * @param {string} authorName - Author display name
 * @param {string} createdAt - ISO date string
 * @returns {HTMLElement|null}
 */
export function createAuthorBadge(authorName, createdAt = null) {
  if (!authorName) return null;

  const parts = ['Created by ', el('strong', {}, authorName)];

  if (createdAt) {
    try {
      const date = new Date(createdAt);
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      parts.push(` on ${formatted}`);
    } catch (e) {
      // Invalid date, skip
    }
  }

  return el('span', { class: 'case-author text-secondary small' }, parts);
}
