import { REGIONS } from '$lib/config/regionalAssessments';
import type { RomDef, MmtDef, SpecialTestDef, RegionDef } from '$lib/config/regionalAssessments';

export interface CaseAnchors {
  title?: string;
  region?: string;
  condition?: string;
  age?: number | string;
  sex?: string;
  pain?: number;
  acuity?: string;
  setting?: string;
  prompt?: string;
  goal?: string;
}

export type Acuity = 'acute' | 'subacute' | 'chronic';

export interface RegionTemplate {
  teaser: string;
  chiefComplaint: string;
  hpi: string;
  rom: Record<string, string>;
  mmt: Record<string, string>;
  prom: Record<string, { left: string; right: string; notes: string }>;
  specialTests: Record<string, { name: string; left: string; right: string; notes: string }>;
  impairments: string[];
  prognosis: string;
  defaultGoal: string;
  plan: {
    frequency: string;
    duration: string;
    interventions: string[];
    stg: string;
    ltg: string;
  };
  icd10: { code: string; desc: string };
  cpt: string[];
  prognosticFactors: string;
}

export interface GeneratedCase {
  title: string;
  setting: string;
  patientAge: number;
  patientGender: string;
  acuity: string;
  patientDOB: undefined;
  createdBy: 'faculty';
  createdAt: string;
  meta: {
    title: string;
    setting: string;
    patientAge: number;
    patientGender: string;
    acuity: string;
    diagnosis: string;
    regions: string[];
    generated: true;
  };
  snapshot: { age: string; sex: string; teaser: string };
  history: {
    chief_complaint: string;
    hpi: string;
    pmh: string[];
    meds: string[];
    red_flag_signals: string[];
  };
  findings: {
    rom: Record<string, string>;
    mmt: Record<string, string>;
    special_tests: Record<string, unknown>[];
    outcome_options: string[];
  };
  encounters: {
    eval: {
      subjective: Record<string, unknown>;
      objective: Record<string, unknown>;
      assessment: Record<string, unknown>;
      plan: Record<string, unknown>;
      billing: Record<string, unknown>;
      generated: true;
    };
  };
}

export function generateCase(anchors: CaseAnchors = {}): GeneratedCase {
  const ctx = buildGenerationContext(anchors);
  const template = getRegionTemplate(ctx.regionSlug, ctx.acuity, ctx.condition, ctx.pain, ctx.goal);
  return buildCaseFromTemplate(ctx, template);
}

interface GenerationContext {
  title: string;
  region: string;
  condition: string;
  age: number;
  sex: string;
  pain: number;
  acuity: string;
  setting: string;
  prompt: string;
  goal: string;
  regionSlug: string;
}

function buildGenerationContext(anchors: CaseAnchors | undefined): GenerationContext {
  const title = anchors?.title || '';
  const region = anchors?.region || 'shoulder';
  const condition = anchors?.condition || 'Rotator cuff tendinopathy';
  const age = anchors?.age ?? 45;
  const sex = anchors?.sex || 'female';
  const pain = anchors?.pain ?? 5;
  const acuity = anchors?.acuity || 'chronic';
  const setting = anchors?.setting || 'Outpatient';
  const prompt = anchors?.prompt || '';
  const goal = anchors?.goal || '';

  return {
    title,
    region,
    condition,
    age: normalizeAge(age),
    sex: normalizeSex(sex),
    pain,
    acuity,
    setting,
    prompt,
    goal,
    regionSlug: normalizeRegionSlug(region),
  };
}

function buildMeta(ctx: GenerationContext, template: RegionTemplate) {
  return {
    title: ctx.title || template.teaser,
    setting: ctx.setting,
    patientAge: ctx.age,
    patientGender: ctx.sex,
    acuity: ctx.acuity,
    diagnosis: 'Musculoskeletal',
    regions: ctx.regionSlug ? [ctx.regionSlug] : [],
    generated: true as const,
  };
}

function buildHistory(ctx: GenerationContext, template: RegionTemplate) {
  const hpi = ctx.prompt ? `${ctx.prompt} ${template.hpi}`.trim() : template.hpi;
  return {
    chief_complaint: template.chiefComplaint,
    hpi,
    pmh: [],
    meds: [],
    red_flag_signals: [],
  };
}

