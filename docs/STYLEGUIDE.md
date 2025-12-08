# PT EMR Simulator – UI / Theming Style Guide

This guide formalizes the design system and implementation patterns used in the PT EMR Simulator so they can be reused or adapted (e.g., for a Chatbot interface) and reliably applied by developers or LLM-based automation.

---

## 1. Core Design Principles

1. **Performance First:** Ship only critical CSS eagerly. Prefetch/lazy-load non-critical styles.
2. **Token-Driven:** All colors, spacing, elevation, radii, and semantic states use CSS custom properties.
3. **Progressive Enhancement:** Dark mode and high-contrast use attribute/media overrides; never duplicate full stylesheets.
4. **Deterministic Layout:** Structural dimensions expressed via tokens (e.g., `--sidebar-w`, `--topbar-h`).
5. **Accessible by Default:** Visible focus states, proper ARIA attributes, and motion reduction support.
6. **Idempotent Initialization:** Components can be safely re-initialized; bootstrap retries handle late DOM arrival.
7. **Coalesced UI Updates:** Expensive refresh logic uses rAF scheduling with dirty flags — never recursive inline loops.
8. **Debug Transparency:** Instrumentation gated behind query params (`?debug=1`, feature-specific flags like `?debug=progress`).

---

## 2. Token Catalog

Light mode defaults defined under `:root`. Dark overrides under `html[data-theme="dark"]`. Add new semantic tokens instead of reusing raw brand values directly.

```css
:root {
  /* Brand */
  --und-green: #009a44;
  --und-green-light: #f0fdf4;
  --und-orange: #ff9c31;

  /* Neutral / Surfaces */
  --white: #ffffff;
  --bg: #f8fafc;
  --bg-hover: #f1f5f9;
  --panel: #f1f5f9;
  --panel-alt: #edf2f7;
  --surface-light: #ffffff;
  --surface-light-hover: #f5f5f5;
  --surface-light-border: #e2e8f0;
  --color-border: #d1d9e2;

  /* Text */
  --text: #1a202c;
  --text-secondary: #4a5568;
  --text-on-light: #1a202c;

  /* Gradients */
  --header-gradient-left: #0d4d2c;
  --header-gradient-right: #0a3722;

  /* Elevation */
  --elev-none: none;
  --elev-deep: 0 8px 28px rgba(0, 0, 0, 0.45);

  /* Layout */
  --sidebar-w: 300px;
  --topbar-h: 56px;

  /* Layers */
  --z-topbar: 3000;
  --z-modal: 2600;
  --z-sidebar: 1800;
  --z-overlay: 900;
  --z-floating-tab: 1200;

  /* Typography */
  --font-xs: 0.75rem;
  --font-sm: 0.8125rem;
  --font-md: 0.875rem;
  --font-base: 1rem;
  --font-lg: 1.125rem;
  --font-xl: 1.25rem;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Sidebar Semantic */
  --sidebar-surface: linear-gradient(
    90deg,
    var(--header-gradient-left),
    var(--header-gradient-right)
  );
  --sidebar-border: rgba(0, 0, 0, 0.12);
  --sidebar-fg: var(--white);
  --sidebar-link: var(--white);
  --sidebar-hover: var(--und-green-light);
  --sidebar-hover-fg: var(--und-green);
  --sidebar-active: var(--und-green-light);
  --sidebar-active-fg: var(--und-green);
  --sidebar-active-bar: var(--und-green);

  /* Buttons */
  --btn-bg: var(--und-green);
  --btn-fg: #fff;
  --btn-hover-bg: #037a37;
  --btn-border: var(--und-green);

  /* Role (Chatbot extension) */
  --role-user-bg: var(--und-green-light);
  --role-user-fg: var(--text-on-light);
  --role-assistant-bg: var(--surface-light);
  --role-assistant-fg: var(--text);
  --role-system-bg: #fff3e0;
  --role-system-fg: #5a3b00;
}
html[data-theme='dark'] {
  --bg: #0f172a;
  --panel: #1f2937;
  --panel-alt: #273246;
  --surface-light: #1f2937;
  --surface-light-hover: #243047;
  --surface-light-border: #334155;
  --color-border: #334155;
  --text: rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(255, 255, 255, 0.65);

  --sidebar-surface-dark: linear-gradient(90deg, #1f2937, #111827);
  --sidebar-border-dark: rgba(255, 255, 255, 0.12);
  --sidebar-fg-dark: rgba(255, 255, 255, 0.92);
  --sidebar-link-dark: rgba(255, 255, 255, 0.85);
  --sidebar-hover-dark: rgba(255, 255, 255, 0.08);
  --sidebar-hover-fg-dark: #fff;
  --sidebar-active-dark: rgba(255, 255, 255, 0.12);
  --sidebar-active-fg-dark: #fff;
  --sidebar-active-bar-dark: var(--und-green);

  --btn-bg: #046945;
  --btn-hover-bg: #058050;

  --role-user-bg: rgba(0, 154, 68, 0.18);
  --role-user-fg: #e6ffe8;
  --role-assistant-bg: #243047;
  --role-assistant-fg: var(--text);
  --role-system-bg: #3a2a12;
  --role-system-fg: #ffd9a1;
}
```

