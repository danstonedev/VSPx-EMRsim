# Combined ROM Assessment Table Specification

**Version:** 2.0
**Last Updated:** November 14, 2025
**Component:** `CombinedRomSection.js`
**Styles:** `combined-rom.css`

---

## Overview

The Combined ROM Assessment Table is a streamlined, modernized component that displays Active Range of Motion (AROM), Passive Range of Motion (PROM), and Resisted Isometric Movements (RIMs) in a unified table view. This specification documents the refactored architecture that solves previous CSS conflicts and brings the component up to modern standards.

---

## Architecture

### **Namespace Isolation Pattern**

The component uses **data attributes** for complete CSS isolation from global styles:

```javascript
// All interactive elements have these attributes
'data-component': 'combined-rom'
'data-element': 'select' | 'input'
```

**Why Data Attributes?**

- Prevents class name collisions with global form styles
- Higher CSS specificity without `!important` flags
- Industry standard pattern (used by React, Vue, etc.)
- Immune to cascade order issues

### **CSS Selector Strategy**

```css
/* ✅ New approach: Attribute selectors */
select[data-component='combined-rom'][data-element='select'] {
  background: transparent;
  border: 0;
  /* No !important needed */
}

/* ❌ Old approach: Class selectors with !important */
.regional-assessment .combined-rom-table select.combined-rom-select {
  background: transparent !important;
  border: 0 !important;
}
```

### **Global Style Exclusions**

All global form styles explicitly exclude Combined ROM elements:

```css
/* styles.css */
.form-input-standard:not([data-component='combined-rom']) {
  /* ... */
}
select:not([data-component='combined-rom']) {
  /* ... */
}
```

---

## Visual Design Specification

### **RIM Dropdown (Select Element)**

**Default State:**

- Background: `transparent` (no visible background color)
- Border: `0` on all sides
- Border-bottom: `1px solid transparent` (invisible baseline)
- Padding: `0.25rem 0` (vertical only)
- Min-height: `unset` (no fixed height)
- Font-size: `0.9rem`

**Hover State:**

- Border-bottom: `1px solid var(--color-border)` (subtle gray underline)

**Focus State:**

- Border-bottom: `2px solid var(--und-green)` (green underline for accessibility)
- Outline: `none` (replaced by bottom border)

**Selected Option Display:**

- Options: `—`, `Strong & Pain-free`, `Strong & Painful`, `Weak & Pain-free`, `Weak & Painful`
- Text color: `var(--text)`

### **AROM/PROM Input Fields**

**Default State:**

- Background: `transparent`
- Border: `0` except bottom
- Border-bottom: `1px solid transparent`
- Padding: `0.25rem 0 0.25rem 0.375rem`
- Text-align: `right` (numbers right-justified)
- Max-width: `8ch` (~8 characters)

**With Degree Symbol:**

- Degree symbol (`°`) positioned at far right of cell
- Symbol color: `var(--text-muted)`
- Tight spacing: `0.25rem` gap between input and symbol

**Hover State:**

- Border-bottom: `1px solid var(--color-border)`

**Focus State:**

- Border-bottom: `2px solid var(--und-green)`

**Tooltip:**

- Title attribute shows normal ROM value: `"Normal: 180"`

---

## Table Structure

### **Header Layout**

```
┌──────────┬─────────────────────────┬─────────────────────────┐
│ SHOULDER │         Left            │         Right           │
│          ├────────┬────────┬───────┼────────┬────────┬───────┤
│          │  AROM  │  PROM  │  RIM  │  AROM  │  PROM  │  RIM  │
└──────────┴────────┴────────┴───────┴────────┴────────┴───────┘
```

### **Column Specifications**

- **Motion column:** 15% width, left-aligned
- **AROM/PROM columns:** 7rem fixed width, centered
- **RIM columns:** 12rem min-width (allows text to stay on one line)
- **Divider:** 2px solid border between Left and Right groups

### **Row Types**

**Bilateral Movements:**

- Full 6 columns populated (Left AROM/PROM/RIM, Right AROM/PROM/RIM)
- Example: Shoulder Flexion_L, Shoulder Flexion_R

**Midline Movements:**

- Only Left side populated (3 columns), Right side shows `—` placeholders
- Example: Cervical Flexion (no left/right distinction)

---

## Data Flow

### **Key Namespacing**

