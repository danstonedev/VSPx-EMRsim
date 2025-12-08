# UI Inventory & Style Guide

This document provides a comprehensive breakdown of the UI elements, design tokens, and components used in the VSPx-EMRsim application.

**Live Style Guide**: Run the app and navigate to `#/styleguide` in your browser.

## 1. Design Tokens

Defined in `app/css/PROPOSED_TOKENS.css`.

### Colors (Semantic Palette)

| Token            | Value     | Description                     |
| ---------------- | --------- | ------------------------------- |
| `--color-brand`  | `green`   | Primary brand color (UND Green) |
| `--color-bg`     | `#ffffff` | Default background              |
| `--color-fg`     | `#000000` | Default foreground text         |
| `--color-muted`  | `gray`    | Muted text/elements             |
| `--color-warn`   | `orange`  | Warning state                   |
| `--color-danger` | `red`     | Error/Danger state              |

### Surfaces

| Token                     | Value              | Description                  |
| ------------------------- | ------------------ | ---------------------------- |
| `--surface-table-head`    | `#111827`          | Dark table header background |
| `--surface-table-striped` | `rgba(0,0,0,0.04)` | Zebra striping for tables    |
| `--surface-warn`          | `#fff3cd`          | Warning background           |

### Borders

| Token                   | Value     | Description                   |
| ----------------------- | --------- | ----------------------------- |
| `--color-border`        | `#d1d5db` | Default border (neutral-300)  |
| `--color-border-strong` | `#9ca3af` | Stronger border (neutral-400) |

### Typography

| Token         | Size        | Description           |
| ------------- | ----------- | --------------------- |
| `--font-xs`   | `0.75rem`   | Extra small text      |
| `--font-sm`   | `0.8125rem` | Small text (tables)   |
| `--font-md`   | `0.875rem`  | Medium text (headers) |
| `--font-base` | `1rem`      | Base body text        |
| `--font-lg`   | `1.125rem`  | Large text            |
| `--font-xl`   | `1.25rem`   | Extra large text      |

## 2. Input Components

Managed via `app/js/ui/form-components.js`.

### Standard Inputs

Styled in `app/css/components/forms-lazy.css`.

- **Text Input**: Standard `input[type="text"]`.
- **Textarea**: Standard `textarea`.
- **Select**: Native `select` element.

### Custom Components

- **CustomSelect**: A fully accessible, stylable replacement for native selects.
  - Source: `app/js/ui/CustomSelect.js`
  - Styles: `app/css/components/custom-select.css`
  - Features: Searchable, custom styling, ARIA support.

## 3. Table Systems

### Standard Table (`.table`)

- **Source**: `app/css/tables.css`
- **Usage**: General data display, Vitals, MMT.
- **Characteristics**:
  - `border-collapse: collapse`
  - Minimal vertical borders
  - Dark header (`--surface-table-head`)
  - Compact padding

### Combined ROM Table (`.combined-rom-table`)

- **Source**: `app/css/components/combined-rom.css`
- **Usage**: Range of Motion (ROM) sections.
- **Characteristics**:
  - `border-collapse: separate`
  - Rounded corners
  - **Motion Column**: Green background header (`#009a44`), 2px vertical borders.
  - **Group Headers**: Left/Right grouping.

### Combined Neuroscreen Table (`.combined-neuroscreen-table`)

- **Source**: `app/css/components/combined-neuroscreen.css`
- **Usage**: Neuroscreen sections.
- **Characteristics**:
  - Similar to ROM table but adapted for Neuro data.
  - **Level Column**: Green background header.
  - Specific column widths for inputs.

### Clinical Table (`.clinical-table`)

- **Source**: `app/css/components/clinical-tables.css`
- **Usage**: Vitals, general clinical data.
- **Characteristics**:
  - Unified styling for clinical data.
  - **Primary Column**: Green background header (`#009a44`).
  - Sticky headers.
  - Distinct from standard `.table`.

## 4. Buttons

Styled in `app/css/buttons.css`.

- **Primary**: Solid background color.
- **Secondary**: Outline or lighter background.
- **Icon Buttons**: Used in table actions (Delete/Remove).

## 5. Feedback & Overlays

- **Toast Notifications**:
  - Source: `app/js/ui/toast.js`
  - Usage: `showToast('Message', { duration: 3000 })`
  - Styles: Injected dynamically by the module.
  - Features: Auto-dismiss, bottom-center positioning.

## 6. Icons

- **System**: SVG Sprite/Dictionary system.
- **Source**: `app/js/ui/Icons.js`
- **Usage**: `createIcon('icon-name')`
- **Available Icons**: `eye`, `download`, `print`, `save`, `edit`, `plus`, `close`, `chevron-down`, `copy`, `trash`, `chevron-left`, `chevron-right`, `sort`, `share`, `preview`, `check`, `home`, `user`, `settings`.

## 7. Form Controls (Native)

- **Checkboxes & Radios**:
  - Source: `app/css/styles.css` (Global styles)
  - Dark Mode: Uses `accent-color: var(--und-green)` for visibility on dark backgrounds.

## 8. Layout Components

- **Sidebar Navigation**: `app/css/sidebar.css`
- **Case Drawer**: `app/css/case-drawer.css`
- **Mobile Navigation**: `app/css/mobile-nav.css`

## 9. Usage Map

| Component        | File Location                                    |
| ---------------- | ------------------------------------------------ |
| `BillingSection` | `app/js/features/soap/billing/BillingSection.js` |
| `RomSection`     | `app/js/features/soap/objective/RomSection.js`   |
| `NeuroScreen`    | `app/js/features/soap/objective/NeuroScreen.js`  |
| `Form Builders`  | `app/js/ui/form-components.js`                   |