> Spacing scale: multiples of **4px**. Prefer utilities or component class padding combinations rather than bespoke new sizes.

---

## 3. Layout & Breakpoints

| Name    | Range              | Notes                              |
| ------- | ------------------ | ---------------------------------- |
| Mobile  | `max-width: 768px` | Drawer & condensed nav             |
| Compact | `769px–900px`      | Transitional layout                |
| Desktop | `min-width: 901px` | Fixed sidebar; no drawer transform |

Mobile drawer width: `min(90vw, 340px)` (or adapt to context).

---

## 4. Accessibility Patterns

- **ARIA:** `aria-expanded` on toggles, `aria-hidden` on hidden overlays, `aria-controls` linking buttons to drawers.
- **Focus Rings:** Always visible (`outline: 2–3px solid var(--und-orange)`), use `:focus-visible`.
- **Reduced Motion:** Disable transitions in `@media (prefers-reduced-motion: reduce)`.
- **Contrast:** Maintain AA (4.5:1) for body text; lighten foreground in dark mode with rgba white.
- **Focus Management:** On open, focus first interactive element; on close, return focus to invoking control.

---

## 5. Motion & Transition Guidelines

| Element             | Duration  | Easing                      |
| ------------------- | --------- | --------------------------- |
| Drawer slide        | 240–300ms | `cubic-bezier(0.4,0,0.2,1)` |
| Hover/Active color  | 160–200ms | `ease`                      |
| Collapsible content | 180–240ms | `ease`                      |
| Reduced motion      | 0ms       | none                        |

Avoid chained transitions; coalesce multiple property changes.

---

## 6. Sidebar / Drawer Structure

Example (desktop):

```html
<aside class="chart-navigation" role="navigation">
  <div class="section-card section-status-complete">
    <button class="section-nav-item">Subjective</button>
    <div class="subsection-toc">...</div>
  </div>
</aside>
```

Mobile variant uses body class `case-drawer-open` + transform animation. Drawer toggle tab ("nudge") remains a floating button.

---

## 7. Chatbot Adaptation Mapping

| Simulator Concept  | Chat Equivalent                           |
| ------------------ | ----------------------------------------- |
| Sidebar Sections   | Conversation list / channels              |
| Section Status Bar | Conversation unread / state accent        |
| Artifact Pills     | Message tags / metadata chips             |
| Drawer Nudge       | Show/Hide conversation panel toggle       |
| Progress Refresh   | Unread count / typing indicator recompute |

---

## 8. Message Bubble Pattern

```css
.message {
  max-width: 76ch;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  line-height: 1.4;
  font-size: var(--font-base);
  position: relative;
  border: 1px solid var(--surface-light-border);
  background: var(--panel);
  color: var(--text);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}
html[data-theme='dark'] .message {
  border-color: var(--color-border);
}
.message--user {
  background: var(--role-user-bg);
  color: var(--role-user-fg);
  border-color: var(--und-green);
}
.message--assistant {
  background: var(--role-assistant-bg);
  color: var(--role-assistant-fg);
}
.message--system {
  background: var(--role-system-bg);
  color: var(--role-system-fg);
}
.message:focus-visible {
  outline: 3px solid var(--und-orange);
  outline-offset: 2px;
}
```

---

## 9. Buttons

