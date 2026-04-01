/**
 * Template system entry point.
 *
 * Import this module to register all discipline templates.
 * Re-exports the public API for template resolution and context.
 */

import { registerTemplates } from './templateRegistry';
import { PT_TEMPLATES } from './disciplines/pt';
import { OT_TEMPLATES } from './disciplines/ot';
import { SLP_TEMPLATES } from './disciplines/slp';
import { NURSING_TEMPLATES } from './disciplines/nursing';
import { DIETETICS_TEMPLATES } from './disciplines/dietetics';

// Register all discipline templates
registerTemplates([
  ...PT_TEMPLATES,
  ...OT_TEMPLATES,
  ...SLP_TEMPLATES,
  ...NURSING_TEMPLATES,
  ...DIETETICS_TEMPLATES,
]);

// Re-export public API
export { findTemplate, getTemplate, listTemplates, resolveTemplate } from './templateRegistry';
export {
  useNoteTemplate,
  isSubsectionVisible,
  isSectionVisible,
  isSubsectionDefaultOpen,
  getSubsectionConfig,
} from './templateContext';
export type {
  NoteTemplate,
  ResolvedNoteTemplate,
  SubsectionConfig,
  SectionTemplateConfig,
  SettingId,
  VisitTypeId,
  NoteFormat,
  AssessmentDefault,
} from './templateTypes';
