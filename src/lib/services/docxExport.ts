import type { NoteData } from '$lib/services/noteLifecycle';
import type { Paragraph as ParagraphType } from 'docx';
import { recordExportAudit } from '$lib/services/exportAudit';
import { NOTE_APPEARANCE } from '$lib/services/noteAppearance';
import { resolveExportTemplate } from '$lib/services/exportTemplates';
import {
  buildNotePresentation,
  type PresentationBlock,
  type PresentationGridBlock,
  type PresentationTableBlock,
} from '$lib/services/notePresentation';

// ── Lazy-loaded docx library ──────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Document: any,
  HeadingLevel: any,
  Packer: any,
  Paragraph: any,
  TextRun: any,
  Table: any,
  TableCell: any,
  TableRow: any,
  WidthType: any,
  AlignmentType: any,
  BorderStyle: any,
  Header: any,
  Footer: any,
  PageNumber: any;

async function ensureDocx(): Promise<void> {
  if (Paragraph) return;
  const docx = await import('docx');
  ({
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableCell,
    TableRow,
    WidthType,
    AlignmentType,
    BorderStyle,
    Header,
    Footer,
    PageNumber,
  } = docx);
}

// ── Formatting constants (matches legacy document-export.js) ──
const FORMAT = {
  font: NOTE_APPEARANCE.fonts.body,
  headingFont: NOTE_APPEARANCE.fonts.heading,
  sizes: NOTE_APPEARANCE.docx.sizes,
  colors: {
    black: NOTE_APPEARANCE.colors.ink.replace('#', '').toUpperCase(),
    white: NOTE_APPEARANCE.colors.white.replace('#', '').toUpperCase(),
    gray: NOTE_APPEARANCE.colors.muted.replace('#', '').toUpperCase(),
    grayText: NOTE_APPEARANCE.colors.mutedSoft.replace('#', '').toUpperCase(),
    green: NOTE_APPEARANCE.colors.accent.replace('#', '').toUpperCase(),
    darkGreen: NOTE_APPEARANCE.colors.accentDark.replace('#', '').toUpperCase(),
    tableHeader: NOTE_APPEARANCE.colors.tableHeader.replace('#', '').toUpperCase(),
    tableStripe: NOTE_APPEARANCE.colors.tableStripe.replace('#', '').toUpperCase(),
    borderStrong: 'CBD5E1',
    borderSoft: 'E2E8F0',
  },
  spacing: NOTE_APPEARANCE.docx.spacing,
};

type ExportPatient = {
  name: string;
  dob?: string;
  caseId?: string;
};

