import { storage } from './index.js';
import { buildEditorHash } from './noteCatalog.js';
import { computeAge, displayName, listPatients } from './vsp-registry.js';

const DIET_CASES_KEY = 'dietetics_emr_cases';
const LOCAL_PT_PREFIX = 'patient_blank';

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readDieteticsCases() {
  return safeJsonParse(storage.getItem(DIET_CASES_KEY), {}) || {};
}

function normalizeName(name, fallback = 'Unnamed Patient') {
  const clean = String(name || '').trim();
  return clean || fallback;
}

function appendHashParams(hash, params = {}) {
  const [pathPart, queryPart = ''] = String(hash || '').split('?');
  const query = new URLSearchParams(queryPart);
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      query.delete(key);
    } else {
      query.set(key, String(value));
    }
  });
  const nextQuery = query.toString();
  return `${pathPart}${nextQuery ? `?${nextQuery}` : ''}`;
}

function ensurePatientEntry(entries, patientKey, seed) {
  if (!entries.has(patientKey)) {
    entries.set(patientKey, {
      patientKey,
      patientName: seed.patientName || 'Unnamed Patient',
      sourceType: seed.sourceType || 'local',
      vspId: seed.vspId || '',
      sex: seed.sex || 'unspecified',
      dob: seed.dob || '',
      age: seed.age ?? null,
      workspaces: [],
    });
  }
  return entries.get(patientKey);
}

function pushWorkspace(entry, workspace) {
  const exists = entry.workspaces.some((row) => row.hash === workspace.hash);
  if (!exists) entry.workspaces.push(workspace);
}

function getWorkspaceOrder(workspace) {
  const key = `${workspace.professionId}:${workspace.templateId}`;
  const order = {
    'dietetics:dietetics-ncp': 0,
    'pt:pt-eval': 1,
    'pt:pt-simple-soap': 2,
    'pt:pt-legacy-eval': 3,
    'pt:pt-legacy-simple': 4,
  };
  return order[key] ?? 99;
}

function createV2WorkspaceSet(caseId, isFacultyMode) {
  const baseHash = buildEditorHash({
    professionId: 'dietetics',
    caseId,
    isFacultyMode,
  });

  return [
    {
      workspaceId: `${caseId}:dietetics-ncp`,
      professionId: 'dietetics',
      templateId: 'dietetics-ncp',
      label: 'Dietetics NCP',
      hash: baseHash,
      caseId,
      shell: 'v2',
    },
    {
      workspaceId: `${caseId}:pt-eval`,
      professionId: 'pt',
      templateId: 'pt-eval',
      label: 'PT Evaluation',
      hash: appendHashParams(baseHash, {
        profession: 'pt',
        template: 'pt-eval',
      }),
      caseId,
      shell: 'v2',
    },
    {
      workspaceId: `${caseId}:pt-simple-soap`,
      professionId: 'pt',
      templateId: 'pt-simple-soap',
      label: 'PT Simple SOAP',
      hash: appendHashParams(baseHash, {
        profession: 'pt',
        template: 'pt-simple-soap',
      }),
      caseId,
      shell: 'v2',
    },
  ];
}

function inferLegacyTemplateId(draft) {
  return draft?.noteType === 'simple-soap' ? 'pt-legacy-simple' : 'pt-legacy-eval';
}

function inferLegacyTemplateLabel(templateId) {
  return templateId === 'pt-legacy-simple' ? 'PT Simple SOAP (Legacy)' : 'PT Evaluation (Legacy)';
}

export function buildPatientWorkspaceIndex({ isFacultyMode = false } = {}) {
  const entries = new Map();
  const registryPatients = listPatients();
  const registryById = new Map(registryPatients.map((record) => [record.id, record]));

  registryPatients.forEach((record) => {
    const name = normalizeName(
      displayName(record) || record.preferredName || '',
      'Unnamed Patient',
    );
    ensurePatientEntry(entries, `vsp:${record.id}`, {
      patientName: name,
      sourceType: 'vsp',
      vspId: record.id,
      sex: record.sex || 'unspecified',
      dob: record.dob || '',
      age: computeAge(record.dob),
    });
  });

  const cases = readDieteticsCases();
  Object.entries(cases).forEach(([caseId, row]) => {
    const caseObj = row?.caseObj || {};
    const meta = caseObj.meta || {};
    const vspId = String(meta.vspId || '').trim();
    const registryRecord = vspId ? registryById.get(vspId) : null;
    const patientName = registryRecord
      ? normalizeName(displayName(registryRecord) || registryRecord.preferredName || '')
      : normalizeName(meta.patientName || meta.title || row?.title || '');
    const key = vspId ? `vsp:${vspId}` : `local-case:${caseId}`;
    const entry = ensurePatientEntry(entries, key, {
      patientName,
      sourceType: vspId ? 'vsp' : 'local',
      vspId,
      sex: registryRecord?.sex || meta.sex || 'unspecified',
      dob: registryRecord?.dob || meta.dob || '',
      age: registryRecord ? computeAge(registryRecord.dob) : null,
    });

    createV2WorkspaceSet(caseId, isFacultyMode).forEach((workspace) =>
      pushWorkspace(entry, workspace),
    );
  });

  const mode = isFacultyMode ? 'instructor' : 'student';
  storage
    .keys()
    .filter((key) => key.startsWith(LOCAL_PT_PREFIX))
    .forEach((key) => {
      const patientId = key.replace('patient_', '');
      const meta = safeJsonParse(storage.getItem(key), {}) || {};
      const vspId = String(meta.vspId || '').trim();
      const registryRecord = vspId ? registryById.get(vspId) : null;
      const patientName = registryRecord
        ? normalizeName(displayName(registryRecord) || registryRecord.preferredName || '')
        : normalizeName(meta.name || '', 'Local Patient');
      const draft = safeJsonParse(storage.getItem(`draft_${patientId}_eval`), null);
      const templateId = inferLegacyTemplateId(draft);
      const entryKey = vspId ? `vsp:${vspId}` : `local-pt:${patientId}`;
      const entry = ensurePatientEntry(entries, entryKey, {
        patientName,
        sourceType: vspId ? 'vsp' : 'local',
        vspId,
        sex: registryRecord?.sex || meta.sex || 'unspecified',
        dob: registryRecord?.dob || meta.dob || '',
        age: registryRecord ? computeAge(registryRecord.dob) : null,
      });

      pushWorkspace(entry, {
        workspaceId: `${patientId}:${templateId}`,
        professionId: 'pt',
        templateId,
        label: inferLegacyTemplateLabel(templateId),
        hash: buildEditorHash({
          professionId: 'pt',
          caseId: patientId,
          encounter: 'eval',
          isFacultyMode: mode === 'instructor',
        }),
        caseId: patientId,
        shell: 'legacy',
      });
    });

  const rows = Array.from(entries.values())
    .filter((entry) => entry.workspaces.length > 0)
    .map((entry) => ({
      ...entry,
      isLocalOnly: entry.sourceType !== 'vsp',
      workspaces: [...entry.workspaces].sort((a, b) => {
        const orderDelta = getWorkspaceOrder(a) - getWorkspaceOrder(b);
        if (orderDelta !== 0) return orderDelta;
        return a.label.localeCompare(b.label);
      }),
    }))
    .sort((a, b) => a.patientName.localeCompare(b.patientName));

  return rows;
}
