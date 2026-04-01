import { RED_FLAG_CATEGORIES } from '$lib/config/redFlagCategories';
import { REGIONS, type RegionDef } from '$lib/config/regionalAssessments';
import { NEURO_REGIONS, neuroKey, type NeuroscreenRegion } from '$lib/config/neuroscreenData';
import { SYSTEMS, SUBCATEGORIES, type SystemsReviewData } from '$lib/config/systemsReview';
import {
  formatAssessmentScoreSummary,
  getAssessmentDefinition,
  normalizeStandardizedAssessments,
} from '$lib/config/standardizedAssessments';
import type { NoteData } from '$lib/services/noteLifecycle';

export type PresentationInput = 'text' | 'textarea';
export type PresentationAlignment = 'left' | 'center' | 'right';

export interface PresentationFieldBlock {
  kind: 'field';
  label: string;
  value: string;
  sectionKey: string;
  path: string;
  editable: boolean;
  input: PresentationInput;
}

export interface PresentationGridBlock {
  kind: 'grid';
  title?: string;
  items: Array<{ label: string; value: string }>;
  columns?: number;
}

export interface PresentationTableBlock {
  kind: 'table';
  title?: string;
  columns: string[];
  rows: string[][];
  columnWidths?: number[];
  alignments?: PresentationAlignment[];
}

export type PresentationBlock =
  | PresentationFieldBlock
  | PresentationGridBlock
  | PresentationTableBlock;

export interface PresentationSection {
  title: string;
  blocks: PresentationBlock[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function hasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some((entry) => hasContent(entry));
  if (typeof value === 'object')
    return Object.values(value as Record<string, unknown>).some(hasContent);
  return false;
}

function titleize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatInline(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry) => formatInline(entry))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => {
        const formatted = formatInline(entry);
        return formatted ? `${titleize(key)}: ${formatted}` : '';
      })
      .filter(Boolean)
      .join('; ');
  }
  return '';
}

