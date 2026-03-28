import type { NoteData } from '$lib/services/noteLifecycle';
import type { Paragraph as ParagraphType } from 'docx';
import { recordExportAudit } from '$lib/services/exportAudit';
import { resolveExportTemplate } from '$lib/services/exportTemplates';

// ── Lazy-loaded docx library ──────────────────────────────────
// The `docx` package is ~300 KB minified. It is only needed when a
// user explicitly exports a signed note to DOCX — a rare action.
// By dynamic-importing it here, we keep it off the critical path.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Document: any, HeadingLevel: any, Packer: any, Paragraph: any, TextRun: any;

async function ensureDocx(): Promise<void> {
  if (Paragraph) return; // already loaded
  const docx = await import('docx');
  ({ Document, HeadingLevel, Packer, Paragraph, TextRun } = docx);
}

type ExportPatient = {
  name: string;
  dob?: string;
  caseId?: string;
};

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

function formatInlineValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry) => formatInlineValue(entry))
      .filter(Boolean)
      .join(', ');
  }
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, entry]) => {
        const formatted = formatInlineValue(entry);
        return formatted ? `${titleize(key)}: ${formatted}` : '';
      })
      .filter(Boolean)
      .join('; ');
  }
  return '';
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

function pushField(paragraphs: ParagraphType[], label: string, value: unknown): void {
  const text = formatBlockValue(value);
  if (!text) return;
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(text)],
    }),
  );
}

function pushHeading(paragraphs: ParagraphType[], title: string): void {
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
    }),
  );
}

function paragraphFromList(label: string, value: unknown): ParagraphType | null {
  if (Array.isArray(value) && value.length > 0) {
    return new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true }),
        new TextRun(
          value
            .map((entry) => formatInlineValue(entry))
            .filter(Boolean)
            .join(', '),
        ),
      ],
    });
  }
  return null;
}