To avoid collisions when multiple regions are present, all data keys are prefixed:

```javascript
// Prefix format: {regionKey}:{baseKey}
// Examples:
'shoulder:Shoulder Flexion_L' -> '175'  // AROM value
'shoulder:Shoulder Flexion_R' -> '180'  // AROM value
'hip:Hip Flexion_L' -> 'strong-painfree' // RIM value
```

**Helper Functions:**

- `prefixed(base)`: Adds region prefix to base key
- `readVal(obj, baseKey)`: Reads with prefix, fallback to unprefixed
- `writeVal(obj, baseKey, val)`: Writes with prefix

### **Change Handlers**

```javascript
onAromChange(aromsData); // Called when any AROM input changes
onPromChange(promsData); // Called when any PROM input changes
onRimChange(rimsData); // Called when any RIM select changes
```

Handlers receive the **entire updated data object**, not just the changed value.

---

## Configuration

### **Constants (`COMBINED_ROM_CONFIG`)**

```javascript
const COMBINED_ROM_CONFIG = {
  component: 'combined-rom',

  rimsOptions: [
    { value: '', label: '—' },
    { value: 'strong-painfree', label: 'Strong & Pain-free' },
    { value: 'strong-painful', label: 'Strong & Painful' },
    { value: 'weak-painfree', label: 'Weak & Pain-free' },
    { value: 'weak-painful', label: 'Weak & Painful' },
  ],

  inputAttrs: {
    type: 'text',
    inputmode: 'numeric',
    pattern: '\\d*',
  },

  regionPrefixMap: {
    hip: ['Hip '],
    knee: ['Knee '],
    ankle: ['Ankle '],
    shoulder: ['Shoulder '],
    elbow: ['Elbow '],
    'wrist-hand': ['Wrist ', 'Forearm '],
    'cervical-spine': ['Cervical '],
    'thoracic-spine': ['Thoracic '],
    'lumbar-spine': ['Lumbar '],
  },
};
```

**Purpose:**

- Single source of truth for all component configuration
- Easy to modify options without touching implementation
- Can be mocked in tests

---

## API Reference

### **`createCombinedRomSection()`**

Creates a Combined ROM assessment section.

**Parameters:**

```typescript
regionKey: string; // Region identifier (e.g., 'shoulder', 'hip')
region: RegionData; // Region configuration with name and ROM items
aromsData: Object; // AROM values (key-value pairs)
promsData: Object; // PROM values (key-value pairs)
rimsData: Object; // RIMs values (key-value pairs)
onAromChange: Function; // Handler called with updated aromsData
onPromChange: Function; // Handler called with updated promsData
onRimChange: Function; // Handler called with updated rimsData
```

**Returns:**

```typescript
{
  element: HTMLElement,    // Container div to append to DOM
  rebuild: Function,       // Placeholder for future rebuild functionality
  cleanup: Function,       // Cleanup hook (currently no-op)
}
```

**Example Usage:**

```javascript
import { createCombinedRomSection } from './CombinedRomSection.js';

const section = createCombinedRomSection(
  'shoulder',
  regionConfig,
  aromsData,
  promsData,
  rimsData,
  (data) => console.log('AROM changed:', data),
  (data) => console.log('PROM changed:', data),
  (data) => console.log('RIM changed:', data),
);

container.appendChild(section.element);

// When done:
section.cleanup();
```

---

## Debug Tools

### **Activation**

Add `?debug=1` to URL to enable debug helpers:

```
http://localhost:3000/#/student/case/shoulder-001?debug=1
```

### **Available Methods**

```javascript
// Inspect specific element
window.debugCombinedROM.inspect('select[data-component="combined-rom"]:first-of-type');
// Returns: { element, classes, attributes, computedStyles, matchedRules }

// List all Combined ROM elements in document
window.debugCombinedROM.listElements();
// Returns: { tables, selects, inputs, selectIds, inputIds }

// Get component configuration
window.debugCombinedROM.getConfig();
// Returns: COMBINED_ROM_CONFIG object
```

---

## Testing

### **Test File**

`app/tests/combined-rom-styling.test.html`

Open while dev server is running:

```
http://localhost:3000/tests/combined-rom-styling.test.html
```

### **Test Coverage**