// ── Utility helpers ───────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function titleize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatBlockValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry) => formatBlockValue(entry))
      .filter(Boolean)
      .join('\n');
  }
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, entry]) => {
        const formatted = formatBlockValue(entry);
        return formatted ? `${titleize(key)}: ${formatted}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

// ── Styled paragraph builders ─────────────────────────────────

function styledRun(
  text: string,
  opts: { bold?: boolean; italics?: boolean; size?: number; color?: string; font?: string } = {},
): InstanceType<typeof TextRun> {
  return new TextRun({
    text,
    font: opts.font ?? FORMAT.font,
    size: opts.size ?? FORMAT.sizes.body,
    color: opts.color ?? FORMAT.colors.black,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
  });
}

/** Level 1: UND Green, uppercase, left green border. Level 2: black, green underline. */
function pushSectionHeading(paragraphs: ParagraphType[], title: string, level: 1 | 2 = 1): void {
  const isL1 = level === 1;
  paragraphs.push(
    new Paragraph({
      children: [
        styledRun(isL1 ? title.toUpperCase() : title, {
          size: isL1 ? FORMAT.sizes.heading1 : FORMAT.sizes.heading2,
          color: isL1 ? FORMAT.colors.green : FORMAT.colors.black,
          bold: true,
          font: isL1 ? FORMAT.headingFont : FORMAT.font,
        }),
      ],
      heading: isL1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      spacing: isL1
        ? { before: FORMAT.spacing.beforeSection, after: FORMAT.spacing.afterSection }
        : { before: FORMAT.spacing.beforeSubsection, after: FORMAT.spacing.afterSubsection },
      keepNext: true,
      border: isL1
        ? { left: { style: BorderStyle.SINGLE, size: 24, color: FORMAT.colors.green } }
        : { bottom: { style: BorderStyle.SINGLE, size: 16, color: FORMAT.colors.green } },
    }),
  );
}

function pushField(paragraphs: ParagraphType[], label: string, value: unknown): void {
  const text = formatBlockValue(value);
  if (!text) return;

  // Split on newlines so each line renders properly in Word
  const lines = text.split('\n');
  const children: InstanceType<typeof TextRun>[] = [];
  children.push(styledRun(`${label}: `, { bold: true }));
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) children.push(new TextRun({ break: 1 } as never));
    children.push(styledRun(lines[i]));
  }

  paragraphs.push(
    new Paragraph({
      children,
      spacing: {
        before: FORMAT.spacing.beforeParagraph,
        after: FORMAT.spacing.afterParagraph,
        line: FORMAT.spacing.lineSpacing,
      },
    }),
  );
}

type DocxChild = ParagraphType | any;

function cellParagraph(text: string, bold = false): ParagraphType {
  const lines = String(text || '').split('\n');
  return new Paragraph({
    children: lines.flatMap((line, index) =>
      index === 0
        ? [styledRun(line || '', { bold })]
        : [new TextRun({ break: 1 } as never), styledRun(line || '', { bold })],
    ),
    spacing: { before: 0, after: 0, line: FORMAT.spacing.lineSpacing },
  });
}

function createDocxTable(block: PresentationTableBlock): any {
  const columnCount = block.columns.length || 1;
  const widths =
    Array.isArray(block.columnWidths) && block.columnWidths.length === columnCount
      ? block.columnWidths
      : Array.from({ length: columnCount }, () => Math.floor(9360 / columnCount));

  const headerRow = new TableRow({
    tableHeader: true,
    children: block.columns.map(
      (column, index) =>
        new TableCell({
          width: { size: widths[index], type: WidthType.DXA },
          shading: { fill: FORMAT.colors.tableHeader },
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              children: [styledRun(column, { bold: true, color: FORMAT.colors.white, size: 18 })],
              spacing: { before: 0, after: 0 },
            }),
          ],
        }),
    ),
  });

  const bodyRows = block.rows.map(
    (row, rowIndex) =>
      new TableRow({
        children: row.map(
          (cell, index) =>
            new TableCell({
              width: { size: widths[index] ?? widths[0], type: WidthType.DXA },
              shading: {
                fill: rowIndex % 2 === 1 ? FORMAT.colors.tableStripe : FORMAT.colors.white,
              },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [cellParagraph(cell || '—')],
            }),
        ),
      }),
  );

  return new Table({
    width: { size: widths.reduce((sum, width) => sum + width, 0), type: WidthType.DXA },
    rows: [headerRow, ...bodyRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.borderStrong },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.borderStrong },
      left: { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.borderStrong },
      right: { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.borderStrong },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.borderSoft },
      insideVertical: { style: BorderStyle.SINGLE, size: 8, color: FORMAT.colors.borderSoft },
    },
  });
}

function pushPresentationBlock(children: DocxChild[], block: PresentationBlock): void {
  if (block.kind === 'field') {
    children.push(
      new Paragraph({
        children: [styledRun(`${block.label}: `, { bold: true }), styledRun(block.value)],
        spacing: {
          before: FORMAT.spacing.beforeParagraph,
          after: FORMAT.spacing.afterParagraph,
          line: FORMAT.spacing.lineSpacing,
        },
      }),
    );
    return;
  }

  if (block.title) {
    children.push(
      new Paragraph({
        children: [styledRun(block.title, { bold: true, size: FORMAT.sizes.body })],
        spacing: { before: 120, after: 80 },
      }),
    );
  }

  if (block.kind === 'grid') {
    const grid = block as PresentationGridBlock;
    const rows = grid.items.map((item) => [item.label, item.value]);
    children.push(
      createDocxTable({
        kind: 'table',
        columns: ['Field', 'Value'],
        rows,
        columnWidths: [2400, 6960],
      }),
    );
    return;
  }

  children.push(createDocxTable(block));
}

// ── Document structure ────────────────────────────────────────

function buildHeaderParagraphs(
  note: NoteData,
  patient: ExportPatient,
  templateId?: string,
): ParagraphType[] {
  const meta = asRecord(note.meta);
  const subjective = asRecord(note.subjective);
  const template = templateId ? resolveExportTemplate(templateId) : null;
  const encounterType = template?.label || templateId || 'Clinical Note';
  return [
    new Paragraph({
      children: [
        styledRun(patient.name || 'Patient', {
          size: FORMAT.sizes.title,
          bold: true,
          font: FORMAT.headingFont,
        }),
      ],
      heading: HeadingLevel.TITLE,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        styledRun('DOB: ', { bold: true, size: FORMAT.sizes.body }),
        styledRun(patient.dob || 'N/A', { size: FORMAT.sizes.body }),
        styledRun('    Case ID: ', { bold: true, size: FORMAT.sizes.body }),
        styledRun(patient.caseId || 'N/A', { size: FORMAT.sizes.body }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        styledRun('Encounter Type: ', { bold: true, size: FORMAT.sizes.body }),
        styledRun(encounterType, { size: FORMAT.sizes.body }),
        styledRun('    Signed Date: ', { bold: true, size: FORMAT.sizes.body }),
        styledRun(formatDate(asString(meta.signedAt)) || 'Not signed', {
          size: FORMAT.sizes.body,
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        styledRun('Chief Complaint: ', { bold: true, size: FORMAT.sizes.body }),
        styledRun(asString(subjective.chiefComplaint) || template?.label || 'Clinical Note', {
          size: FORMAT.sizes.body,
        }),
      ],
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: FORMAT.colors.green } },
    }),
  ];
}

/* Legacy paragraph-flattening export path removed in favor of buildNotePresentation().
function buildSectionParagraphs(note: NoteData): ParagraphType[] {
  const paragraphs: ParagraphType[] = [];
  const subjective = asRecord(note.subjective);
  const objective = asRecord(note.objective);
  const assessment = asRecord(note.assessment);
  const plan = asRecord(note.plan);
  const billing = asRecord(note.billing);
  const nutritionAssessment = asRecord((note as Record<string, unknown>).nutrition_assessment);
  const nutritionDiagnosis = asRecord((note as Record<string, unknown>).nutrition_diagnosis);
  const nutritionIntervention = asRecord((note as Record<string, unknown>).nutrition_intervention);
  const nutritionMonitoring = asRecord((note as Record<string, unknown>).nutrition_monitoring);
  const meta = asRecord(note.meta);
  const signature = asRecord(meta.signature);

  // ── Subjective ──
  pushSectionHeading(paragraphs, 'Subjective');
  pushField(paragraphs, 'Patient Name', subjective.patientName);
  pushField(paragraphs, 'Date of Birth', subjective.patientBirthday);
  pushField(paragraphs, 'Age', subjective.patientAge);
  pushField(paragraphs, 'Sex', subjective.patientGender);
  pushField(paragraphs, 'Gender Identity / Pronouns', subjective.patientGenderIdentityPronouns);
  pushField(paragraphs, 'Preferred Language', subjective.patientPreferredLanguage);
  pushField(paragraphs, 'Interpreter Needed', subjective.patientInterpreterNeeded);
  pushField(paragraphs, 'BMI', subjective.patientBmi);
  pushField(paragraphs, 'Work Status / Occupation', subjective.patientWorkStatusOccupation);
  pushField(paragraphs, 'Living Situation', subjective.patientLivingSituationHomeEnvironment);
  pushField(paragraphs, 'Social Support', subjective.patientSocialSupport);
  pushField(paragraphs, 'Chief Complaint', subjective.chiefComplaint);
  pushField(paragraphs, 'History of Present Illness', subjective.historyOfPresentIllness);
  pushField(paragraphs, 'Functional Limitations', subjective.functionalLimitations);
  pushField(paragraphs, 'Prior Level of Function', subjective.priorLevel);
  pushField(paragraphs, 'Patient Goals', subjective.patientGoals);
  pushField(paragraphs, 'Additional History', subjective.additionalHistory);
  pushField(paragraphs, 'Pain Location', subjective.painLocation);
  pushField(paragraphs, 'Pain Scale', subjective.painScale);
  pushField(paragraphs, 'Pain Quality', subjective.painQuality);
  pushField(paragraphs, 'Pain Pattern', subjective.painPattern);
  pushField(paragraphs, 'Aggravating Factors', subjective.aggravatingFactors);
  pushField(paragraphs, 'Easing Factors', subjective.easingFactors);
  pushListField(paragraphs, 'Interview Q&A', subjective.qaItems);
  pushListField(paragraphs, 'Red Flag Screening', subjective.redFlagScreening);
  pushListField(paragraphs, 'Medications', subjective.medications);

  // ── Objective ──
  pushSectionHeading(paragraphs, 'Objective');
  pushField(paragraphs, 'Vitals', objective.vitals);
  pushListField(paragraphs, 'Vitals Flowsheet', objective.vitalsSeries);
  pushField(paragraphs, 'Objective Notes', objective.text);
  pushField(paragraphs, 'Inspection', objective.inspection);
  pushField(paragraphs, 'Palpation', objective.palpation);
  pushField(paragraphs, 'Systems Review', objective.systemsReview);
  pushField(paragraphs, 'Regional Assessment', objective.regionalAssessments);
  pushField(paragraphs, 'Neuroscreen', objective.neuroscreenData);
  pushListField(paragraphs, 'Standardized Assessments', objective.standardizedAssessments);
  pushField(paragraphs, 'Treatment Performed', objective.treatmentPerformed);

  // ── Assessment ──
  pushSectionHeading(paragraphs, 'Assessment');
  pushField(paragraphs, 'Primary Impairments', assessment.primaryImpairments);
  pushField(paragraphs, 'Body Functions (ICF)', assessment.bodyFunctions);
  pushField(paragraphs, 'Activity Limitations (ICF)', assessment.activityLimitations);
  pushField(paragraphs, 'Participation Restrictions (ICF)', assessment.participationRestrictions);
  pushField(paragraphs, 'PT Diagnosis', assessment.ptDiagnosis);
  pushField(paragraphs, 'Prognosis', assessment.prognosis);
  pushField(paragraphs, 'Prognostic Factors', assessment.prognosticFactors);
  pushField(paragraphs, 'Clinical Reasoning', assessment.clinicalReasoning);

  // ── Plan ──
  pushSectionHeading(paragraphs, 'Plan');
  pushListField(paragraphs, 'Goals', plan.goals);
  pushField(paragraphs, 'Frequency', plan.frequency);
  pushField(paragraphs, 'Duration', plan.duration);
  pushField(paragraphs, 'Treatment Plan', plan.treatmentPlan);
  pushField(paragraphs, 'Exercise Focus', plan.exerciseFocus);
  pushField(paragraphs, 'Exercise Prescription', plan.exercisePrescription);
  pushField(paragraphs, 'Manual Therapy', plan.manualTherapy);
  pushListField(paragraphs, 'Modalities', plan.modalities);
  pushListField(paragraphs, 'In-Clinic Interventions', plan.inClinicInterventions);
  pushListField(paragraphs, 'Home Exercise Program', plan.hepInterventions);
  pushField(paragraphs, 'Patient Education', plan.patientEducation);

  // ── Billing ──
  pushSectionHeading(paragraphs, 'Billing');
  pushListField(paragraphs, 'ICD-10 Codes', billing.diagnosisCodes);
  pushListField(paragraphs, 'CPT Codes', billing.billingCodes);
  pushField(paragraphs, 'Orders / Referrals', billing.ordersReferrals);

  // ── Nutrition (ADIME) sections — only if present ──
  if (
    Object.keys(nutritionAssessment).length ||
    Object.keys(nutritionDiagnosis).length ||
    Object.keys(nutritionIntervention).length ||
    Object.keys(nutritionMonitoring).length
  ) {
    pushSectionHeading(paragraphs, 'Nutrition Assessment');
    pushField(paragraphs, 'Food / Nutrition History', nutritionAssessment.food_nutrition_history);
    pushField(paragraphs, 'Anthropometric Data', nutritionAssessment.anthropometric);
    pushField(paragraphs, 'Biochemical Data', nutritionAssessment.biochemical);
    pushField(
      paragraphs,
      'Nutrition-Focused Physical Exam',
      nutritionAssessment.nutrition_focused_pe,
    );
    pushField(paragraphs, 'Client History', nutritionAssessment.client_history);
    pushField(paragraphs, 'Estimated Needs', nutritionAssessment.estimated_needs);
    pushField(paragraphs, 'Malnutrition Risk', nutritionAssessment.malnutrition_risk);

    pushSectionHeading(paragraphs, 'Nutrition Diagnosis');
    pushListField(paragraphs, 'PES Statements', nutritionDiagnosis.pes_statements);
    pushField(paragraphs, 'Priority Diagnosis', nutritionDiagnosis.priority_diagnosis);

    pushSectionHeading(paragraphs, 'Nutrition Intervention');
    pushField(paragraphs, 'Strategy', nutritionIntervention.strategy);
    pushField(paragraphs, 'Diet Order', nutritionIntervention.diet_order);
    pushField(paragraphs, 'Goals', nutritionIntervention.goals);
    pushField(paragraphs, 'Education Topics', nutritionIntervention.education_topics);
    pushField(paragraphs, 'Counseling Notes', nutritionIntervention.counseling_notes);
    pushField(paragraphs, 'Care Coordination', nutritionIntervention.coordination);

    pushSectionHeading(paragraphs, 'Nutrition Monitoring and Evaluation');
    pushField(paragraphs, 'Indicators', nutritionMonitoring.indicators);
    pushField(paragraphs, 'Criteria', nutritionMonitoring.criteria);
    pushField(paragraphs, 'Outcomes', nutritionMonitoring.outcomes);
    pushField(paragraphs, 'Follow-Up Plan', nutritionMonitoring.follow_up_plan);
  }

  // ── Signature ──
  pushSectionHeading(paragraphs, 'Electronic Signature', 2);
  if (asString(signature.name)) {
    const sigLine = `${asString(signature.name)}${asString(signature.title) ? ', ' + asString(signature.title) : ''}`;
    paragraphs.push(
      new Paragraph({
        children: [styledRun('Signed by: ', { bold: true }), styledRun(sigLine)],
        spacing: { before: 20, after: 20, line: FORMAT.spacing.lineSpacing },
      }),
    );
    paragraphs.push(
      new Paragraph({
        children: [
          styledRun('Date/Time: ', { bold: true }),
          styledRun(formatDate(asString(meta.signedAt))),
        ],
        spacing: { before: 20, after: 20, line: FORMAT.spacing.lineSpacing },
      }),
    );
    pushField(paragraphs, 'License Type', signature.licenseType);
    pushField(paragraphs, 'License Number', signature.licenseNumber);
    pushField(paragraphs, 'Credentials', signature.credentials);
  } else {
    paragraphs.push(
      new Paragraph({
        children: [styledRun('Not signed', { italics: true, color: FORMAT.colors.gray })],
      }),
    );
  }

  // Co-signature
  const cosignature = asRecord(signature.cosignature);
  if (asString(cosignature.name)) {
    pushSectionHeading(paragraphs, 'Co-Signature', 2);
    pushField(paragraphs, 'Co-Signed By', cosignature.name);
    pushField(paragraphs, 'Title', cosignature.title);
    pushField(paragraphs, 'License Type', cosignature.licenseType);
    pushField(paragraphs, 'License Number', cosignature.licenseNumber);
    pushField(paragraphs, 'Signed At', formatDate(asString(cosignature.signedAt)));
  }

  // Amendment history
  const amendments = Array.isArray(note.amendments) ? note.amendments : [];
  if (amendments.length > 0) {
    pushSectionHeading(paragraphs, 'Amendment History', 2);
    for (let i = 0; i < amendments.length; i++) {
      const amendment = asRecord(amendments[i]);
      const prevSig = asRecord(amendment.previousSignature);
      paragraphs.push(
        new Paragraph({
          children: [
            styledRun(`Amendment ${i + 1}`, { bold: true, size: FORMAT.sizes.body }),
          ],
          spacing: { before: 120, after: 40 },
        }),
      );
      pushField(paragraphs, 'Reason', amendment.reason);
      pushField(paragraphs, 'Amended At', formatDate(asString(amendment.amendedAt)));
      pushField(paragraphs, 'Previous Signer', prevSig.name);
      pushField(paragraphs, 'Previous Title', prevSig.title);
      pushField(paragraphs, 'Previously Signed At', formatDate(asString(prevSig.signedAt)));
    }
  }

  return paragraphs;
}
*/

function buildPresentationSectionChildren(note: NoteData): DocxChild[] {
  const children: DocxChild[] = [];
  const meta = asRecord(note.meta);
  const signature = asRecord(meta.signature);

  for (const section of buildNotePresentation(note, 'export')) {
    pushSectionHeading(children as ParagraphType[], section.title);
    for (const block of section.blocks) {
      pushPresentationBlock(children, block);
    }
  }

  pushSectionHeading(children as ParagraphType[], 'Electronic Signature', 2);
  if (asString(signature.name)) {
    const sigLine = `${asString(signature.name)}${asString(signature.title) ? ', ' + asString(signature.title) : ''}`;
    children.push(
      new Paragraph({
        children: [styledRun('Signed by: ', { bold: true }), styledRun(sigLine)],
        spacing: { before: 20, after: 20, line: FORMAT.spacing.lineSpacing },
      }),
    );
    children.push(
      new Paragraph({
        children: [
          styledRun('Date/Time: ', { bold: true }),
          styledRun(formatDate(asString(meta.signedAt))),
        ],
        spacing: { before: 20, after: 20, line: FORMAT.spacing.lineSpacing },
      }),
    );
    pushField(children as ParagraphType[], 'License Type', signature.licenseType);
    pushField(children as ParagraphType[], 'License Number', signature.licenseNumber);
    pushField(children as ParagraphType[], 'Credentials', signature.credentials);
  } else {
    children.push(
      new Paragraph({
        children: [styledRun('Not signed', { italics: true, color: FORMAT.colors.gray })],
      }),
    );
  }

  const cosignature = asRecord(signature.cosignature);
  if (asString(cosignature.name)) {
    pushSectionHeading(children as ParagraphType[], 'Co-Signature', 2);
    pushField(children as ParagraphType[], 'Co-Signed By', cosignature.name);
    pushField(children as ParagraphType[], 'Title', cosignature.title);
    pushField(children as ParagraphType[], 'License Type', cosignature.licenseType);
    pushField(children as ParagraphType[], 'License Number', cosignature.licenseNumber);
    pushField(children as ParagraphType[], 'Signed At', formatDate(asString(cosignature.signedAt)));
  }

  const amendments = Array.isArray(note.amendments) ? note.amendments : [];
  if (amendments.length > 0) {
    pushSectionHeading(children as ParagraphType[], 'Amendment History', 2);
    for (let i = 0; i < amendments.length; i++) {
      const amendment = asRecord(amendments[i]);
      const prevSig = asRecord(amendment.previousSignature);
      children.push(
        new Paragraph({
          children: [styledRun(`Amendment ${i + 1}`, { bold: true, size: FORMAT.sizes.body })],
          spacing: { before: 120, after: 40 },
        }),
      );
      pushField(children as ParagraphType[], 'Reason', amendment.reason);
      pushField(
        children as ParagraphType[],
        'Amended At',
        formatDate(asString(amendment.amendedAt)),
      );
      pushField(children as ParagraphType[], 'Previous Signer', prevSig.name);
      pushField(children as ParagraphType[], 'Previous Title', prevSig.title);
      pushField(
        children as ParagraphType[],
        'Previously Signed At',
        formatDate(asString(prevSig.signedAt)),
      );
    }
  }

  return children;
}

// ── Public API ────────────────────────────────────────────────

export async function exportNoteToDocx(
  note: NoteData,
  patient: ExportPatient,
  templateId?: string,
): Promise<Blob> {
  await ensureDocx();

  const template = templateId ? resolveExportTemplate(templateId) : null;
  const encounterType = template?.label || 'Clinical Note';
  const programLabel = 'UND EMR-Sim';

  const headerParagraphs = buildHeaderParagraphs(note, patient, templateId);
  const sectionChildren = buildPresentationSectionChildren(note);

  const meta = asRecord(note.meta);
  const sig = asRecord(meta.signature);
  const patientDob = patient.dob || 'N/A';

  // Footer: patient ID left, page center
  const footerChildren: ParagraphType[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        styledRun(`${patient.name || 'Patient'}  |  DOB: ${patientDob}  |  ${encounterType}`, {
          size: FORMAT.sizes.small,
          color: FORMAT.colors.grayText,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        styledRun('Page ', { size: FORMAT.sizes.small, color: FORMAT.colors.grayText }),
        new TextRun({
          children: [PageNumber.CURRENT],
          font: FORMAT.font,
          size: FORMAT.sizes.small,
          color: FORMAT.colors.grayText,
        }),
      ],
    }),
  ];

  // Mark unsigned exports as drafts
  if (!asString(sig.name)) {
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          styledRun('DRAFT \u2013 for educational use only', {
            size: FORMAT.sizes.small,
            bold: true,
            color: FORMAT.colors.gray,
          }),
        ],
      }),
    );
  }

  const sections: import('docx').ISectionOptions[] = [
    {
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
            header: 720,
            footer: 720,
            gutter: 0,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                styledRun(`${encounterType} \u2014 ${programLabel}`, {
                  size: FORMAT.sizes.small,
                  color: FORMAT.colors.grayText,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({ children: footerChildren }),
      },
      children: [...headerParagraphs, ...sectionChildren],
    },
  ];

  const doc = new Document({
    creator: programLabel,
    title: encounterType,
    description: 'Educational EMR simulation export',
    sections,
    styles: {
      default: {
        document: {
          run: { font: FORMAT.font, size: FORMAT.sizes.body },
          paragraph: { spacing: { line: FORMAT.spacing.lineSpacing } },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1UND',
          name: 'UND Heading 1',
          basedOn: 'Heading1',
          run: {
            font: FORMAT.headingFont,
            size: FORMAT.sizes.heading1,
            color: FORMAT.colors.green,
            bold: true,
          },
        },
        {
          id: 'Heading2UND',
          name: 'UND Heading 2',
          basedOn: 'Heading2',
          run: {
            font: FORMAT.font,
            size: FORMAT.sizes.heading2,
            color: FORMAT.colors.darkGreen,
            bold: true,
          },
        },
      ],
    },
  });

  return await Packer.toBlob(doc);
}

export function triggerDocxDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function exportAndAuditNoteToDocx(
  noteId: string,
  note: NoteData,
  patient: ExportPatient,
  templateId?: string,
): Promise<Blob> {
  const blob = await exportNoteToDocx(note, patient, templateId);
  if (templateId) {
    recordExportAudit({
      noteId,
      templateId,
      format: 'docx',
    });
  }
  return blob;
}
