/** Fields persisted alongside SOAP section data in an encounter. */
const LIFECYCLE_FIELDS = ['noteType', 'simpleSOAP', 'noteTitle', 'meta', 'amendments', 'goals'];

function cloneValue(value) {
  try {
    if (typeof structuredClone === 'function') return structuredClone(value);
  } catch {
    /* fall back */
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

export function copyDraftLifecycleToEncounter(encounterData = {}, draft = {}) {
  for (const field of LIFECYCLE_FIELDS) {
    if (draft[field] !== undefined) {
      encounterData[field] = cloneValue(draft[field]);
    }
  }
  return encounterData;
}

export function applyEncounterLifecycleToDraft(draft = {}, encounterData = {}) {
  for (const field of LIFECYCLE_FIELDS) {
    if (encounterData[field] === undefined) continue;
    if (field === 'meta' && typeof encounterData.meta === 'object') {
      draft.meta = { ...(draft.meta || {}), ...cloneValue(encounterData.meta) };
    } else {
      draft[field] = cloneValue(encounterData[field]);
    }
  }
  return draft;
}

export function finalizeDraftSignature(draft = {}, signature = {}) {
  draft.meta = draft.meta || {};

  const priorSignature = draft.meta.amendingFrom;
  if (priorSignature) {
    if (!Array.isArray(draft.amendments)) {
      draft.amendments = [];
    }
    draft.amendments.push({
      text: `Amended by ${signature.name || 'clinician'}`,
      timestamp: new Date().toISOString(),
      previousSignedAt: priorSignature.signedAt || '',
      previousSignedBy: priorSignature.signedBy || '',
      signedAt: signature.signedAt || '',
      signedBy: signature.name || '',
    });
  }

  draft.meta.signature = signature;
  delete draft.meta.amendingFrom;
  return draft;
}