1. **Data Attributes Present** - Verifies all elements have correct `data-component` and `data-element` attributes
2. **CSS Selector Specificity** - Confirms data attribute selectors are defined in combined-rom.css
3. **Visual Inspection** - Manual visual test for transparent appearance
4. **Computed Styles Validation** - Programmatically checks computed CSS values
5. **Global Style Pollution Check** - Ensures global form styles don't affect component
6. **Input Field Transparency** - Validates AROM/PROM inputs are transparent

### **Expected Test Results**

All automated tests should **PASS** with green checkmarks:

- ✅ Table has data-component
- ✅ Select has data-component and data-element
- ✅ Input has data-component and data-element
- ✅ combined-rom.css loaded with attribute selectors
- ✅ Background is transparent
- ✅ Border is 0 or transparent
- ✅ No form-input-standard class present
- ✅ Not affected by global form rules

**Visual tests** require manual inspection:

- Dropdowns appear transparent (no background color visible)
- Only underline appears on hover/focus
- Inputs blend seamlessly into table cells

---

## Browser Compatibility

### **Tested Browsers**

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### **CSS Features Used**

- Data attribute selectors: `[data-component="combined-rom"]`
- CSS custom properties: `var(--und-green)`
- Flexbox for input wrapper layout
- `:focus-visible` for keyboard focus styles

### **Accessibility**

- WCAG 2.1 AA compliant focus indicators (2px green underline)
- Keyboard navigable (Tab through inputs/selects)
- ARIA labels on inputs with normal values
- Semantic HTML table structure
- Screen reader friendly (proper th/td relationships)

---

## Migration Notes

### **Breaking Changes from v1.0**

1. **Class names are now secondary** - Data attributes are primary identifiers
2. **`!important` flags removed** - No longer needed with attribute selectors
3. **CSS load order changed** - `combined-rom.css` now loads first in cascade
4. **Global form styles excluded** - All form classes ignore Combined ROM elements

### **Upgrading from v1.0**

If you have custom code that targets Combined ROM elements by class:

```javascript
// ❌ Old way (may break)
document.querySelector('.combined-rom-select');

// ✅ New way (recommended)
document.querySelector('select[data-component="combined-rom"]');

// ✅ Also works (but less specific)
document.querySelector('.combined-rom-select');
```

---

## Troubleshooting

### **Dropdowns still showing background color**

1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R) to clear CSS cache
2. Check DevTools Computed styles - look for source of `background` property
3. Verify `combined-rom.css` is loaded before other stylesheets
4. Use debug helper: `window.debugCombinedROM.inspect('select[data-component="combined-rom"]')`

### **Global form styles bleeding through**

1. Verify element has `data-component="combined-rom"` attribute
2. Check that global selectors include `:not([data-component="combined-rom"])`
3. Inspect matched CSS rules in DevTools

### **Inputs not right-aligned**

1. Check for conflicting `text-align` rules in parent containers
2. Verify `.input-with-suffix` flex layout is applied
3. Confirm `input[data-component="combined-rom"]` has `text-align: right`

---

## Future Enhancements

### **Planned Features**

- [ ] Implement functional `rebuild()` method for dynamic data updates
- [ ] Add animation on value changes (subtle highlight)
- [ ] Export to PDF with proper table formatting
- [ ] Keyboard shortcuts (Tab, Arrow keys for navigation)
- [ ] Bulk edit mode (apply same value to multiple cells)
- [ ] Visual indicators for abnormal ROM values (color-coded)

### **Performance Optimizations**

- [ ] Virtualization for large ROM datasets (>50 movements)
- [ ] Debounced change handlers (reduce re-renders)
- [ ] Memoized computation of grouped movements

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Data & Storage](./DATA_AND_STORAGE.md)
- [Style Guide](./STYLEGUIDE.md)
- [Testing Guide](./TESTING.md)

---

## Change Log

**v2.0** (November 14, 2025)

- ✅ Refactored to use data attribute selectors for namespace isolation
- ✅ Removed all `!important` flags from CSS
- ✅ Added comprehensive JSDoc type annotations
- ✅ Extracted configuration to `COMBINED_ROM_CONFIG` constant
- ✅ Added debug helpers for DevTools inspection
- ✅ Created test file for styling validation
- ✅ Fixed CSS conflicts with global form styles
- ✅ Reordered CSS imports for proper cascade

**v1.0** (Previous)

- Initial implementation with class-based selectors
- Multiple CSS conflicts requiring `!important` overrides
- Limited documentation and test coverage
