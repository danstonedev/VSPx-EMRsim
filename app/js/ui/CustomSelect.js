/**
 * CustomSelect Component
 * Fully customizable dropdown replacement for native <select> elements
 * with complete CSS control and keyboard/screen reader accessibility
 */

import { el } from './utils.js';

/**
 * Creates a custom select dropdown with full styling control
 * @param {Object} options - Configuration options
 * @param {string} options.value - Currently selected value
 * @param {Array<{value: string, label: string}>} options.options - Available options
 * @param {Function} options.onChange - Change handler (receives new value)
 * @param {string} [options.className] - Additional CSS class
 * @param {string} [options.placeholder] - Placeholder text for empty value
 * @param {Object} [options.dataAttrs] - Data attributes to apply to container
 * @returns {Object} - { element, setValue, getValue, destroy }
 */
export function createCustomSelect({
  value = '',
  options = [],
  onChange,
  className = '',
  placeholder = '—',
  dataAttrs = {},
}) {
  let currentValue = value;
  let isOpen = false;
  let activeIndex = -1;
  let searchBuffer = '';
  let searchTimeout = null;

  // Main container
  const container = el('div', {
    class: `custom-select ${className}`,
    tabindex: '0',
    role: 'combobox',
    'aria-expanded': 'false',
    'aria-haspopup': 'listbox',
    ...dataAttrs,
  });

  // Display button showing current selection
  const button = el('div', { class: 'custom-select__button' });
  const buttonText = el('span', { class: 'custom-select__button-text' });
  const arrow = el('span', { class: 'custom-select__arrow', 'aria-hidden': 'true' }, '▼');
  button.appendChild(buttonText);
  button.appendChild(arrow);

  // Dropdown list
  const dropdown = el('div', {
    class: 'custom-select__dropdown',
    role: 'listbox',
    'aria-hidden': 'true',
  });

  // Create option elements
  const optionElements = options.map((opt, index) => {
    const optEl = el(
      'div',
      {
        class: 'custom-select__option',
        role: 'option',
        'data-value': opt.value,
        'data-index': index,
        'aria-selected': opt.value === currentValue ? 'true' : 'false',
      },
      opt.label,
    );
    return optEl;
  });

  optionElements.forEach((optEl) => dropdown.appendChild(optEl));

  container.appendChild(button);
  container.appendChild(dropdown);

  // Update button text based on current value
  function updateButtonText() {
    const selected = options.find((opt) => opt.value === currentValue);
    buttonText.textContent = selected ? selected.label : placeholder;
    if (!selected || !currentValue) {
      buttonText.classList.add('custom-select__button-text--placeholder');
    } else {
      buttonText.classList.remove('custom-select__button-text--placeholder');
    }
  }

  // Open dropdown
  function open() {
    if (isOpen) return;
    isOpen = true;
    container.classList.add('custom-select--open');
    container.setAttribute('aria-expanded', 'true');
    dropdown.setAttribute('aria-hidden', 'false');

    // Set active index to currently selected option
    activeIndex = options.findIndex((opt) => opt.value === currentValue);
    if (activeIndex === -1 && options.length > 0) activeIndex = 0;
    updateActiveOption();

    // Position dropdown (handle viewport overflow)
    positionDropdown();

    // Add click-outside listener
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
  }

  // Close dropdown
  function close() {
    if (!isOpen) return;
    isOpen = false;
    container.classList.remove('custom-select--open');
    container.setAttribute('aria-expanded', 'false');
    dropdown.setAttribute('aria-hidden', 'true');
    activeIndex = -1;
    updateActiveOption();
    document.removeEventListener('click', handleClickOutside);
  }

  // Toggle dropdown
  function toggle() {
    if (isOpen) close();
    else open();
  }

  // Position dropdown to avoid viewport overflow
  function positionDropdown() {
    const rect = container.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = dropdown.offsetHeight || 200; // Estimated

    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      dropdown.classList.add('custom-select__dropdown--above');
    } else {
      dropdown.classList.remove('custom-select__dropdown--above');
    }
  }

  // Update visual active state for keyboard navigation
  function updateActiveOption() {
    optionElements.forEach((optEl, index) => {
      if (index === activeIndex) {
        optEl.classList.add('custom-select__option--active');
        optEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        optEl.classList.remove('custom-select__option--active');
      }
    });
  }

  // Select an option
  function selectOption(newValue) {
    if (newValue === currentValue) {
      close();
      return;
    }

    currentValue = newValue;

    // Update selected state
    optionElements.forEach((optEl) => {
      const optValue = optEl.getAttribute('data-value');
      if (optValue === currentValue) {
        optEl.classList.add('custom-select__option--selected');
        optEl.setAttribute('aria-selected', 'true');
      } else {
        optEl.classList.remove('custom-select__option--selected');
        optEl.setAttribute('aria-selected', 'false');
      }
    });

    updateButtonText();

    // Close immediately before triggering callback
    close();

    // Trigger change callback after closing
    if (onChange) {
      // Use microtask to ensure close completes first
      Promise.resolve().then(() => onChange(currentValue));
    }
  }

  // Handle click outside to close
  function handleClickOutside(e) {
    if (!container.contains(e.target)) {
      close();
    }
  }

  // Handle option click
  function handleOptionClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const optEl = e.target.closest('.custom-select__option');
    if (!optEl) return;
    const newValue = optEl.getAttribute('data-value');
    selectOption(newValue);
  }

  // Handle keyboard navigation
  function handleKeyDown(e) {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && activeIndex >= 0) {
          selectOption(options[activeIndex].value);
        } else {
          toggle();
        }
        break;

      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          close();
          container.focus();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          open();
        } else if (activeIndex < options.length - 1) {
          activeIndex++;
          updateActiveOption();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          open();
        } else if (activeIndex > 0) {
          activeIndex--;
          updateActiveOption();
        }
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          activeIndex = 0;
          updateActiveOption();
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          activeIndex = options.length - 1;
          updateActiveOption();
        }
        break;

      case 'Tab':
        if (isOpen) {
          close();
        }
        break;

      default:
        // Type-ahead search
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          handleTypeAhead(e.key);
        }
        break;
    }
  }

  // Type-ahead search functionality
  function handleTypeAhead(char) {
    clearTimeout(searchTimeout);
    searchBuffer += char.toLowerCase();

    // Find first matching option
    const matchIndex = options.findIndex((opt) => opt.label.toLowerCase().startsWith(searchBuffer));

    if (matchIndex !== -1) {
      if (isOpen) {
        activeIndex = matchIndex;
        updateActiveOption();
      } else {
        selectOption(options[matchIndex].value);
      }
    }

    // Clear search buffer after 1 second
    searchTimeout = setTimeout(() => {
      searchBuffer = '';
    }, 1000);
  }

  // Event listeners
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });
  dropdown.addEventListener('click', (e) => {
    e.stopImmediatePropagation();
    handleOptionClick(e);
  });
  container.addEventListener('keydown', handleKeyDown);

  // Initialize
  updateButtonText();

  // Mark selected option
  const selectedIndex = options.findIndex((opt) => opt.value === currentValue);
  if (selectedIndex !== -1) {
    optionElements[selectedIndex].classList.add('custom-select__option--selected');
  }

  // Public API
  return {
    element: container,
    getValue: () => currentValue,
    setValue: (newValue) => {
      currentValue = newValue;
      updateButtonText();
      optionElements.forEach((optEl) => {
        const optValue = optEl.getAttribute('data-value');
        if (optValue === currentValue) {
          optEl.classList.add('custom-select__option--selected');
          optEl.setAttribute('aria-selected', 'true');
        } else {
          optEl.classList.remove('custom-select__option--selected');
          optEl.setAttribute('aria-selected', 'false');
        }
      });
    },
    destroy: () => {
      close();
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(searchTimeout);
      container.remove();
    },
  };
}