function formatStatus(status: string): string {
  if (!status) return '';
  const normalized = status.replace(/-/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function primitiveField(
  blocks: PresentationBlock[],
  sectionKey: string,
  label: string,
  path: string,
  rawValue: unknown,
  mode: 'sign' | 'export',
  input: PresentationInput = 'text',
): void {
  if (!hasContent(rawValue)) return;
  if (
    typeof rawValue !== 'string' &&
    typeof rawValue !== 'number' &&
    typeof rawValue !== 'boolean'
  ) {
    return;
  }
  blocks.push({
    kind: 'field',
    label,
    value: String(rawValue).trim(),
    sectionKey,
    path,
    editable: mode === 'sign',
    input,
  });
}

function gridBlock(
  blocks: PresentationBlock[],
  title: string | undefined,
  items: Array<{ label: string; value: unknown }>,
  columns = 3,
): void {
  const filtered = items
    .map((item) => ({ label: item.label, value: formatInline(item.value) }))
    .filter((item) => item.value);
  if (!filtered.length) return;
  blocks.push({ kind: 'grid', title, items: filtered, columns });
}

function tableBlock(
  blocks: PresentationBlock[],
  title: string | undefined,
  columns: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
  opts: { columnWidths?: number[]; alignments?: PresentationAlignment[] } = {},
): void {
  const normalizedRows = rows
    .map((row) => row.map((cell) => (cell == null ? '' : String(cell).trim())))
    .filter((row) => row.some(Boolean));
  if (!normalizedRows.length) return;
  blocks.push({
    kind: 'table',
    title,
    columns,
    rows: normalizedRows,
    columnWidths: opts.columnWidths,
    alignments: opts.alignments,
  });
}

function readRegionalValue(
  record: Record<string, unknown>,
  regionKey: string,
  name: string,
  side: '' | 'L' | 'R',
): string {
  return formatInline(record[`${regionKey}:${name}:${side}`]);
}

function readSpecialTestValue(
  record: Record<string, unknown>,
  regionKey: string,
  name: string,
): string {
  return formatInline(record[`${regionKey}:${name}`]);
}

function buildRedFlagTable(blocks: PresentationBlock[], screening: unknown): void {
  if (!Array.isArray(screening)) return;
  const categoryLookup = new Map<string, string>();
  for (const category of RED_FLAG_CATEGORIES) {
    for (const item of category.items) {
      categoryLookup.set(item.id, category.label);
    }
  }

  const rows = screening
    .map((entry) => asRecord(entry))
    .filter((entry) => hasContent(entry.status) || hasContent(entry.note))
    .map((entry) => [
      categoryLookup.get(String(entry.id || '')) || '',
      String(entry.item || ''),
      formatStatus(String(entry.status || '')),
      String(entry.note || ''),
    ]);

  tableBlock(blocks, 'Red Flag Screening', ['Category', 'Item', 'Status', 'Note'], rows, {
    columnWidths: [2200, 3400, 1200, 2800],
  });
}

function buildQaTable(blocks: PresentationBlock[], qaItems: unknown): void {
  if (!Array.isArray(qaItems)) return;
  const rows = qaItems
    .map((entry, index) => ({ index, row: asRecord(entry) }))
    .filter(({ row }) => hasContent(row.question) || hasContent(row.response))
    .map(({ index, row }) => [index + 1, String(row.question || ''), String(row.response || '')]);

  tableBlock(blocks, 'Interview Q&A', ['#', 'Question', 'Response'], rows, {
    columnWidths: [600, 3800, 4960],
  });
}

function buildMedicationTable(blocks: PresentationBlock[], medications: unknown): void {
  if (!Array.isArray(medications)) return;
  const rows = medications
    .map((entry) => asRecord(entry))
    .filter((entry) => hasContent(entry.name))
    .map((entry) => [
      String(entry.name || ''),
      String(entry.dose || ''),
      String(entry.frequency || ''),
      String(entry.class || ''),
      Array.isArray(entry.alerts) ? entry.alerts.join(', ') : '',
    ]);

  tableBlock(
    blocks,
    'Current Medications',
    ['Medication', 'Dose', 'Frequency', 'Class', 'Alerts'],
    rows,
    {
      columnWidths: [2600, 1200, 1400, 1900, 2260],
    },
  );
}

function buildVitalsSeriesTable(blocks: PresentationBlock[], vitalsSeries: unknown): void {
  if (!Array.isArray(vitalsSeries) || vitalsSeries.length === 0) return;
  const entries = vitalsSeries
    .map((entry) => asRecord(entry))
    .filter((entry) => hasContent(entry.vitals));
  if (!entries.length) return;

  const columns = [
    'Measure',
    ...entries.map((entry, index) => {
      const label = String(entry.label || `Reading ${index + 1}`);
      const time = String(entry.time || '').trim();
      return time ? `${label}\n${time}` : label;
    }),
  ];

  const measureMap: Array<[string, string]> = [
    ['Blood Pressure', 'bp'],
    ['Heart Rate', 'hr'],
    ['Respiratory Rate', 'rr'],
    ['SpO2', 'spo2'],
    ['Temperature', 'temperature'],
    ['Pain', 'pain'],
  ];

  const rows = measureMap.map(([label, key]) => [
    label,
    ...entries.map((entry) => {
      const vitals = asRecord(entry.vitals);
      if (key === 'bp') {
        const systolic = String(vitals.bpSystolic || '').trim();
        const diastolic = String(vitals.bpDiastolic || '').trim();
        return systolic && diastolic ? `${systolic}/${diastolic}` : '';
      }
      return String(vitals[key] || '').trim();
    }),
  ]);

  tableBlock(blocks, 'Vitals Flowsheet', columns, rows);
}

function buildSystemsReviewTable(blocks: PresentationBlock[], systemsReview: unknown): void {
  const data = (systemsReview ?? {}) as SystemsReviewData;
  const rows = SYSTEMS.map((system) => {
    const state = data?.[system.id];
    if (!state) return null;
    const status = formatStatus(state.status);
    const impairedSubcategories = (SUBCATEGORIES[system.id] ?? [])
      .filter((subcat) => state.subcategories?.[subcat.id] === 'impaired')
      .map((subcat) => subcat.label)
      .join(', ');
    const deferred = (SUBCATEGORIES[system.id] ?? [])
      .filter((subcat) => state.deferReasons?.[subcat.id])
      .map((subcat) => `${subcat.label}: ${state.deferReasons[subcat.id]}`)
      .join('; ');
    const detail = [impairedSubcategories, deferred, String(state.deferReason || '').trim()]
      .filter(Boolean)
      .join(' | ');
    return status ? [system.label, status, detail] : null;
  }).filter((row): row is string[] => Array.isArray(row));

  tableBlock(blocks, 'Systems Review', ['System', 'Status', 'Details'], rows, {
    columnWidths: [2800, 1200, 5360],
  });
}

function buildRegionalAssessmentTables(
  blocks: PresentationBlock[],
  regionalAssessments: unknown,
): void {
  const data = asRecord(regionalAssessments);
  const selected = Array.isArray(data.selectedRegions)
    ? data.selectedRegions.map((entry) => String(entry))
    : [];
  if (!selected.length) return;

  const arom = asRecord(data.arom);
  const prom = asRecord(data.prom);
  const rims = asRecord(data.rims);
  const mmt = asRecord(data.mmt);
  const specialTests = asRecord(data.specialTests);

  for (const regionKey of selected) {
    const region = (REGIONS as Record<string, RegionDef>)[regionKey];
    if (!region) continue;

    const movementRows = region.rom
      .filter((motion) => motion.side !== 'L' && motion.side !== 'R')
      .map((motion) => {
        const leftArom = readRegionalValue(arom, regionKey, motion.joint, 'L');
        const leftProm = readRegionalValue(prom, regionKey, motion.joint, 'L');
        const leftRim = readRegionalValue(rims, regionKey, motion.joint, 'L');
        const rightArom = readRegionalValue(arom, regionKey, motion.joint, 'R');
        const rightProm = readRegionalValue(prom, regionKey, motion.joint, 'R');
        const rightRim = readRegionalValue(rims, regionKey, motion.joint, 'R');
        const midlineArom = readRegionalValue(arom, regionKey, motion.joint, '');
        const midlineProm = readRegionalValue(prom, regionKey, motion.joint, '');
        const midlineRim = readRegionalValue(rims, regionKey, motion.joint, '');
        return [
          motion.joint,
          leftArom || midlineArom,
          leftProm || midlineProm,
          leftRim || midlineRim,
          rightArom,
          rightProm,
          rightRim,
        ];
      })
      .filter((row) => row.slice(1).some(Boolean));

    tableBlock(
      blocks,
      `${region.name} ROM / PROM / RIM`,
      ['Movement', 'L AROM', 'L PROM', 'L RIM', 'R AROM', 'R PROM', 'R RIM'],
      movementRows,
      {
        columnWidths: [2400, 940, 940, 1460, 940, 940, 1740],
      },
    );

    const mmtRows = region.mmt
      .filter((item) => item.side === 'L')
      .map((item) => [
        item.muscle,
        readRegionalValue(mmt, regionKey, item.muscle, 'L'),
        readRegionalValue(mmt, regionKey, item.muscle, 'R'),
      ])
      .filter((row) => row[1] || row[2]);

    tableBlock(
      blocks,
      `${region.name} Manual Muscle Testing`,
      ['Muscle', 'Left', 'Right'],
      mmtRows,
      {
        columnWidths: [4200, 2420, 2420],
      },
    );

    const specialTestRows = region.specialTests
      .map((test) => [test.name, readSpecialTestValue(specialTests, regionKey, test.name)])
      .filter((row) => row[1]);

    tableBlock(blocks, `${region.name} Special Tests`, ['Test', 'Result'], specialTestRows, {
      columnWidths: [5200, 4160],
    });
  }
}

function buildNeuroscreenTables(blocks: PresentationBlock[], neuroscreenData: unknown): void {
  const data = asRecord(neuroscreenData);
  const selected = Array.isArray(data.selectedRegions)
    ? data.selectedRegions.map((entry) => String(entry))
    : [];
  if (!selected.length) return;

  const dermatome = asRecord(data.dermatome);
  const myotome = asRecord(data.myotome);
  const reflex = asRecord(data.reflex);

  for (const regionKey of selected) {
    const region = (NEURO_REGIONS as Record<string, NeuroscreenRegion>)[regionKey];
    if (!region) continue;
    const hasReflex = region.items.some((item) => item.reflex !== null);
    const columns = hasReflex
      ? ['Level', 'Derm L', 'Derm R', 'Myo L', 'Myo R', 'Reflex L', 'Reflex R']
      : ['Level', 'Derm L', 'Derm R', 'Myo L', 'Myo R'];
    const rows = region.items
      .map((item) => {
        const base = [
          item.level,
          formatInline(dermatome[neuroKey(regionKey, item.level, 'L', 'derm')]),
          formatInline(dermatome[neuroKey(regionKey, item.level, 'R', 'derm')]),
          formatInline(myotome[neuroKey(regionKey, item.level, 'L', 'myo')]),
          formatInline(myotome[neuroKey(regionKey, item.level, 'R', 'myo')]),
        ];
        if (hasReflex) {
          base.push(
            item.reflex ? formatInline(reflex[neuroKey(regionKey, item.level, 'L', 'reflex')]) : '',
            item.reflex ? formatInline(reflex[neuroKey(regionKey, item.level, 'R', 'reflex')]) : '',
          );
        }
        return base;
      })
      .filter((row) => row.slice(1).some(Boolean));

    tableBlock(blocks, `${region.name} Neuroscreen`, columns, rows);
  }
}

function buildStandardizedAssessmentTables(
  blocks: PresentationBlock[],
  rawAssessments: unknown,
): void {
  const assessments = normalizeStandardizedAssessments(
    Array.isArray(rawAssessments) ? rawAssessments : [],
  );
  if (!assessments.length) return;

  tableBlock(
    blocks,
    'Standardized Assessments',
    ['Instrument', 'Score', 'Assessor', 'Date', 'Notes'],
    assessments.map((assessment) => [
      assessment.title,
      formatAssessmentScoreSummary(assessment) ||
        `${assessment.scores.total}/${assessment.scores.max}`,
      assessment.assessor,
      assessment.performedAt,
      assessment.notes,
    ]),
    {
      columnWidths: [2600, 1600, 1600, 1400, 2160],
    },
  );

  for (const assessment of assessments) {
    const definition = getAssessmentDefinition(assessment.instrumentKey);
    if (!definition) continue;
    const responseRows = definition.items
      .map((item) => [item.label, assessment.responses[item.id], assessment.interpretation])
      .filter((row) => row[1] !== '');
    tableBlock(
      blocks,
      `${assessment.title} Detail`,
      ['Item', 'Score', 'Interpretation'],
      responseRows,
      {
        columnWidths: [4200, 1200, 3960],
      },
    );
  }
}

function buildSubjectiveSection(
  note: NoteData,
  mode: 'sign' | 'export',
): PresentationSection | null {
  const subjective = asRecord(note.subjective);
  const blocks: PresentationBlock[] = [];

  gridBlock(
    blocks,
    'Patient Profile',
    [
      { label: 'Age', value: subjective.patientAge },
      { label: 'Sex', value: subjective.patientGender },
      { label: 'Pronouns', value: subjective.patientGenderIdentityPronouns },
      { label: 'Preferred Language', value: subjective.patientPreferredLanguage },
      { label: 'Interpreter Needed', value: subjective.patientInterpreterNeeded },
      { label: 'BMI', value: subjective.patientBmi },
      { label: 'Work Status / Occupation', value: subjective.patientWorkStatusOccupation },
      { label: 'Living Situation', value: subjective.patientLivingSituationHomeEnvironment },
      { label: 'Social Support', value: subjective.patientSocialSupport },
      { label: 'Allergies', value: subjective.patientAllergies },
    ],
    3,
  );

  primitiveField(
    blocks,
    'subjective',
    'Chief Complaint',
    'chiefComplaint',
    subjective.chiefComplaint,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'subjective',
    'History of Present Illness',
    'historyOfPresentIllness',
    subjective.historyOfPresentIllness,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'subjective',
    'Functional Limitations',
    'functionalLimitations',
    subjective.functionalLimitations,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'subjective',
    'Prior Level of Function',
    'priorLevel',
    subjective.priorLevel,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'subjective',
    'Patient Goals',
    'patientGoals',
    subjective.patientGoals,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'subjective',
    'Additional History',
    'additionalHistory',
    subjective.additionalHistory,
    mode,
    'textarea',
  );

  gridBlock(blocks, 'Pain Assessment', [
    { label: 'Location', value: subjective.painLocation },
    { label: 'Scale', value: subjective.painScale },
    { label: 'Quality', value: subjective.painQuality },
    { label: 'Pattern', value: subjective.painPattern },
    { label: 'Aggravating Factors', value: subjective.aggravatingFactors },
    { label: 'Easing Factors', value: subjective.easingFactors },
  ]);

  buildRedFlagTable(blocks, subjective.redFlagScreening);
  buildQaTable(blocks, subjective.qaItems);
  buildMedicationTable(blocks, subjective.medications);

  return blocks.length ? { title: 'Subjective', blocks } : null;
}

function buildObjectiveSection(
  note: NoteData,
  mode: 'sign' | 'export',
): PresentationSection | null {
  const objective = asRecord(note.objective);
  const blocks: PresentationBlock[] = [];
  const vitals = asRecord(objective.vitals);

  buildVitalsSeriesTable(blocks, objective.vitalsSeries);
  gridBlock(
    blocks,
    'Objective Snapshot',
    [
      { label: 'BP', value: vitals.bp },
      { label: 'HR', value: vitals.hr },
      { label: 'RR', value: vitals.rr },
      { label: 'Temp', value: vitals.temp },
      { label: 'SpO2', value: vitals.o2sat },
      { label: 'Pain', value: vitals.pain },
      {
        label: 'Height',
        value: [vitals.heightFt, 'ft', vitals.heightIn, 'in'].filter(Boolean).join(' '),
      },
      { label: 'Weight', value: vitals.weightLbs ? `${String(vitals.weightLbs)} lbs` : '' },
      { label: 'BMI', value: vitals.bmi },
    ],
    3,
  );

  primitiveField(
    blocks,
    'objective',
    'General Observation',
    'text',
    objective.text,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'objective',
    'Inspection',
    'inspection.visual',
    asRecord(objective.inspection).visual,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'objective',
    'Palpation',
    'palpation.findings',
    asRecord(objective.palpation).findings,
    mode,
    'textarea',
  );
  buildSystemsReviewTable(blocks, objective.systemsReview);
  primitiveField(
    blocks,
    'objective',
    'Orientation',
    'orientation',
    objective.orientation,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'objective',
    'Memory & Attention',
    'memoryAttention',
    objective.memoryAttention,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'objective',
    'Safety Awareness',
    'safetyAwareness',
    objective.safetyAwareness,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'objective',
    'Vision / Perception',
    'visionPerception',
    objective.visionPerception,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'objective',
    'Auscultation',
    'auscultation',
    objective.auscultation,
    mode,
    'textarea',
  );
  primitiveField(blocks, 'objective', 'Edema', 'edema', objective.edema, mode, 'textarea');
  primitiveField(
    blocks,
    'objective',
    'Endurance',
    'endurance',
    objective.endurance,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'objective',
    'Skin Integrity',
    'skinIntegrity',
    objective.skinIntegrity,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'objective',
    'Color / Temperature',
    'colorTemp',
    objective.colorTemp,
    mode,
    'textarea',
  );
  buildRegionalAssessmentTables(blocks, objective.regionalAssessments);
  buildNeuroscreenTables(blocks, objective.neuroscreenData);
  primitiveField(
    blocks,
    'objective',
    'Neuro Screening',
    'neuro.screening',
    asRecord(objective.neuro).screening,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'objective',
    'Cranial Nerves',
    'neuro.cranialNerves',
    asRecord(objective.neuro).cranialNerves,
    mode,
    'textarea',
  );
  primitiveField(blocks, 'objective', 'Tone', 'tone', objective.tone, mode, 'textarea');
  primitiveField(
    blocks,
    'objective',
    'Coordination',
    'coordination',
    objective.coordination,
    mode,
    'textarea',
  );
  primitiveField(blocks, 'objective', 'Balance', 'balance', objective.balance, mode, 'textarea');
  primitiveField(
    blocks,
    'objective',
    'Functional Assessment',
    'functional.assessment',
    asRecord(objective.functional).assessment,
    mode,
    'textarea',
  );
  buildStandardizedAssessmentTables(blocks, objective.standardizedAssessments);
  primitiveField(
    blocks,
    'objective',
    'Treatment Performed',
    'treatmentPerformed',
    objective.treatmentPerformed,
    mode,
    'textarea',
  );

  return blocks.length ? { title: 'Objective', blocks } : null;
}

function buildAssessmentSection(
  note: NoteData,
  mode: 'sign' | 'export',
): PresentationSection | null {
  const assessment = asRecord(note.assessment);
  const blocks: PresentationBlock[] = [];

  primitiveField(
    blocks,
    'assessment',
    'Primary Impairments',
    'primaryImpairments',
    assessment.primaryImpairments,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'assessment',
    'Body Functions (ICF)',
    'bodyFunctions',
    assessment.bodyFunctions,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'assessment',
    'Activity Limitations (ICF)',
    'activityLimitations',
    assessment.activityLimitations,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'assessment',
    'Participation Restrictions (ICF)',
    'participationRestrictions',
    assessment.participationRestrictions,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'assessment',
    'PT Diagnosis',
    'ptDiagnosis',
    assessment.ptDiagnosis,
    mode,
    'textarea',
  );
  primitiveField(blocks, 'assessment', 'Prognosis', 'prognosis', assessment.prognosis, mode);
  primitiveField(
    blocks,
    'assessment',
    'Prognostic Factors',
    'prognosticFactors',
    assessment.prognosticFactors,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'assessment',
    'Clinical Reasoning',
    'clinicalReasoning',
    assessment.clinicalReasoning,
    mode,
    'textarea',
  );

  return blocks.length ? { title: 'Assessment', blocks } : null;
}

function buildPlanSection(note: NoteData, mode: 'sign' | 'export'): PresentationSection | null {
  const plan = asRecord(note.plan);
  const blocks: PresentationBlock[] = [];

  gridBlock(
    blocks,
    'Visit Parameters',
    [
      { label: 'Frequency', value: plan.frequency },
      { label: 'Duration', value: plan.duration },
    ],
    2,
  );

  const goals = Array.isArray(plan.goals) ? plan.goals : [];
  tableBlock(
    blocks,
    'Goals',
    ['Goal', 'Timeframe', 'ICF Domain'],
    goals
      .map((goal) => asRecord(goal))
      .filter((goal) => hasContent(goal.goal))
      .map((goal) => [
        String(goal.goal || ''),
        String(goal.timeframe || ''),
        String(goal.icfDomain || ''),
      ]),
    {
      columnWidths: [5000, 1700, 2660],
    },
  );

  primitiveField(
    blocks,
    'plan',
    'Treatment Plan',
    'treatmentPlan',
    plan.treatmentPlan,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'plan',
    'Exercise Focus',
    'exerciseFocus',
    plan.exerciseFocus,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'plan',
    'Exercise Prescription',
    'exercisePrescription',
    plan.exercisePrescription,
    mode,
    'textarea',
  );
  primitiveField(
    blocks,
    'plan',
    'Manual Therapy',
    'manualTherapy',
    plan.manualTherapy,
    mode,
    'textarea',
  );

  const modalities = Array.isArray(plan.modalities)
    ? plan.modalities.map((entry) => String(entry)).filter(Boolean)
    : [];
  tableBlock(
    blocks,
    'Modalities',
    ['Modality'],
    modalities.map((entry) => [entry]),
    {
      columnWidths: [9360],
    },
  );

  const inClinic = Array.isArray(plan.inClinicInterventions) ? plan.inClinicInterventions : [];
  tableBlock(
    blocks,
    'In-Clinic Interventions',
    ['Intervention', 'Dosage'],
    inClinic
      .map((entry) => asRecord(entry))
      .filter((entry) => hasContent(entry.intervention) || hasContent(entry.dosage))
      .map((entry) => [String(entry.intervention || ''), String(entry.dosage || '')]),
    { columnWidths: [3000, 6360] },
  );

  const hep = Array.isArray(plan.hepInterventions) ? plan.hepInterventions : [];
  tableBlock(
    blocks,
    'Home Exercise Program',
    ['Intervention', 'Dosage'],
    hep
      .map((entry) => asRecord(entry))
      .filter((entry) => hasContent(entry.intervention) || hasContent(entry.dosage))
      .map((entry) => [String(entry.intervention || ''), String(entry.dosage || '')]),
    { columnWidths: [3000, 6360] },
  );

  primitiveField(
    blocks,
    'plan',
    'Patient Education',
    'patientEducation',
    plan.patientEducation,
    mode,
    'textarea',
  );

  return blocks.length ? { title: 'Plan', blocks } : null;
}

function buildBillingSection(note: NoteData): PresentationSection | null {
  const billing = asRecord(note.billing);
  const blocks: PresentationBlock[] = [];

  const diagnosisCodes = Array.isArray(billing.diagnosisCodes) ? billing.diagnosisCodes : [];
  tableBlock(
    blocks,
    'Diagnosis Codes',
    ['Code', 'Description', 'Role'],
    diagnosisCodes
      .map((entry) => asRecord(entry))
      .filter((entry) => hasContent(entry.code))
      .map((entry) => [
        String(entry.code || ''),
        String(entry.description || entry.label || ''),
        entry.isPrimary ? 'Primary' : '',
      ]),
    { columnWidths: [1600, 6160, 1600] },
  );

  const billingCodes = Array.isArray(billing.billingCodes) ? billing.billingCodes : [];
  tableBlock(
    blocks,
    'CPT Codes',
    ['Code', 'Linked ICD-10', 'Description', 'Units', 'Minutes'],
    billingCodes
      .map((entry) => asRecord(entry))
      .filter((entry) => hasContent(entry.code))
      .map((entry) => [
        String(entry.code || ''),
        String(entry.linkedDiagnosisCode || ''),
        String(entry.description || entry.label || ''),
        String(entry.units || ''),
        String(entry.timeSpent || ''),
      ]),
    { columnWidths: [1200, 1500, 4060, 1100, 1500] },
  );

  const orders = Array.isArray(billing.ordersReferrals)
    ? billing.ordersReferrals
    : typeof billing.ordersReferrals === 'string' && billing.ordersReferrals.trim()
      ? [{ type: 'Order', description: billing.ordersReferrals, linkedDiagnosisCode: '' }]
      : [];
  tableBlock(
    blocks,
    'Orders / Referrals',
    ['Type', 'Linked ICD-10', 'Description'],
    orders
      .map((entry) => asRecord(entry))
      .filter((entry) => hasContent(entry.type) || hasContent(entry.description))
      .map((entry) => [
        String(entry.type || ''),
        String(entry.linkedDiagnosisCode || ''),
        String(entry.description || entry.details || ''),
      ]),
    { columnWidths: [1500, 1700, 6160] },
  );

  return blocks.length ? { title: 'Billing', blocks } : null;
}

function buildDieteticsSections(note: NoteData, mode: 'sign' | 'export'): PresentationSection[] {
  const sections: PresentationSection[] = [];
  const nutritionAssessment = asRecord((note as Record<string, unknown>).nutrition_assessment);
  const nutritionDiagnosis = asRecord((note as Record<string, unknown>).nutrition_diagnosis);
  const nutritionIntervention = asRecord((note as Record<string, unknown>).nutrition_intervention);
  const nutritionMonitoring = asRecord((note as Record<string, unknown>).nutrition_monitoring);
  const billing = asRecord(note.billing);

  const assessmentBlocks: PresentationBlock[] = [];
  primitiveField(
    assessmentBlocks,
    'nutrition_assessment',
    'Food / Nutrition History',
    'food_nutrition_history',
    nutritionAssessment.food_nutrition_history,
    mode,
    'textarea',
  );
  primitiveField(
    assessmentBlocks,
    'nutrition_assessment',
    'Anthropometric Data',
    'anthropometric',
    nutritionAssessment.anthropometric,
    mode,
    'textarea',
  );
  primitiveField(
    assessmentBlocks,
    'nutrition_assessment',
    'Biochemical Data',
    'biochemical',
    nutritionAssessment.biochemical,
    mode,
    'textarea',
  );
  primitiveField(
    assessmentBlocks,
    'nutrition_assessment',
    'Nutrition-Focused Physical Exam',
    'nutrition_focused_pe',
    nutritionAssessment.nutrition_focused_pe,
    mode,
    'textarea',
  );
  primitiveField(
    assessmentBlocks,
    'nutrition_assessment',
    'Client History',
    'client_history',
    nutritionAssessment.client_history,
    mode,
    'textarea',
  );
  primitiveField(
    assessmentBlocks,
    'nutrition_assessment',
    'Estimated Needs',
    'estimated_needs',
    nutritionAssessment.estimated_needs,
    mode,
    'textarea',
  );
  primitiveField(
    assessmentBlocks,
    'nutrition_assessment',
    'Malnutrition Risk',
    'malnutrition_risk',
    nutritionAssessment.malnutrition_risk,
    mode,
    'textarea',
  );
  if (assessmentBlocks.length)
    sections.push({ title: 'Nutrition Assessment', blocks: assessmentBlocks });

  const diagnosisBlocks: PresentationBlock[] = [];
  const pesStatements = Array.isArray(nutritionDiagnosis.pes_statements)
    ? nutritionDiagnosis.pes_statements
    : [];
  tableBlock(
    diagnosisBlocks,
    'PES Statements',
    ['Problem', 'Etiology', 'Signs / Symptoms'],
    pesStatements
      .map((entry) => asRecord(entry))
      .filter(
        (entry) =>
          hasContent(entry.problem) ||
          hasContent(entry.etiology) ||
          hasContent(entry.signs_symptoms),
      )
      .map((entry) => [
        String(entry.problem || ''),
        String(entry.etiology || ''),
        String(entry.signs_symptoms || ''),
      ]),
    { columnWidths: [2400, 2800, 4160] },
  );
  primitiveField(
    diagnosisBlocks,
    'nutrition_diagnosis',
    'Priority Diagnosis',
    'priority_diagnosis',
    nutritionDiagnosis.priority_diagnosis,
    mode,
    'textarea',
  );
  if (diagnosisBlocks.length)
    sections.push({ title: 'Nutrition Diagnosis', blocks: diagnosisBlocks });

  const interventionBlocks: PresentationBlock[] = [];
  primitiveField(
    interventionBlocks,
    'nutrition_intervention',
    'Strategy',
    'strategy',
    nutritionIntervention.strategy,
    mode,
    'textarea',
  );
  primitiveField(
    interventionBlocks,
    'nutrition_intervention',
    'Diet Order',
    'diet_order',
    nutritionIntervention.diet_order,
    mode,
    'textarea',
  );
  primitiveField(
    interventionBlocks,
    'nutrition_intervention',
    'Goals',
    'goals',
    nutritionIntervention.goals,
    mode,
    'textarea',
  );
  primitiveField(
    interventionBlocks,
    'nutrition_intervention',
    'Education Topics',
    'education_topics',
    nutritionIntervention.education_topics,
    mode,
    'textarea',
  );
  primitiveField(
    interventionBlocks,
    'nutrition_intervention',
    'Counseling Notes',
    'counseling_notes',
    nutritionIntervention.counseling_notes,
    mode,
    'textarea',
  );
  primitiveField(
    interventionBlocks,
    'nutrition_intervention',
    'Care Coordination',
    'coordination',
    nutritionIntervention.coordination,
    mode,
    'textarea',
  );
  if (interventionBlocks.length)
    sections.push({ title: 'Nutrition Intervention', blocks: interventionBlocks });

  const monitoringBlocks: PresentationBlock[] = [];
  primitiveField(
    monitoringBlocks,
    'nutrition_monitoring',
    'Indicators',
    'indicators',
    nutritionMonitoring.indicators,
    mode,
    'textarea',
  );
  primitiveField(
    monitoringBlocks,
    'nutrition_monitoring',
    'Criteria',
    'criteria',
    nutritionMonitoring.criteria,
    mode,
    'textarea',
  );
  primitiveField(
    monitoringBlocks,
    'nutrition_monitoring',
    'Outcomes',
    'outcomes',
    nutritionMonitoring.outcomes,
    mode,
    'textarea',
  );
  primitiveField(
    monitoringBlocks,
    'nutrition_monitoring',
    'Follow-Up Plan',
    'follow_up_plan',
    nutritionMonitoring.follow_up_plan,
    mode,
    'textarea',
  );
  if (monitoringBlocks.length)
    sections.push({ title: 'Nutrition Monitoring and Evaluation', blocks: monitoringBlocks });

  const billingBlocks: PresentationBlock[] = [];
  gridBlock(
    billingBlocks,
    'Billing Summary',
    [
      { label: 'CPT Code', value: billing.cpt_code },
      { label: 'Units', value: billing.units },
      { label: 'Time (minutes)', value: billing.time_minutes },
      { label: 'Diagnosis Codes', value: billing.diagnosis_codes },
    ],
    2,
  );
  primitiveField(
    billingBlocks,
    'billing',
    'Medical Necessity',
    'justification',
    billing.justification,
    mode,
    'textarea',
  );
  if (billingBlocks.length) sections.push({ title: 'Billing', blocks: billingBlocks });

  return sections;
}

export function buildNotePresentation(
  note: NoteData,
  mode: 'sign' | 'export' = 'export',
): PresentationSection[] {
  const ptSections = [
    buildSubjectiveSection(note, mode),
    buildObjectiveSection(note, mode),
    buildAssessmentSection(note, mode),
    buildPlanSection(note, mode),
    buildBillingSection(note),
  ].filter((section): section is PresentationSection => section !== null);

  if (ptSections.length > 0) return ptSections;
  return buildDieteticsSections(note, mode);
}
