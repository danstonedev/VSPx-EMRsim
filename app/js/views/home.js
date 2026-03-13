// Home v2 (ground-up rebuild: Variant A)
import { route } from '../core/router.js';
import { navigate as urlNavigate } from '../core/url.js';
import { el } from '../ui/utils.js';
import { getAccessRole } from '../ui/AccessGate.js';

function Card(title, labelText, items) {
  return el(
    'section',
    { class: 'homev2-card' },
    [
      title ? el('h2', {}, title) : null,
      labelText ? el('div', { class: 'label' }, labelText) : null,
      items && items.length
        ? el(
            'ul',
            {},
            items.map((t) => el('li', {}, t)),
          )
        : null,
    ].filter(Boolean),
  );
}

route('#/', async (app) => {
  app.replaceChildren();
  const isFaculty = getAccessRole() === 'faculty';

  // Hero
  const ctaButtons = [
    el('button', { class: 'btn primary', onClick: () => urlNavigate('/student/cases') }, 'Student'),
  ];
  if (isFaculty) {
    ctaButtons.push(
      el(
        'button',
        { class: 'btn primary', onClick: () => urlNavigate('/instructor/cases') },
        'Faculty',
      ),
    );
  }

  const hero = el('header', { class: 'homev2-hero' }, [
    el('h1', {}, 'UND PT EMR Simulator'),
    el(
      'p',
      {},
      'Practice professional SOAP documentation and assessments in a modern, browser-only EMR—no backend required.',
    ),
    el('div', { class: 'homev2-cta' }, ctaButtons),
  ]);

  // Content grid
  const studentCard = Card('Student', 'Experience Highlights', [
    'View assigned/available cases',
    'Guided SOAP, Goals, Billing tabs',
    'Auto-save drafts to your browser',
    'Export Word reports with structured tables',
  ]);

  const cards = [studentCard];

  if (isFaculty) {
    cards.push(
      Card('Faculty', 'Program Tools', [
        'Manage and distribute cases',
        'Author demographics with DOB age helper',
        'Share deep links with cohorts',
        'Review exports that mirror the app structure',
      ]),
    );
    cards.push(
      Card('Overview', 'Executive Summary', [
        'Pure frontend: deploy to GitHub Pages',
        'Central router with shareable deep links',
        'Schema validation and migrations for cases',
        'Modular features: SOAP, Goals, Billing, Export',
      ]),
    );
  }

  const grid = el('div', { class: 'homev2-grid' }, cards);
  const container = el('main', { class: 'homev2' }, [hero, grid]);
  app.append(container);
});
