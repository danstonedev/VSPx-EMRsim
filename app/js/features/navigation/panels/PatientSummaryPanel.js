/**
 * PatientSummaryPanel – read-only demographics card shown in the detail panel.
 *
 * Resolves data from the VSP Registry when available, falling back to
 * inline case snapshot fields.  Mirrors the demographic band seen in
 * production EMRs (Epic/Cerner patient header expanded view).
 */

import { el } from '../../../ui/utils.js';
import { resolvePatientProfile } from '../../../core/patient-profile.js';

/**
 * @param {HTMLElement} container – panel body element to populate
 * @param {Object}      caseObj  – full case object (used for snapshot fallback)
 */
export function renderPatientSummary(container, caseObj) {
  container.innerHTML = '';
  const profile = resolvePatientProfile(caseObj);

  const shell = el('div', { class: 'patient-summary' });
  const hero = el('section', { class: 'patient-summary__hero' }, [
    el(
      'div',
      { class: 'patient-summary__identity' },
      [
        el('h2', { class: 'patient-summary__name' }, [profile.name]),
        profile.preferredName
          ? el('p', { class: 'patient-summary__aka' }, [`Preferred: ${profile.preferredName}`])
          : null,
      ].filter(Boolean),
    ),
    el(
      'div',
      { class: 'patient-summary__chips' },
      profile.heroChips.map((text) => chip(text)),
    ),
  ]);

  const alerts = el(
    'div',
    { class: 'patient-summary__alerts' },
    [
      alertCard(
        'Allergies',
        profile.allergies || 'NKDA',
        profile.allergies && profile.allergies !== 'NKDA' ? 'alert' : 'ok',
        profile.allergyDetails,
      ),
      profile.codeStatus ? alertCard('Code Status', profile.codeStatus, 'neutral') : null,
      profile.interpreter === 'Yes'
        ? alertCard(
            'Communication',
            `Interpreter required (${profile.language || 'Language on file'})`,
            'warn',
          )
        : null,
    ].filter(Boolean),
  );

  const sections = [
    keyValueSection(
      'Identity',
      profile.identityRows.filter(
        ([label]) => label !== 'Full Name' && label !== 'Preferred Name' && label !== 'MRN',
      ),
    ),
    keyValueSection(
      'Encounter',
      profile.encounterRows.filter(([label]) => label !== 'Code Status'),
    ),
    keyValueSection('Contact', profile.contactRows),
    keyValueSection('Coverage', profile.coverageRows),
    keyValueSection('Anthropometrics', profile.anthropometricRows),
    listSection('Clinical Background', profile.clinicalBackground),
  ].filter(Boolean);

  shell.append(hero, alerts, el('div', { class: 'patient-summary__layout' }, sections));
  container.appendChild(shell);
}

/* ---- helpers ---- */

function chip(text) {
  return text ? el('span', { class: 'patient-summary__chip' }, [text]) : null;
}

function alertCard(label, value, modifier = 'neutral', detailLines = []) {
  return el(
    'section',
    { class: `patient-summary__alert patient-summary__alert--${modifier}` },
    [
      el('span', { class: 'patient-summary__alert-label' }, [label]),
      el('span', { class: 'patient-summary__alert-value' }, [value]),
      detailLines.length
        ? el(
            'ul',
            { class: 'patient-summary__alert-list' },
            detailLines.map((line) => el('li', { class: 'patient-summary__alert-item' }, [line])),
          )
        : null,
    ].filter(Boolean),
  );
}

function keyValueSection(title, rows) {
  const presentRows = rows.filter(([, value]) => value);
  if (!presentRows.length) return null;

  return el('section', { class: 'patient-summary__section' }, [
    el('h3', { class: 'patient-summary__section-title' }, [title]),
    el(
      'dl',
      { class: 'patient-summary__list' },
      presentRows.flatMap(([label, value]) => [
        el('dt', { class: 'patient-summary__term' }, [label]),
        el('dd', { class: 'patient-summary__value' }, [value]),
      ]),
    ),
  ]);
}

function listSection(title, items) {
  if (!items.length) return null;

  return el('section', { class: 'patient-summary__section patient-summary__section--wide' }, [
    el('h3', { class: 'patient-summary__section-title' }, [title]),
    el(
      'ul',
      { class: 'patient-summary__bullet-list' },
      items.map((item) => el('li', { class: 'patient-summary__bullet-item' }, [item])),
    ),
  ]);
}
