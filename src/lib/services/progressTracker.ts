import {
  genericProgressCheck,
  hasAnyContent,
  type DisciplineProgressConfig,
  type ProgressStatus,
  type SectionData,
} from '$lib/config/progressUtils';

export type ProgressDraftData = Record<string, Record<string, unknown> | undefined>;

export interface ProgressSubsectionSummary {
  id: string;
  sectionId: string;
  label: string;
  status: ProgressStatus;
}

export interface ProgressSectionSummary {
  id: string;
  label: string;
  icon?: string;
  status: ProgressStatus;
  completeCount: number;
  partialCount: number;
  totalCount: number;
  nextPending: ProgressSubsectionSummary | null;
  subsections: ProgressSubsectionSummary[];
}

export interface ProgressSummary {
  completionPct: number;
  totalSubsections: number;
  completedSubsections: number;
  partialSubsections: number;
  nextPending: ProgressSubsectionSummary | null;
  sections: ProgressSectionSummary[];
}

function asSectionRecord(value: SectionData): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export function getProgressSectionData(
  config: DisciplineProgressConfig,
  draft: ProgressDraftData,
  sectionId: string,
): Record<string, unknown> | undefined {
  const sectionKey = config.sectionKeyMap?.[sectionId] ?? sectionId;
  return asSectionRecord(draft?.[sectionKey]);
}

export function getProgressSubsectionStatus(
  config: DisciplineProgressConfig,
  draft: ProgressDraftData,
  sectionId: string,
  subId: string,
): ProgressStatus {
  const sectionData = getProgressSectionData(config, draft, sectionId);
  const resolver = config.dataResolvers[subId];
  const subData = resolver ? resolver(sectionData) : sectionData?.[subId];
  const requirement = config.requirements[subId];

  if (subData === undefined || subData === null) return 'empty';
  if (requirement) {
    return requirement(subData, sectionData)
      ? 'complete'
      : hasAnyContent(subData)
        ? 'partial'
        : 'empty';
  }

  return genericProgressCheck(subData);
}

export function getProgressSectionStatus(
  config: DisciplineProgressConfig,
  draft: ProgressDraftData,
  sectionId: string,
): ProgressStatus {
  const subsectionIds = config.subsections[sectionId] ?? [];
  if (subsectionIds.length === 0) return 'empty';

  const statuses = subsectionIds.map((subId) =>
    getProgressSubsectionStatus(config, draft, sectionId, subId),
  );

  if (statuses.every((status) => status === 'complete')) return 'complete';
  if (statuses.every((status) => status === 'empty')) return 'empty';
  return 'partial';
}

export function buildProgressSummary(
  config: DisciplineProgressConfig,
  draft: ProgressDraftData,
): ProgressSummary {
  let totalSubsections = 0;
  let completedSubsections = 0;
  let partialSubsections = 0;
  let weightedCompletion = 0;
  let nextPending: ProgressSubsectionSummary | null = null;

  const sections = config.sections.map((section) => {
    const subsectionIds = config.subsections[section.id] ?? [];
    const subsections = subsectionIds.map((subId) => {
      const status = getProgressSubsectionStatus(config, draft, section.id, subId);
      const summary: ProgressSubsectionSummary = {
        id: subId,
        sectionId: section.id,
        label: config.subsectionLabels[subId] ?? subId,
        status,
      };

      totalSubsections += 1;
      if (status === 'complete') {
        completedSubsections += 1;
        weightedCompletion += 1;
      } else if (status === 'partial') {
        partialSubsections += 1;
        weightedCompletion += 0.5;
      }

      if (!nextPending && status !== 'complete') {
        nextPending = summary;
      }

      return summary;
    });

    return {
      id: section.id,
      label: section.label,
      icon: section.icon,
      status: getProgressSectionStatus(config, draft, section.id),
      completeCount: subsections.filter((subsection) => subsection.status === 'complete').length,
      partialCount: subsections.filter((subsection) => subsection.status === 'partial').length,
      totalCount: subsectionIds.length,
      nextPending: subsections.find((subsection) => subsection.status !== 'complete') ?? null,
      subsections,
    } satisfies ProgressSectionSummary;
  });

  return {
    completionPct:
      totalSubsections > 0 ? Math.round((weightedCompletion / totalSubsections) * 100) : 0,
    totalSubsections,
    completedSubsections,
    partialSubsections,
    nextPending,
    sections,
  };
}