```css
.btn {
  --btn-pad-y: 0.625rem;
  --btn-pad-x: 1rem;
  display: inline-flex;
  gap: 0.5rem;
  padding: var(--btn-pad-y) var(--btn-pad-x);
  font-size: var(--font-sm);
  font-weight: 600;
  background: var(--btn-bg);
  color: var(--btn-fg);
  border: 1px solid var(--btn-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    background-color 0.18s,
    border-color 0.18s,
    box-shadow 0.18s;
}
.btn:hover,
.btn:focus {
  background: var(--btn-hover-bg);
}
.btn:focus-visible {
  outline: 3px solid var(--und-orange);
  outline-offset: 2px;
}
.btn.secondary {
  background: var(--surface-light);
  color: var(--text);
  border-color: var(--surface-light-border);
}
html[data-theme='dark'] .btn.secondary {
  background: var(--panel);
  border-color: var(--color-border);
}
```

---

## 10. Overlay & Drawer (Generic)

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease;
  z-index: var(--z-overlay);
}
.overlay.is-visible {
  opacity: 1;
  visibility: visible;
}
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: min(90vw, 340px);
  height: 100vh;
  background: var(--sidebar-surface);
  color: var(--sidebar-fg);
  border-right: 1px solid var(--sidebar-border);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: var(--z-sidebar);
}
.drawer.is-open {
  transform: translateX(0);
}
html[data-theme='dark'] .drawer {
  background: var(--sidebar-surface-dark);
  color: var(--sidebar-fg-dark);
  border-right-color: var(--sidebar-border-dark);
}
@media (min-width: 901px) {
  .drawer {
    position: static;
    transform: none;
    height: auto;
    width: var(--sidebar-w);
  }
}
@media (prefers-reduced-motion: reduce) {
  .drawer,
  .overlay,
  .btn {
    transition: none !important;
  }
}
```

---

## 11. Initialization & Retry Pattern

1. Attempt immediate init if DOM ready.
2. Fallback chain: `requestAnimationFrame` → 100ms timeout → 400ms timeout.
3. Add MutationObserver as last resort for late DOM injection.
4. Guard with a bootstrap flag (e.g., `window._featureBootstrapAttached`).

---

## 12. Coalesced Refresh Pattern

```js
function createCoalescedUpdater(render) {
  let raf = null,
    dirty = false;
  return function schedule() {
    dirty = true;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      if (!dirty) return;
      dirty = false;
      render();
    });
  };
}
```

Use for unread counts, navigation highlighting, progress bars, etc.

---

## 13. Debug Logging Convention

```js
const DEBUG = location.search.includes('debug=1');
function log(tag, ...args) {
  if (DEBUG) console.warn(`[${tag}]`, ...args);
}
```

Feature-specific flag example: `?debug=progress` OR unify within `debug=1` switch.

---

## 14. Anti-Patterns

| Avoid                                 | Reason                   | Fix                          |
| ------------------------------------- | ------------------------ | ---------------------------- |
| Hard-coded hex colors in components   | Breaks theme scalability | Use tokens                   |
| Recursive synchronous refresh loops   | Performance regression   | Schedule via rAF             |
| Removing outlines with no replacement | Accessibility failure    | Use `:focus-visible` outline |
| Deep descendant selectors             | Fragile & slow           | Flat BEM-like class names    |
| Overlapping z-index magic numbers     | Stacking bugs            | Tokenize layers              |

---

## 15. Quick Implementation Checklist

- [ ] Import base tokens
- [ ] Add dark theme attribute strategy
- [ ] Implement sidebar/drawer using token surfaces
- [ ] Add message role bubble classes
- [ ] Wire overlay + drawer accessibility
- [ ] Add rAF-coalesced update logic
- [ ] Add debug logging gate
- [ ] Test reduced-motion path
- [ ] Validate contrast (light + dark)
- [ ] Keyboard navigation audit

---

## 16. LLM Instruction Snippet

> “Apply the PT EMR design system: use provided CSS tokens for all colors/spacing; implement accessible focus outlines; coalesce high-frequency UI updates with a requestAnimationFrame dirty-flag scheduler; implement dark mode via `html[data-theme='dark']` overrides; use drawer + overlay patterns for mobile; avoid hard-coded colors or recursive layout calls; ensure message roles (user/assistant/system) map to the declared role tokens.”

---

## 17. Future Enhancements

- High-contrast theme variant.
- Density modes (comfortable/compact) via root modifier.
- Automated token diff script (see planned `generate-design-tokens.mjs`).
- JSON export for design tooling ingestion.

---

## 18. Table Input & Component Patterns

This section documents the unified table system and input patterns used across all assessment tables.

### 18.1 Table Design Tokens

All tables use the `.combined-neuroscreen-table` class which defines these tokens:

```css
.combined-neuroscreen-table {
  /* Input sizing */
  --table-input-width-sm: 3.75rem; /* 60px - Height ft/in */
  --table-input-width-md: 5rem; /* 80px - BP, HR, vitals */
  --table-input-width-lg: 7.5rem; /* 120px - Selects, wider */

  /* Typography */
  --table-font-size: var(--font-md, 0.875rem); /* 14px */
  --table-font-size-sm: var(--font-sm, 0.8125rem); /* 13px */
  --table-header-font: var(--font-base, 1rem); /* 16px */

  /* Spacing */
  --table-cell-padding: var(--space-4, 1rem);
  --table-cell-padding-y: var(--space-3, 0.75rem);
  --table-flex-gap: var(--space-2, 0.5rem);
}
```

### 18.2 Input Classes

| Class                                    | Purpose                     | Example Use             |
| ---------------------------------------- | --------------------------- | ----------------------- |
| `.combined-neuroscreen__input`           | Base input styling          | All table inputs        |
| `.combined-neuroscreen__input--sm`       | 60px width                  | Height ft/in fields     |
| `.combined-neuroscreen__input--md`       | 80px width                  | BP, HR, temp fields     |
| `.combined-neuroscreen__input--lg`       | 120px width                 | Wide inputs             |
| `.combined-neuroscreen__input--left`     | Left-aligned text           | Detail/notes fields     |
| `.combined-neuroscreen__input--right`    | Right-aligned text          | Numeric values          |
| `.combined-neuroscreen__input--inline`   | Compact with visible border | ROM degree inputs       |
| `.combined-neuroscreen__input--readonly` | Disabled appearance         | Calculated fields (BMI) |

### 18.3 Table Variants

| Class                                  | Purpose                                       |
| -------------------------------------- | --------------------------------------------- |
| `.combined-neuroscreen-table`          | Full-width table (ROM, Neuro, MMT)            |
| `.combined-neuroscreen-table--compact` | Auto-width, lighter borders (Vitals, Billing) |

### 18.4 Cell Alignment Utilities

| Class                              | Effect                   |
| ---------------------------------- | ------------------------ |
| `.combined-neuroscreen-td--left`   | Left-align cell content  |
| `.combined-neuroscreen-td--center` | Center cell content      |
| `.combined-neuroscreen-td--right`  | Right-align cell content |

### 18.5 Input Groups & Suffixes

```js
// Input with unit suffix (bpm, mmHg, etc.)
el('div', { class: 'combined-neuroscreen-input-group' }, [
  el('input', { class: 'combined-neuroscreen__input combined-neuroscreen__input--md' }),
  el('span', { class: 'text-muted' }, 'bpm'),
]);

