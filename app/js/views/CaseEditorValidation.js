// CaseEditorValidation.js - Handles case editor validation and early returns

import { navigate as urlNavigate } from '../core/url.js';
import { createMissingCaseIdError, createErrorDisplay } from './EditorUIUtils.js';

/**
 * Validates case ID and handles early returns
 * @param {string} caseId - Case ID to validate
 * @param {HTMLElement} app - App element
 * @returns {boolean} True if validation passed, false if early return was triggered
 */
export function validateCaseId(caseId, app) {
  if (!caseId) {
    app.replaceChildren();
    app.append(createMissingCaseIdError());
    return false;
  }

  // Redirect old "new" case routes to use the modal instead
  if (caseId === 'new') {
    urlNavigate('/instructor/cases');
    return false;
  }

  return true;
}

/**
 * Sets up scroll helpers for debugging
 * @param {Object} helpers - Helper functions to expose
 */
export function setupScrollHelpers(helpers) {
  const {
    getHeaderOffsetPx,
    getNearestVisibleAnchorId,
    scrollToAnchorExact,
    getSectionScrollPercent,
    scrollToPercentExact,
  } = helpers;

  // Expose helpers for troubleshooting from the console (non-breaking)
  try {
    window.debugScrollHelpers = {
      getHeaderOffsetPx,
      getNearestVisibleAnchorId,
      scrollToAnchorExact,
      getSectionScrollPercent,
      scrollToPercentExact,
    };
  } catch {
    /* debug helpers are optional */
  }
}

/**
 * Handles case initialization errors
 * @param {Object} caseResult - Case initialization result
 * @param {HTMLElement} app - App element
 * @returns {boolean} True if error was handled, false if initialization was successful
 */
export function handleCaseInitializationError(caseResult, app) {
  if (caseResult.error) {
    app.replaceChildren();
    app.append(createErrorDisplay(caseResult.title, caseResult.message, caseResult.details));
    return true;
  }
  return false;
}
