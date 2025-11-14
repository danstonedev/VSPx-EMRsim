# Custom Select Component

A fully customizable dropdown component with UND green branding, complete keyboard navigation, and screen reader support.

## Why Use Custom Select?

Native `<select>` elements have severe browser limitations for styling, especially for `<option>` elements. This custom component provides:

- ✅ Full CSS control (UND green hover/selected states)
- ✅ Consistent appearance across all browsers
- ✅ Smooth animations (150ms transitions)
- ✅ Complete keyboard navigation
- ✅ Screen reader accessible (ARIA)
- ✅ Type-ahead search
- ✅ Dark mode support
- ✅ Zero dependencies

## Basic Usage

```javascript
import { createCustomSelect } from '../ui/CustomSelect.js';

// Create dropdown
const dropdown = createCustomSelect({
  options: [
    { value: '', label: '—' },
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ],
  value: '',
  onChange: (newValue) => {
    console.log('Selected:', newValue);
  },
  className: 'my-select',
  placeholder: 'Choose an option...',
});

// Add to DOM
parentElement.appendChild(dropdown.element);
```

## API Reference

### createCustomSelect(config)

**Config Options:**

| Property      | Type     | Required | Default | Description                                    |
| ------------- | -------- | -------- | ------- | ---------------------------------------------- |
| `options`     | Array    | Yes      | -       | Array of `{value, label}` objects              |
| `value`       | String   | No       | `''`    | Initially selected value                       |
| `onChange`    | Function | No       | -       | Callback receiving new value                   |
| `className`   | String   | No       | `''`    | Additional CSS class                           |
| `placeholder` | String   | No       | `'—'`   | Text shown when no value selected              |
| `dataAttrs`   | Object   | No       | `{}`    | Data attributes (e.g., `{'data-test': 'foo'}`) |

**Returns Object:**

```javascript
{
  element: HTMLElement,     // The dropdown DOM element
  getValue: () => String,   // Get current value
  setValue: (val) => void,  // Set new value programmatically
  destroy: () => void       // Clean up listeners and remove from DOM
}
```

## Examples

### In Combined ROM Table

```javascript
function createSelect(value, onChange) {
  const customSelect = createCustomSelect({
    value,
    options: [
      { value: '', label: '—' },
      { value: 'strong-painfree', label: 'Strong & Pain-free' },
      { value: 'strong-painful', label: 'Strong & Painful' },
      { value: 'weak-painfree', label: 'Weak & Pain-free' },
      { value: 'weak-painful', label: 'Weak & Painful' },
    ],
    onChange,
    className: 'combined-rom-select',
    dataAttrs: {
      'data-component': 'combined-rom',
      'data-element': 'select',
    },
  });
  return customSelect;
}

// Usage in table cell
cell.appendChild(createSelect('', handleChange).element);
```

### In Modal/Form

```javascript
const genderSelect = createCustomSelect({
  options: [
    { value: '', label: 'Select...' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ],
  value: currentGender,
  onChange: (val) => updateGender(val),
  className: 'instructor-form-input',
});

formField.appendChild(genderSelect.element);
```

### Programmatic Control

```javascript
const dropdown = createCustomSelect({
  options: myOptions,
  value: 'initial',
  onChange: handleChange,
});

// Later: get current value
console.log(dropdown.getValue()); // 'initial'

// Later: update value
dropdown.setValue('new-value');

// Later: clean up
dropdown.destroy();
```

## Keyboard Navigation

| Key               | Action                                            |
| ----------------- | ------------------------------------------------- |
| `Enter` / `Space` | Open dropdown or select active option             |
| `Escape`          | Close dropdown and return focus                   |
| `Arrow Down`      | Move to next option (opens if closed)             |
| `Arrow Up`        | Move to previous option (opens if closed)         |
| `Home`            | Jump to first option                              |
| `End`             | Jump to last option                               |
| `Tab`             | Close dropdown and move to next focusable element |
| `A-Z`             | Type-ahead search (1 second buffer)               |

## Styling

The component uses these CSS classes:

```css
.custom-select                    /* Container */
.custom-select--open              /* When dropdown open */
.custom-select__button            /* Display button */
.custom-select__button-text       /* Button text */
.custom-select__arrow             /* Arrow indicator */
.custom-select__dropdown          /* Options container */
.custom-select__option            /* Individual option */
.custom-select__option--active    /* Keyboard focus */
.custom-select__option--selected  /* Currently selected */
```

### UND Green Branding

- **Hover**: Light UND green tint (`rgba(0, 154, 68, 0.12)` / `0.2` dark)
- **Selected**: Pure UND green (`#009A44`) with bold white text
- **Selected Hover**: Darker green (`#007a36`)

## Migration from Native Select

### Before (Native):

```javascript
const select = el('select', {
  class: 'my-class',
  onchange: (e) => handleChange(e.target.value),
});

options.forEach((opt) => {
  const option = el('option', { value: opt.value }, opt.label);
  if (opt.value === currentValue) option.selected = true;
  select.appendChild(option);
});

parentElement.appendChild(select);
```

### After (Custom):

```javascript
const dropdown = createCustomSelect({
  options: options,
  value: currentValue,
  onChange: handleChange,
  className: 'my-class',
});

parentElement.appendChild(dropdown.element);
```

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Size**: ~340 lines JS + ~180 lines CSS
- **Memory**: Cleans up all event listeners via `destroy()`
- **Render**: Uses native DOM APIs (no virtual DOM overhead)
- **Animation**: CSS transitions (GPU accelerated)

## Accessibility

- **ARIA**: Full `role`, `aria-expanded`, `aria-selected` attributes
- **Keyboard**: Complete keyboard navigation
- **Screen Readers**: Announces state changes
- **Focus Management**: Visible focus indicators
- **Motion**: Respects `prefers-reduced-motion`

## Known Limitations

- No support for `<optgroup>` (can be added if needed)
- No multi-select mode (currently single-select only)
- Dropdown auto-closes on scroll (by design)

## Future Enhancements

Potential additions (implement if needed):

- Multi-select mode with checkboxes
- Option groups (`<optgroup>` equivalent)
- Custom option rendering (icons, badges)
- Search/filter for long lists
- Async option loading
- Virtual scrolling for 1000+ options