function buildFindings(template: RegionTemplate) {
  return {
    rom: template.rom || {},
    mmt: template.mmt || {},
    special_tests: Array.isArray(template.specialTests) ? template.specialTests : [],
    outcome_options: [],
  };
}

function buildSubjective(ctx: GenerationContext, template: RegionTemplate) {
  return {
    chiefComplaint: template.chiefComplaint,
    historyOfPresentIllness: ctx.prompt ? `${ctx.prompt} ${template.hpi}`.trim() : template.hpi,
    painScale: String(ctx.pain ?? ''),
    patientGoals: ctx.goal || template.defaultGoal,
  };
}

function buildObjective(ctx: GenerationContext, template: RegionTemplate) {
  return {
    regionalAssessments: {
      selectedRegions: [ctx.regionSlug],
      rom: template.rom || {},
      mmt: template.mmt || {},
      prom: template.prom || {},
      specialTests: template.specialTests || {},
    },
  };
}

function buildAssessment(ctx: GenerationContext, template: RegionTemplate) {
  return {
    primaryImpairments: template.impairments ? template.impairments.join('; ') : '',
    ptDiagnosis: ctx.condition,
    prognosis: template.prognosis?.toLowerCase() || 'good',
    prognosticFactors: template.prognosticFactors || '',
  };
}

function buildPlan(template: RegionTemplate) {
  return {
    frequency: template.plan?.frequency || '',
    duration: template.plan?.duration || '',
    interventions: template.plan?.interventions || [],
    shortTermGoals: template.plan?.stg || '',
    longTermGoals: template.plan?.ltg || '',
  };
}

function buildBilling(template: RegionTemplate) {
  return {
    diagnosisCodes: template.icd10
      ? [
          {
            code: template.icd10.code,
            description: template.icd10.desc,
            isPrimary: true,
          },
        ]
      : [],
    billingCodes: template.cpt ? template.cpt.map((code) => ({ code, units: '1' })) : [],
  };
}

function buildEncounterEval(ctx: GenerationContext, template: RegionTemplate) {
  return {
    subjective: buildSubjective(ctx, template),
    objective: buildObjective(ctx, template),
    assessment: buildAssessment(ctx, template),
    plan: buildPlan(template),
    billing: buildBilling(template),
    generated: true as const,
  };
}

function buildCaseFromTemplate(ctx: GenerationContext, template: RegionTemplate): GeneratedCase {
  return {
    title:
      ctx.title ||
      `${capitalize(ctx.region)} ${capitalize(ctx.condition)} (${capitalize(ctx.acuity)})`,
    setting: ctx.setting,
    patientAge: ctx.age,
    patientGender: ctx.sex,
    acuity: ctx.acuity,
    patientDOB: undefined,
    createdBy: 'faculty',
    createdAt: new Date().toISOString(),
    meta: buildMeta(ctx, template),
    snapshot: { age: String(ctx.age), sex: ctx.sex, teaser: template.teaser },
    history: buildHistory(ctx, template),
    findings: buildFindings(template),
    encounters: { eval: buildEncounterEval(ctx, template) },
  };
}

