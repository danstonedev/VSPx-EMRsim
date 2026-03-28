export type ProgressStatus = 'empty' | 'partial' | 'complete';

export type SectionData = Record<string, unknown> | undefined;

export function isFieldComplete(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0 && value.some((item) => isFieldComplete(item));
  if (typeof value === 'object') {
    return Object.values(value).some((val) => isFieldComplete(val));
  }
  return Boolean(value);
}

export function hasAnyContent(data: unknown): boolean {
  if (data === null || data === undefined) return false;
  if (typeof data === 'boolean') return false;
  if (typeof data === 'string') return data.trim().length > 0;
  if (typeof data === 'number') return !isNaN(data);
  if (Array.isArray(data)) return data.some((item) => hasAnyContent(item));
  if (typeof data === 'object') {
    return Object.values(data).some((val) => hasAnyContent(val));
  }
  return Boolean(data);
}

export function genericProgressCheck(data: unknown): ProgressStatus {
  if (data === null || data === undefined) return 'empty';
  if (typeof data === 'string') return data.trim() ? 'complete' : 'empty';
  if (Array.isArray(data)) {
    const filled = data.filter(
      (item) =>
        (typeof item === 'string' && item.trim()) ||
        (typeof item === 'object' && item !== null && hasAnyContent(item)),
    );
    if (filled.length === 0) return 'empty';
    if (filled.length === data.length) return 'complete';
    return 'partial';
  }
  if (typeof data === 'object') {
    const vals = Object.values(data);
    const filled = vals.filter((value) => hasAnyContent(value));
    if (filled.length === 0) return 'empty';
    if (filled.length === vals.length) return 'complete';
    return 'partial';
  }
  return 'empty';
}

export interface DisciplineSectionDef {
  id: string;
  label: string;
  icon?: string;
}

export type ProgressRequirementFn = (data: unknown, section: SectionData) => boolean;

export interface DisciplineProgressConfig {
  sections: DisciplineSectionDef[];
  subsections: Record<string, string[]>;
  subsectionLabels: Record<string, string>;
  dataResolvers: Record<string, (section: SectionData) => unknown>;
  requirements: Record<string, ProgressRequirementFn>;
  sectionKeyMap?: Record<string, string>;
}
