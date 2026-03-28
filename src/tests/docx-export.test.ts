import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportAndAuditNoteToDocx,
  exportNoteToDocx,
  triggerDocxDownload,
} from '$lib/services/docxExport';
import { listExportJobsForCase, saveSignedNote } from '$lib/services/chartRecords';
import { createCase } from '$lib/store';
import { storage } from '$lib/storage';
import { clearChartRecords } from '$lib/services/chartRecords';

describe('docx export', () => {
  beforeEach(() => {
    storage.clear();
    clearChartRecords();
  });

  it('builds a docx blob for a signed note', async () => {
    const blob = await exportNoteToDocx(
      {
        noteTitle: 'Initial Evaluation',
        noteType: 'PT Evaluation',
        subjective: {
          chiefComplaint: 'Shoulder pain',
          historyOfPresentIllness: 'Pain after tennis',
          painScale: '6/10',
        },
        objective: {
          vitals: { bp: '120/80', hr: '72' },
          text: 'Guarded posture',
        },
        assessment: {
          ptDiagnosis: 'Shoulder impingement',
          prognosis: 'Good',
        },
        plan: {
          treatmentPlan: 'Therapeutic exercise and manual therapy',
          patientEducation: 'Avoid overhead aggravation',
        },
        billing: {
          diagnosisCodes: ['M75.41'],
          billingCodes: ['97110'],
        },
        meta: {
          signedAt: '2026-03-26T20:00:00.000Z',
          signature: {
            name: 'Morgan PT',
            title: 'DPT',
            signedAt: '2026-03-26T20:00:00.000Z',
            version: 1,
          },
        },
      },
      {
        name: 'Alex Carter',
        dob: '1992-05-15',
        caseId: 'case_1',
      },
      'pt.eval.v1',
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(blob.size).toBeGreaterThan(0);
  });

  it('can audit an export when given a note id and template', async () => {
    const wrapper = createCase({
      patientName: 'Alex Carter',
      encounters: { eval: {} },
    });

    const envelope = saveSignedNote(wrapper.id, 'eval', {
      noteTitle: 'Initial Evaluation',
      noteType: 'PT Evaluation',
      subjective: { chiefComplaint: 'Shoulder pain' },
      meta: {
        signedAt: '2026-03-26T20:00:00.000Z',
        signature: {
          name: 'Morgan PT',
          title: 'DPT',
          signedAt: '2026-03-26T20:00:00.000Z',
          version: 1,
        },
      },
    });

    const blob = await exportAndAuditNoteToDocx(
      envelope.id,
      envelope.content,
      { name: 'Alex Carter', dob: '1992-05-15', caseId: wrapper.id },
      envelope.templateId,
    );

    expect(blob.size).toBeGreaterThan(0);
    expect(listExportJobsForCase(wrapper.id)).toHaveLength(1);
  });

  it('builds a docx blob for a dietetics ADIME note', async () => {
    const blob = await exportNoteToDocx(
      {
        noteTitle: 'ADIME Initial Assessment',
        noteType: 'Dietetics ADIME',
        nutrition_assessment: {
          nutritionHistory: 'Inadequate protein intake for 2 weeks',
          anthropometrics: { weight: '58 kg', bmi: '19.1' },
          estimated_needs: '1800 kcal/day, 75 g protein/day',
        },
        nutrition_diagnosis: {
          pesStatement:
            'Inadequate oral intake related to poor appetite as evidenced by weight loss.',
        },
        nutrition_intervention: {
          interventions: 'High-protein oral nutrition supplement BID',
          education: 'Reviewed small frequent meals strategy',
        },
        nutrition_monitoring: {
          monitoringPlan: 'Track weekly weight and intake log',
          followUp: '1 week',
        },
        meta: {
          signedAt: '2026-03-26T20:00:00.000Z',
          signature: {
            name: 'Taylor RD',
            title: 'Registered Dietitian',
            signedAt: '2026-03-26T20:00:00.000Z',
            version: 1,
          },
        },
      },
      {
        name: 'Jordan Lee',
        dob: '1988-11-09',
        caseId: 'nutrition_case_1',
      },
      'dietetics.adime.v1',
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('triggers a browser download without throwing', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-docx');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const appendSpy = vi.spyOn(document.body, 'append');
    const removeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    expect(() =>
      triggerDocxDownload(
        new Blob(['hello'], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
        'test.docx',
      ),
    ).not.toThrow();

    expect(createObjectURL).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
    revokeObjectURL.mockRestore();
    removeSpy.mockRestore();
  });
});