function capitalize(str: unknown): string {
  const text = (str || '').toString().trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function normalizeSex(sex: unknown): string {
  if (!sex) return 'unspecified';
  const normalized = String(sex).toLowerCase().trim();
  if (normalized === 'prefer-not-to-say') return 'unspecified';
  if (['male', 'female', 'other', 'unspecified'].includes(normalized)) return normalized;
  return 'unspecified';
}

export function normalizeAge(age: unknown): number {
  const ageNum = typeof age === 'number' ? age : parseInt(String(age), 10);
  return !isNaN(ageNum) && ageNum > 0 && ageNum < 120 ? ageNum : 45;
}

export function normalizeRegionSlug(region: string): string {
  const regionMap: Record<string, string> = {
    'low back': 'lumbar-spine',
    'lower back': 'lumbar-spine',
    lumbar: 'lumbar-spine',
    neck: 'cervical-spine',
    cervical: 'cervical-spine',
    'upper back': 'thoracic-spine',
    thoracic: 'thoracic-spine',
  };
  const key = (region || '').toLowerCase().trim();
  return regionMap[key] || key || 'shoulder';
}

const FREQUENCY_RULES = [
  { re: /(^|\b)1x(\b|\/|\s)|1x per week|once per week/i, out: '1x-week' },
  { re: /(^|\b)2x(\b|\/|\s)|2x per week|twice per week/i, out: '2x-week' },
  { re: /(^|\b)3x(\b|\/|\s)|3x per week|three times per week/i, out: '3x-week' },
  { re: /(^|\b)4x(\b|\/|\s)|4x per week|four times per week/i, out: '4x-week' },
  { re: /(^|\b)5x(\b|\/|\s)|5x per week|daily|five times per week/i, out: '5x-week' },
  { re: /2x per day|twice a day|twice daily/i, out: '2x-day' },
  { re: /\bprn\b|as needed/i, out: 'prn' },
];

export function mapFrequencyToEnum(frequency: string = ''): string {
  const s = String(frequency).toLowerCase();
  if (!s) return '';
  const rule = FREQUENCY_RULES.find((r) => r.re.test(s));
  return rule ? rule.out : s;
}

const DURATION_RULES = [
  { re: /\b2\b.*week|\b2\s*weeks/i, out: '2-weeks' },
  { re: /\b4\b.*week|\b4\s*weeks/i, out: '4-weeks' },
  { re: /\b6\b.*week|\b6\s*weeks/i, out: '6-weeks' },
  { re: /\b8\b.*week|\b8\s*weeks/i, out: '8-weeks' },
  { re: /\b12\b.*week|\b12\s*weeks/i, out: '12-weeks' },
  { re: /\b16\b.*week|\b16\s*weeks/i, out: '16-weeks' },
  { re: /\b6\b.*month|\b6\s*months/i, out: '6-months' },
  { re: /ongoing|indefinite/i, out: 'ongoing' },
];

export function mapDurationToEnum(duration: string = ''): string {
  const s = String(duration).toLowerCase();
  if (!s) return '';
  const rule = DURATION_RULES.find((r) => r.re.test(s));
  return rule ? rule.out : s;
}

export function generateSmartGoals(
  region: string,
  condition: string,
  patientGoal: string,
  acuity: string,
  painLevel: number,
) {
  const timeframes: Record<string, { short: string; long: string }> = {
    acute: { short: '1-2 weeks', long: '4-6 weeks' },
    subacute: { short: '2-3 weeks', long: '6-8 weeks' },
    chronic: { short: '3-4 weeks', long: '8-12 weeks' },
  };

  const timeframe = timeframes[acuity] || timeframes.chronic;
  const painReduction = Math.max(1, Math.floor(painLevel / 2));
  const baseGoal = patientGoal || getDefaultGoalForRegion(region);

  return {
    shortTerm: `In ${timeframe.short}, patient will demonstrate measurable progress toward ${baseGoal} with pain reduced by ${painReduction} points and improved function.`,
    longTerm: `In ${timeframe.long}, patient will achieve ${baseGoal} with pain ≤ 2/10, restored strength/ROM, and return to desired activities.`,
  };
}

export function getDefaultGoalForRegion(region: string): string {
  const regionGoals: Record<string, string> = {
    shoulder: 'pain-free overhead reaching and lifting up to 20 lbs',
    'cervical-spine': 'pain-free neck rotation and improved posture',
    'lumbar-spine': 'pain-free lifting and prolonged sitting tolerance',
    knee: 'pain-free stair climbing and return to recreational activities',
    ankle: 'pain-free weight bearing and improved balance',
    hip: 'improved mobility and return to functional activities',
    elbow: 'pain-free gripping and lifting activities',
    'thoracic-spine': 'improved posture and reduced pain with prolonged activities',
  };
  return regionGoals[region] || 'improved function and reduced pain';
}

function processUIRomData(
  uiRomData: RomDef[],
  acuity: string,
  painLevel: number,
  affectedSide = 'R',
) {
  if (!uiRomData || !Array.isArray(uiRomData)) return {};

  const romData: Record<
    string,
    {
      leftValue: string;
      rightValue: string;
      leftNormal: string;
      rightNormal: string;
      leftPain: string;
      rightPain: string;
    }
  > = {};

  const impairmentFactors: Record<string, { percentage: number; variation: number }> = {
    acute: { percentage: 0.6, variation: 0.1 },
    subacute: { percentage: 0.75, variation: 0.1 },
    chronic: { percentage: 0.8, variation: 0.15 },
  };

  const factor = impairmentFactors[acuity] || impairmentFactors.chronic;

  const groupedData: Record<string, { leftNormal?: number; rightNormal?: number }> = {};
  uiRomData.forEach((romItem) => {
    if (!romItem.joint) return;
    const jointName = romItem.joint;
    if (!groupedData[jointName]) groupedData[jointName] = {};
    const normalValue = parseInt(String(romItem.normal).replace('°', ''), 10) || 0;
    if (romItem.side === 'L') groupedData[jointName].leftNormal = normalValue;
    else if (romItem.side === 'R') groupedData[jointName].rightNormal = normalValue;
  });

  Object.keys(groupedData).forEach((jointName, index) => {
    const joint = groupedData[jointName];
    const seed = (jointName.charCodeAt(0) + index) / 100;
    const randomFactor = 1 + Math.sin(seed) * factor.variation;
    const impairment = factor.percentage * randomFactor;
    const leftNormal = joint.leftNormal || 0;
    const rightNormal = joint.rightNormal || 0;
    const leftValue = Math.round(leftNormal * (affectedSide === 'L' ? impairment : 0.95));
    const rightValue = Math.round(rightNormal * (affectedSide === 'R' ? impairment : 0.95));

    romData[jointName] = {
      leftValue: String(leftValue),
      rightValue: String(rightValue),
      leftNormal: String(leftNormal),
      rightNormal: String(rightNormal),
      leftPain: affectedSide === 'L' ? String(Math.min(painLevel, 8)) : '0',
      rightPain: affectedSide === 'R' ? String(Math.min(painLevel, 8)) : '0',
    };
  });

  return romData;
}

function processUIMMTData(uiMMTData: MmtDef[], acuity: string, affectedSide = 'R') {
  if (!uiMMTData || !Array.isArray(uiMMTData)) return {};

  const mmtData: Record<string, { leftGrade: string; rightGrade: string }> = {};

  const gradesByAcuity: Record<string, string[]> = {
    acute: ['3-', '3', '3+'],
    subacute: ['3+', '4-', '4'],
    chronic: ['4', '4+', '5-'],
  };

  const grades = gradesByAcuity[acuity] || gradesByAcuity.chronic;

  uiMMTData.forEach((mmtItem, index) => {
    if (!mmtItem.muscle) return;
    const gradeIndex = index % grades.length;
    mmtData[mmtItem.muscle] = {
      leftGrade: affectedSide === 'L' ? grades[gradeIndex] : '5',
      rightGrade: affectedSide === 'R' ? grades[gradeIndex] : '5',
    };
  });

  return mmtData;
}

function processUIPROMData(
  uiRomData: RomDef[],
  acuity: string,
  painLevel: number,
  affectedSide = 'R',
) {
  if (!uiRomData || !Array.isArray(uiRomData)) return {};

  const promData: Record<
    string,
    {
      leftValue: string;
      rightValue: string;
      leftEndFeel: string;
      rightEndFeel: string;
      leftPain: string;
      rightPain: string;
    }
  > = {};

  const endFeelPatterns: Record<string, string[]> = {
    acute: ['muscle spasm', 'empty', 'hard'],
    subacute: ['firm', 'hard', 'springy'],
    chronic: ['firm', 'springy', 'hard'],
  };

  const endFeels = endFeelPatterns[acuity] || endFeelPatterns.chronic;

  const impairmentFactors: Record<string, { percentage: number; variation: number }> = {
    acute: { percentage: 0.7, variation: 0.1 },
    subacute: { percentage: 0.8, variation: 0.1 },
    chronic: { percentage: 0.85, variation: 0.1 },
  };

  const factor = impairmentFactors[acuity] || impairmentFactors.chronic;

  const groupedData: Record<string, { leftNormal?: number; rightNormal?: number }> = {};
  uiRomData.forEach((romItem) => {
    if (!romItem.joint) return;
    const jointName = romItem.joint;
    if (!groupedData[jointName]) groupedData[jointName] = {};
    const normalValue = parseInt(String(romItem.normal).replace('°', ''), 10) || 0;
    if (romItem.side === 'L') groupedData[jointName].leftNormal = normalValue;
    else if (romItem.side === 'R') groupedData[jointName].rightNormal = normalValue;
  });

  Object.keys(groupedData).forEach((jointName, index) => {
    const joint = groupedData[jointName];
    const seed = (jointName.charCodeAt(0) + index) / 100;
    const randomFactor = 1 + Math.sin(seed) * factor.variation;
    const impairment = factor.percentage * randomFactor;
    const leftNormal = joint.leftNormal || 0;
    const rightNormal = joint.rightNormal || 0;
    const leftValue = Math.round(leftNormal * (affectedSide === 'L' ? impairment + 0.1 : 0.98));
    const rightValue = Math.round(rightNormal * (affectedSide === 'R' ? impairment + 0.1 : 0.98));
    const endFeelIndex = index % endFeels.length;
    const endFeel = endFeels[endFeelIndex];

    promData[jointName] = {
      leftValue: String(Math.min(leftValue, leftNormal)),
      rightValue: String(Math.min(rightValue, rightNormal)),
      leftEndFeel: affectedSide === 'L' ? endFeel : 'normal',
      rightEndFeel: affectedSide === 'R' ? endFeel : 'normal',
      leftPain: affectedSide === 'L' ? String(Math.max(0, painLevel - 1)) : '0',
      rightPain: affectedSide === 'R' ? String(Math.max(0, painLevel - 1)) : '0',
    };
  });

  return promData;
}

function formatSpecialTestsData(specialTestsArray: SpecialTestDef[] = []) {
  if (!Array.isArray(specialTestsArray)) return {};

  const testsData: Record<string, { leftResult: string; rightResult: string }> = {};

  specialTestsArray.forEach((test, index) => {
    if (!test.name) return;
    const seed = test.name.charCodeAt(0) + index;
    const isPositive = seed % 3 === 0;
    const bilateralPositive = seed % 5 === 0;

    testsData[test.name] = {
      leftResult: bilateralPositive || isPositive ? 'positive' : 'negative',
      rightResult: bilateralPositive || (isPositive && index % 2 === 1) ? 'positive' : 'negative',
    };
  });

  return testsData;
}

function buildUIRomTableData(
  items: RomDef[] = [],
  romByJoint: Record<string, { leftValue?: string; rightValue?: string }> = {},
) {
  const out: Record<string, string> = {};
  items.forEach((item, index) => {
    const name = item.joint;
    const row = romByJoint[name];
    if (!row) return;
    if (item.side === 'L') out[index] = row.leftValue ?? '';
    if (item.side === 'R') out[index] = row.rightValue ?? '';
    if (!item.side) {
      out[index] = (row.rightValue ?? row.leftValue ?? '').toString();
    }
  });
  return out;
}

function buildUIMmtTableData(
  items: MmtDef[] = [],
  mmtByMuscle: Record<string, { leftGrade?: string; rightGrade?: string }> = {},
) {
  const out: Record<string, string> = {};
  items.forEach((item, index) => {
    const name = item.muscle;
    const row = mmtByMuscle[name];
    if (!row) return;
    if (item.side === 'L') out[index] = row.leftGrade ?? '';
    if (item.side === 'R') out[index] = row.rightGrade ?? '';
    if (!item.side) out[index] = row.rightGrade ?? row.leftGrade ?? '';
  });
  return out;
}

function buildUIPromTableData(
  items: RomDef[] = [],
  promByJoint: Record<
    string,
    { leftValue?: string; rightValue?: string; leftEndFeel?: string; rightEndFeel?: string }
  > = {},
  sideLetter = 'R',
) {
  const out: Record<string, { left: string; right: string; notes: string }> = {};
  const groups: Record<string, { normal: string; hasL: boolean; hasR: boolean }> = {};
  items.forEach((item) => {
    const baseName = item.joint;
    if (!groups[baseName]) groups[baseName] = { normal: item.normal, hasL: false, hasR: false };
    if (item.side === 'L') groups[baseName].hasL = true;
    else if (item.side === 'R') groups[baseName].hasR = true;
  });
  Object.keys(groups).forEach((baseName) => {
    const key = baseName.toLowerCase().replace(/\s+/g, '-');
    const prom = promByJoint[baseName] || {};
    out[key] = {
      left: prom.leftValue || '',
      right: prom.rightValue || '',
      notes: (sideLetter === 'L' ? prom.leftEndFeel : prom.rightEndFeel) || '',
    };
  });
  return out;
}

function buildUISpecialTestsTableData(
  items: SpecialTestDef[] = [],
  specialByName: Record<string, { leftResult?: string; rightResult?: string }> = {},
) {
  const out: Record<string, { name: string; left: string; right: string; notes: string }> = {};
  items.forEach((item, index) => {
    const key = `test-${index}`;
    const row = specialByName[item.name] || {};
    const left = row.leftResult || '';
    const right = row.rightResult || '';
    out[key] = { name: item.name, left, right, notes: '' };
  });
  return out;
}

export function getRegionTemplate(
  regionSlug: string,
  acuity: string,
  condition: string,
  painLevel: number,
  patientGoal: string,
): RegionTemplate {
  const regionData = (REGIONS as Record<string, RegionDef>)[regionSlug];
  if (!regionData) {
    return getBasicTemplate(condition, acuity, painLevel, patientGoal);
  }

  const affectedSide = painLevel > 6 ? 'bilateral' : 'R';
  const sideLetter = affectedSide === 'bilateral' ? 'R' : affectedSide;

  const romByJoint = processUIRomData(regionData.rom || [], acuity, painLevel, sideLetter);
  const mmtByMuscle = processUIMMTData(regionData.mmt || [], acuity, sideLetter);
  const promByJoint = processUIPROMData(regionData.rom || [], acuity, painLevel, sideLetter);
  const specialByName = formatSpecialTestsData(regionData.specialTests || []);

  const rom = buildUIRomTableData(regionData.rom || [], romByJoint);
  const mmt = buildUIMmtTableData(regionData.mmt || [], mmtByMuscle);
  const prom = buildUIPromTableData(regionData.rom || [], promByJoint, sideLetter);
  const specialTests = buildUISpecialTestsTableData(regionData.specialTests || [], specialByName);

  const goals = generateSmartGoals(regionSlug, condition, patientGoal, acuity, painLevel);

  return {
    teaser: `${capitalize(acuity)} ${condition.toLowerCase()} - ${capitalize(regionSlug.replace('-', ' '))}`,
    chiefComplaint: `${capitalize(acuity)} ${regionSlug.replace('-', ' ')} pain and dysfunction`,
    hpi: generateHPI(condition, acuity, regionSlug, painLevel),
    rom,
    mmt,
    prom,
    specialTests,
    impairments: generateImpairments(regionSlug, acuity),
    prognosis: generatePrognosis(acuity, painLevel),
    defaultGoal: getDefaultGoalForRegion(regionSlug),
    plan: {
      frequency: mapFrequencyToEnum(getFrequencyForAcuity(acuity)),
      duration: mapDurationToEnum(getDurationForAcuity(acuity)),
      interventions: getInterventionsForRegion(regionSlug),
      stg: goals.shortTerm,
      ltg: goals.longTerm,
    },
    icd10: getICD10ForCondition(condition),
    cpt: getCPTForAcuity(acuity),
    prognosticFactors: generatePrognosticFactors(acuity, painLevel),
  };
}

function getBasicTemplate(
  condition: string,
  acuity: string,
  painLevel: number,
  patientGoal: string,
): RegionTemplate {
  const goals = generateSmartGoals('general', condition, patientGoal, acuity, painLevel);

  return {
    teaser: `${capitalize(acuity)} ${condition.toLowerCase()}`,
    chiefComplaint: `${capitalize(acuity)} musculoskeletal pain and dysfunction`,
    hpi: generateHPI(condition, acuity, 'general', painLevel),
    rom: {},
    mmt: {},
    prom: {},
    specialTests: {},
    impairments: ['Pain', 'Decreased mobility', 'Functional limitations'],
    prognosis: generatePrognosis(acuity, painLevel),
    defaultGoal: 'improved function and reduced pain',
    plan: {
      frequency: mapFrequencyToEnum(getFrequencyForAcuity(acuity)),
      duration: mapDurationToEnum(getDurationForAcuity(acuity)),
      interventions: ['Manual therapy', 'Therapeutic exercise', 'Patient education'],
      stg: goals.shortTerm,
      ltg: goals.longTerm,
    },
    icd10: getICD10ForCondition(condition),
    cpt: getCPTForAcuity(acuity),
    prognosticFactors: generatePrognosticFactors(acuity, painLevel),
  };
}

function generateHPI(condition: string, acuity: string, region: string, painLevel: number): string {
  const templates: Record<string, string> = {
    acute: `Patient reports sudden onset of ${region.replace('-', ' ')} pain following recent activity. Pain is ${painLevel}/10, constant, and significantly limiting function. No previous history of similar episodes.`,
    subacute: `Patient describes ${region.replace('-', ' ')} pain that has persisted for several weeks following initial injury. Pain fluctuates between ${Math.max(1, painLevel - 2)}-${painLevel}/10 depending on activity level.`,
    chronic: `Patient reports persistent ${region.replace('-', ' ')} pain for several months. Pain averages ${painLevel}/10 and interferes with daily activities and sleep. Previous conservative treatments have provided minimal relief.`,
  };
  return templates[acuity] || templates.chronic;
}

function generateImpairments(region: string, acuity: string): string[] {
  const baseImpairments = ['Pain', 'Decreased ROM', 'Muscle weakness'];
  const acuitySpecific: Record<string, string[]> = {
    acute: ['Inflammation', 'Protective muscle guarding'],
    subacute: ['Tissue healing limitations', 'Movement compensations'],
    chronic: ['Movement avoidance patterns', 'Deconditioning'],
  };
  return [...baseImpairments, ...(acuitySpecific[acuity] || [])];
}

function generatePrognosis(acuity: string, painLevel: number): string {
  if (painLevel >= 7) return 'Fair';
  if (acuity === 'acute') return 'Good';
  if (acuity === 'chronic') return 'Fair to Good';
  return 'Good';
}

function generatePrognosticFactors(acuity: string, painLevel: number): string {
  const factors: string[] = [];
  if (acuity === 'acute') factors.push('Recent onset');
  if (acuity === 'chronic') factors.push('Duration of symptoms');
  if (painLevel >= 7) factors.push('High pain levels');
  if (painLevel <= 3) factors.push('Low pain levels');
  return factors.join(', ');
}

function getFrequencyForAcuity(acuity: string): string {
  const frequencies: Record<string, string> = {
    acute: '2-3x per week',
    subacute: '2x per week',
    chronic: '2x per week',
  };
  return frequencies[acuity] || frequencies.chronic;
}

function getDurationForAcuity(acuity: string): string {
  const durations: Record<string, string> = {
    acute: '4-6 weeks',
    subacute: '6-8 weeks',
    chronic: '8-12 weeks',
  };
  return durations[acuity] || durations.chronic;
}

function getInterventionsForRegion(region: string): string[] {
  const base = ['Manual therapy', 'Therapeutic exercise', 'Patient education'];
  const regionSpecific: Record<string, string[]> = {
    shoulder: ['Joint mobilization', 'Rotator cuff strengthening'],
    'cervical-spine': ['Cervical stabilization', 'Postural training'],
    'lumbar-spine': ['Core strengthening', 'Movement retraining'],
    knee: ['Quadriceps strengthening', 'Gait training'],
    ankle: ['Balance training', 'Proprioceptive exercises'],
  };
  return [...base, ...(regionSpecific[region] || [])];
}

function getICD10ForCondition(condition: string): { code: string; desc: string } {
  const icd10Map: Record<string, { code: string; desc: string }> = {
    'Rotator cuff tendinopathy': {
      code: 'M75.30',
      desc: 'Calcific tendinitis of shoulder, unspecified',
    },
    'Cervical strain': {
      code: 'S13.4XXA',
      desc: 'Sprain of ligaments of cervical spine, initial encounter',
    },
    'Lumbar strain': {
      code: 'S33.5XXA',
      desc: 'Sprain of ligaments of lumbar spine, initial encounter',
    },
    'Knee osteoarthritis': { code: 'M17.9', desc: 'Osteoarthritis of knee, unspecified' },
    'Ankle sprain': {
      code: 'S93.409A',
      desc: 'Sprain of unspecified ligament of unspecified ankle, initial encounter',
    },
  };
  return icd10Map[condition] || { code: 'M79.3', desc: 'Panniculitis, unspecified' };
}

function getCPTForAcuity(acuity: string): string[] {
  const baseCPT = ['97110', '97112', '97140'];
  const acuityCPT: Record<string, string[]> = {
    acute: ['97012'],
    subacute: ['97116'],
    chronic: ['97535', '97530'],
  };
  return [...baseCPT, ...(acuityCPT[acuity] || [])];
}
