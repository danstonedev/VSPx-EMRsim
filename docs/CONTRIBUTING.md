# Contributing

Thanks for improving the UND‑PT EMR Simulator. This project is a pure‑frontend SPA (no backend) built with ES modules and static assets under `app/`.

## Development setup

- Node 18+ for tooling
- Local dev server (Hot Reloading): `npm run dev` or `./start_servers_simple.ps1`
- Browser tests: open files in `app/tests/*.test.html`

Scripts:

- `npm run lint` → ESLint on `app/js/**/*.js`
- `npm run format` → Prettier write
- `npm run check` → ESLint + Prettier check

## Branching and commits

- Create a feature branch: `feature/<short-topic>` or `fix/<short-topic>`
- Keep commits focused; prefer small, readable diffs
- Use descriptive commit messages (Conventional Commits style is welcome but not required)

Examples:

- `feat(navigation): add active trail highlighting`
- `fix(editor): prevent draft overwrite on tab switch`
- `docs: add case authoring guide`

## Pull requests

- Reference related issues if applicable
- Describe user impact and how to validate
- Paste the checklist from `.github/workflows/copilot-style-guide.md` into the PR description (as directed by `.github/copilot-instructions.md`)
- Include screenshots/GIFs for UI changes (light/dark)
- Verify a11y basics (focus order, labels, color contrast, reduced motion)

## Code guidelines

JavaScript

- ES modules only; avoid globals except for intentional bridges (e.g., docx)
- Prefer `ui/utils.el()` or component helpers over raw `innerHTML`
- Register routes in a module and ensure it’s imported in `initializeApp()` before `startRouter()`
- Keep functions small; handle edge cases (empty/null, slow, timeouts)

CSS

- Use tokens defined in `app/css/*.css` (UND green/gray, etc.)
- BEM‑ish classes; avoid deep selectors and ID styling (except scoped overrides)
- Respect `prefers-reduced-motion` and theme tokens (light/dark)

Accessibility

- One `<h1>` per view; use semantic sections and labels
- Ensure keyboard access and visible focus indicators
- Use ARIA only as needed; keep roles/states in sync with behavior

## Data & storage

- Use the store API (don’t roll your own storage keys):
  - Cases: `listCases()`, `getCase(id)`, `createCase(obj)`, `updateCase(id, obj)`, `deleteCase(id)`
  - Drafts: `saveDraft(caseId, encounter, draft)`, `loadDraft(caseId, encounter)`
- Normalize and validate before persisting: `ensureDataIntegrity`, `validateCase`
- Case initialization comes from `app/data/cases/manifest.json` → individual JSON files

## Adding routes/features

- Create a view module (e.g., `app/js/views/feature/foo.js`)
- Register a route:

  ```js
  import { route } from '../../core/router.js';
  import { el } from '../../ui/utils.js';
  route('#/feature/foo', async (app) => {
    app.replaceChildren(el('h1', {}, 'Foo'));
  });
  ```

- Add a dynamic import to `initializeApp()` in `app/js/core/router.js` before `startRouter()`

## Word export

- Word export uses `app/js/services/document-export.js` and requires a global `docx`
- The app does not bundle `docx`; include it in your hosting page if you need export functionality

## Case data changes

- See `docs/CASE_AUTHORING.md` for details
- After edits, run `ptStore.forceReloadCases()` in DevTools and refresh

## Reviewing changes

- Smoke test both themes, keyboard nav, and route transitions
- Check tests under `app/tests/*.test.html`
- Verify no new ESLint errors; warnings are acceptable but avoid regressions
