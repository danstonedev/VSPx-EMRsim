// Home — Professions Dashboard
import { route } from '../core/router.js';
import { navigate as urlNavigate } from '../core/url.js';
import { el } from '../ui/utils.js';
import { getAccessRole } from '../ui/AccessGate.js';
import { listProfessions, setCurrentProfession } from '../core/professions.js';

/**
 * Build a single profession card with Student/Faculty buttons.
 */
function ProfessionCard(prof, isFaculty) {
  const buttons = [
    el(
      'button',
      {
        class: 'btn primary profession-card__btn',
        onClick: () => {
          setCurrentProfession(prof.id);
          urlNavigate(prof.studentCases.replace('#/', '/'));
        },
      },
      'Student',
    ),
  ];
  if (isFaculty) {
    buttons.push(
      el(
        'button',
        {
          class: 'btn primary profession-card__btn',
          onClick: () => {
            setCurrentProfession(prof.id);
            urlNavigate(prof.instructorCases.replace('#/', '/'));
          },
        },
        'Faculty',
      ),
    );
  }

  return el('div', { class: 'profession-card', 'data-profession': prof.id }, [
    el('div', { class: 'profession-card__icon' }, prof.icon),
    el('h2', { class: 'profession-card__title' }, prof.name),
    el('p', { class: 'profession-card__desc' }, prof.description),
    el('div', { class: 'profession-card__actions' }, buttons),
  ]);
}

/**
 * "Coming soon" placeholder card.
 */
function ComingSoonCard() {
  return el('div', { class: 'profession-card profession-card--coming-soon' }, [
    el('div', { class: 'profession-card__icon' }, '➕'),
    el('h2', { class: 'profession-card__title' }, 'More Professions'),
    el('p', { class: 'profession-card__desc' }, 'Additional disciplines coming soon…'),
  ]);
}

route('#/', async (app) => {
  app.replaceChildren();
  const isFaculty = getAccessRole() === 'faculty';
  const professions = listProfessions();

  // Hero
  const hero = el('header', { class: 'professions-hero' }, [
    el('h1', {}, 'UND EMR Simulator'),
    el(
      'p',
      {},
      'Practice professional clinical documentation across disciplines in a modern, browser-based EMR—no backend required.',
    ),
  ]);

  // Profession cards grid
  const cards = professions.map((p) => ProfessionCard(p, isFaculty));
  cards.push(ComingSoonCard());

  const grid = el('div', { class: 'professions-grid' }, cards);
  const container = el('main', { class: 'professions-dashboard' }, [hero, grid]);
  app.append(container);
});