function pushListField(paragraphs: ParagraphType[], label: string, value: unknown): void {
  const line = paragraphFromList(label, value);
  if (line) paragraphs.push(line);
}

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
      text: patient.name || 'Patient',
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'DOB: ', bold: true }),
        new TextRun(patient.dob || 'N/A'),
        new TextRun({ text: '   Case ID: ', bold: true }),
        new TextRun(patient.caseId || 'N/A'),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Encounter Type: ', bold: true }),
        new TextRun(encounterType),
        new TextRun({ text: '   Signed Date: ', bold: true }),
        new TextRun(formatDate(asString(meta.signedAt)) || 'Not signed'),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Title: ', bold: true }),
        new TextRun(asString(subjective.chiefComplaint) || template?.label || 'Clinical Note'),
      ],
      spacing: { after: 200 },
    }),
  ];
}

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

  pushHeading(paragraphs, 'Subjective');
  // Patient profile
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
  // History
  pushField(paragraphs, 'Chief Complaint', subjective.chiefComplaint);
  pushField(paragraphs, 'History of Present Illness', subjective.historyOfPresentIllness);
  pushField(paragraphs, 'Functional Limitations', subjective.functionalLimitations);
  pushField(paragraphs, 'Prior Level of Function', subjective.priorLevel);
  pushField(paragraphs, 'Patient Goals', subjective.patientGoals);
  pushField(paragraphs, 'Additional History', subjective.additionalHistory);
  // Pain assessment
  pushField(paragraphs, 'Pain Location', subjective.painLocation);
  pushField(paragraphs, 'Pain Scale', subjective.painScale);
  pushField(paragraphs, 'Pain Quality', subjective.painQuality);
  pushField(paragraphs, 'Pain Pattern', subjective.painPattern);
  pushField(paragraphs, 'Aggravating Factors', subjective.aggravatingFactors);
  pushField(paragraphs, 'Easing Factors', subjective.easingFactors);
  pushListField(paragraphs, 'Interview Q&A', subjective.qaItems);
  pushListField(paragraphs, 'Red Flag Screening', subjective.redFlagScreening);
  pushListField(paragraphs, 'Medications', subjective.medications);

  pushHeading(paragraphs, 'Objective');
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

  pushHeading(paragraphs, 'Assessment');
  pushField(paragraphs, 'Primary Impairments', assessment.primaryImpairments);
  pushField(paragraphs, 'Body Functions (ICF)', assessment.bodyFunctions);
  pushField(paragraphs, 'Activity Limitations (ICF)', assessment.activityLimitations);
  pushField(paragraphs, 'Participation Restrictions (ICF)', assessment.participationRestrictions);
  pushField(paragraphs, 'PT Diagnosis', assessment.ptDiagnosis);
  pushField(paragraphs, 'Prognosis', assessment.prognosis);
  pushField(paragraphs, 'Prognostic Factors', assessment.prognosticFactors);
  pushField(paragraphs, 'Clinical Reasoning', assessment.clinicalReasoning);

  pushHeading(paragraphs, 'Plan');
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

  pushHeading(paragraphs, 'Billing');
  pushListField(paragraphs, 'ICD-10 Codes', billing.diagnosisCodes);
  pushListField(paragraphs, 'CPT Codes', billing.billingCodes);
  pushField(paragraphs, 'Orders / Referrals', billing.ordersReferrals);

  if (
    Object.keys(nutritionAssessment).length ||
    Object.keys(nutritionDiagnosis).length ||
    Object.keys(nutritionIntervention).length ||
    Object.keys(nutritionMonitoring).length
  ) {
    pushHeading(paragraphs, 'Nutrition Assessment');
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

    pushHeading(paragraphs, 'Nutrition Diagnosis');
    pushListField(paragraphs, 'PES Statements', nutritionDiagnosis.pes_statements);
    pushField(paragraphs, 'Priority Diagnosis', nutritionDiagnosis.priority_diagnosis);

    pushHeading(paragraphs, 'Nutrition Intervention');
    pushField(paragraphs, 'Strategy', nutritionIntervention.strategy);
    pushField(paragraphs, 'Diet Order', nutritionIntervention.diet_order);
    pushField(paragraphs, 'Goals', nutritionIntervention.goals);
    pushField(paragraphs, 'Education Topics', nutritionIntervention.education_topics);
    pushField(paragraphs, 'Counseling Notes', nutritionIntervention.counseling_notes);
    pushField(paragraphs, 'Care Coordination', nutritionIntervention.coordination);

    pushHeading(paragraphs, 'Nutrition Monitoring and Evaluation');
    pushField(paragraphs, 'Indicators', nutritionMonitoring.indicators);
    pushField(paragraphs, 'Criteria', nutritionMonitoring.criteria);
    pushField(paragraphs, 'Outcomes', nutritionMonitoring.outcomes);
    pushField(paragraphs, 'Follow-Up Plan', nutritionMonitoring.follow_up_plan);
  }

  pushHeading(paragraphs, 'Signature');
  pushField(paragraphs, 'Signed By', signature.name);
  pushField(paragraphs, 'Title', signature.title);
  pushField(paragraphs, 'License Type', signature.licenseType);
  pushField(paragraphs, 'License Number', signature.licenseNumber);
  pushField(paragraphs, 'Credentials', signature.credentials);
  pushField(paragraphs, 'Signed At', formatDate(asString(meta.signedAt)));

  // Co-signature (required for student notes supervised by a clinician)
  const cosignature = asRecord(signature.cosignature);
  if (asString(cosignature.name)) {
    pushHeading(paragraphs, 'Co-Signature');
    pushField(paragraphs, 'Co-Signed By', cosignature.name);
    pushField(paragraphs, 'Title', cosignature.title);
    pushField(paragraphs, 'License Type', cosignature.licenseType);
    pushField(paragraphs, 'License Number', cosignature.licenseNumber);
    pushField(paragraphs, 'Signed At', formatDate(asString(cosignature.signedAt)));
  }

  // Amendment history chain
  const amendments = Array.isArray(note.amendments) ? note.amendments : [];
  if (amendments.length > 0) {
    pushHeading(paragraphs, 'Amendment History');
    for (let i = 0; i < amendments.length; i++) {
      const amendment = asRecord(amendments[i]);
      const prevSig = asRecord(amendment.previousSignature);
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `Amendment ${i + 1}`, bold: true, underline: {} })],
          spacing: { before: 120 },
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

export async function exportNoteToDocx(
  note: NoteData,
  patient: ExportPatient,
  templateId?: string,
): Promise<Blob> {
  await ensureDocx();

  const sections: import('docx').ISectionOptions[] = [
    {
      properties: {},
      children: [
        ...buildHeaderParagraphs(note, patient, templateId),
        ...buildSectionParagraphs(note),
      ],
    },
  ];

  const doc = new Document({
    sections,
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
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
