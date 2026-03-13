// PainAssessment.js - Comprehensive Pain Assessment Module
// Systematic pain evaluation following evidence-based guidelines

import { textAreaField, selectField } from '../../../ui/form-components.js';
import { el } from '../../../ui/utils.js';

/**
 * Interactive Pain Scale Widget
 * Creates clickable 0-10 pain scale buttons with visual feedback
 */
function painScaleWidget(value, onChange) {
  const scaleContainer = el('div', { class: 'pain-scale-container' });

  for (let i = 0; i <= 10; i++) {
    const button = el(
      'button',
      {
        type: 'button',
        class: `pain-scale-btn ${
          value !== null && value !== undefined && value !== '' && String(value) === String(i)
            ? 'active'
            : ''
        }`,
        onclick: () => {
          // Update all buttons
          scaleContainer
            .querySelectorAll('.pain-scale-btn')
            .forEach((btn) => btn.classList.remove('active'));
          button.classList.add('active');
          onChange(i.toString());
        },
      },
      i.toString(),
    );
    scaleContainer.appendChild(button);
  }

  return el('div', { class: 'form-field form-field--input' }, [
    el('label', { class: 'form-label' }, 'Pain Scale (0-10)'),
    el('div', { class: 'form-input-wrapper' }, [scaleContainer]),
  ]);
}

/**
 * Pain Assessment Component - Comprehensive pain evaluation
 * Follows OPQRST pain assessment methodology
 */
export const PainAssessment = {
  /**
   * Creates pain assessment section
   * @param {Object} data - Current assessment data
   * @param {Function} updateField - Function to update field values
   * @returns {HTMLElement} Pain assessment section
   */
  create(data, updateField) {
    const section = el('div', { class: 'pain-assessment-subsection' });

    // Pain location and description
    section.append(
      textAreaField({
        label: 'Location(s)',
        value: data.painLocation,
        onChange: (v) => updateField('painLocation', v),
        hint: 'Primary location, radiation distribution, dermatome or peripheral nerve referral pattern if applicable',
      }),
    );

    // Pain intensity - Interactive pain scale widget
    section.append(painScaleWidget(data.painScale, (v) => updateField('painScale', v)));

    // Pain quality
    section.append(
      selectField({
        label: 'Quality',
        value: data.painQuality,
        options: [
          { value: '', label: 'Select pain quality...' },
          { value: 'sharp-stabbing', label: 'Sharp/Stabbing' },
          { value: 'dull-aching', label: 'Dull/Aching' },
          { value: 'burning', label: 'Burning' },
          { value: 'throbbing-pulsing', label: 'Throbbing/Pulsing' },
          { value: 'cramping', label: 'Cramping' },
          { value: 'tingling-pins-needles', label: 'Tingling/Pins & needles' },
          { value: 'numbness', label: 'Numbness' },
          { value: 'stiffness', label: 'Stiffness' },
        ],
        onChange: (v) => updateField('painQuality', v),
      }),
    );

    // Pain pattern/timing
    section.append(
      selectField({
        label: 'Pattern',
        value: data.painPattern,
        options: [
          { value: '', label: 'Select pain pattern...' },
          { value: 'constant', label: 'Constant' },
          { value: 'intermittent', label: 'Intermittent' },
          { value: 'morning-stiffness', label: 'Morning stiffness' },
          { value: 'end-of-day', label: 'Worsens throughout day' },
          { value: 'activity-related', label: 'Activity-related' },
          { value: 'positional', label: 'Positional' },
          { value: 'weather-related', label: 'Weather-related' },
        ],
        onChange: (v) => updateField('painPattern', v),
      }),
    );

    // Aggravating factors
    section.append(
      textAreaField({
        label: 'Aggravating Factors',
        value: data.aggravatingFactors,
        onChange: (v) => updateField('aggravatingFactors', v),
        hint: 'Specific movements, postures, loading conditions, or times of day that increase symptoms',
      }),
    );

    // Easing factors
    section.append(
      textAreaField({
        label: 'Easing Factors',
        value: data.easingFactors,
        onChange: (v) => updateField('easingFactors', v),
        hint: 'Rest, specific positions, heat/cold, medications, or movements that provide relief',
      }),
    );

    return section;
  },
};