// Degree input with symbol suffix
el('div', { class: 'combined-neuroscreen-input-suffix' }, [
  el('input', { class: 'combined-neuroscreen__input combined-neuroscreen__input--transparent' }),
  el('span', { class: 'combined-neuroscreen-input-suffix__symbol' }, '°'),
]);
```

### 18.6 Custom Select in Tables

Custom selects automatically inherit table styling:

```css
.combined-neuroscreen-table .custom-select__button {
  min-height: 2rem; /* 32px standard */
  padding: 0.375rem 0.5rem;
  background: var(--neutral-50);
  border: 1px solid var(--color-border);
}

/* Compact variant uses smaller selects */
.combined-neuroscreen-table--compact .custom-select__button {
  min-height: 1.75rem; /* 28px */
}
```

### 18.7 Button Patterns

| Class              | Size    | Use Case                         |
| ------------------ | ------- | -------------------------------- |
| `.compact-add-btn` | 24×24px | Green "+" circle for adding rows |
| `.remove-btn`      | 24×24px | Red "×" for removing rows        |

### 18.8 Best Practices

1. **Never use inline styles** for alignment or colors — use CSS classes
2. **Use size modifiers** (`--sm`, `--md`, `--lg`) instead of custom widths
3. **Apply `--compact` variant** to simple 2-3 column tables
4. **Use `--transparent` variant** for minimal ROM-style inputs
5. **Use `--readonly` class** for calculated/disabled fields

---

## 19. License / Attribution

This style guide derives from the PT EMR Simulator codebase; adapt freely within the project’s existing license terms.

---

### End of Style Guide
