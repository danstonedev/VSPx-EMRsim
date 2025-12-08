/**
 * ConfirmModal - Reusable confirmation dialog with text verification
 * Prevents accidental destructive actions by requiring user to type a confirmation string
 */
import { el } from './utils.js';

/**
 * Show a confirmation modal that requires typing a specific string
 * @param {Object} options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Description/warning message
 * @param {string} options.confirmText - Text user must type to confirm
 * @param {string} options.confirmLabel - Label for confirmation input (default: "Type to confirm")
 * @param {string} options.confirmButton - Text for confirm button (default: "Confirm")
 * @param {string} options.cancelButton - Text for cancel button (default: "Cancel")
 * @param {Function} options.onConfirm - Callback when confirmed
 * @param {Function} options.onCancel - Callback when cancelled (optional)
 * @param {boolean} options.danger - Style as dangerous action (default: true)
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
 */
export function showConfirmModal({
  title = 'Confirm Action',
  message = '',
  confirmText = '',
  confirmLabel = 'Type to confirm',
  confirmButton = 'Confirm',
  cancelButton = 'Cancel',
  onConfirm = null,
  onCancel = null,
  danger = true,
}) {
  return new Promise((resolve) => {
    let inputRef;
    let confirmBtnRef;

    const close = (confirmed = false) => {
      try {
        modal?.classList.remove('is-open');
        const card = modal?.querySelector('.popup-card-base');
        if (card) card.classList.remove('is-open');

        const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const removeNow = () => {
          try {
            modal?.remove();
          } catch {}
        };

        if (prefersReduce) {
          removeNow();
        } else {
          modal?.addEventListener('transitionend', removeNow, { once: true });
          setTimeout(removeNow, 480);
        }

        if (confirmed && onConfirm) {
          onConfirm();
        } else if (!confirmed && onCancel) {
          onCancel();
        }

        resolve(confirmed);
      } catch {}
    };

    const handleConfirm = () => {
      if (!inputRef || inputRef.value.trim() !== confirmText) {
        // Shake animation if text doesn't match
        inputRef?.classList.add('shake');
        setTimeout(() => inputRef?.classList.remove('shake'), 400);
        return;
      }
      close(true);
    };

    const handleInput = () => {
      const isValid = inputRef && inputRef.value.trim() === confirmText;
      if (confirmBtnRef) {
        confirmBtnRef.disabled = !isValid;
      }
    };

    const overlay = el('div', {
      class: 'modal-overlay popup-overlay-base',
      role: 'dialog',
      'aria-modal': 'true',
      onclick: (e) => {
        if (e.target === overlay) close(false);
      },
    });

    const card = el(
      'div',
      {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'confirm-modal-title',
        class:
          'popup-card-base bg-surface text-color br-lg shadow-modal p-20 w-92 maxw-520 relative',
        onclick: (e) => e.stopPropagation(),
      },
      [
        el('h2', { id: 'confirm-modal-title', class: 'mb-12 fw-600' }, title),

        message &&
          el(
            'div',
            { class: 'mb-16', style: 'line-height: 1.5;' },
            typeof message === 'string' ? message : [message],
          ),

        confirmText &&
          el('div', { class: 'mb-16' }, [
            el('label', { for: 'confirm-input', class: 'block mb-8 fw-500' }, [
              confirmLabel,
              el('span', { class: 'text-secondary ml-4' }, `"${confirmText}"`),
            ]),
            (inputRef = el('input', {
              id: 'confirm-input',
              type: 'text',
              class: 'instructor-form-input w-100',
              placeholder: `Type "${confirmText}" to confirm`,
              oninput: handleInput,
              onkeydown: (e) => {
                if (e.key === 'Enter' && inputRef.value.trim() === confirmText) {
                  e.preventDefault();
                  handleConfirm();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  close(false);
                }
              },
            })),
          ]),

        el('div', { class: 'd-flex gap-8 jc-end mt-20' }, [
          el(
            'button',
            {
              class: 'btn secondary small',
              onclick: () => close(false),
            },
            cancelButton,
          ),
          (confirmBtnRef = el(
            'button',
            {
              class: `btn small ${danger ? 'danger' : 'primary'}`,
              disabled: !!confirmText, // Disabled initially if confirmation text required
              onclick: handleConfirm,
            },
            confirmButton,
          )),
        ]),
      ],
    );

    overlay.appendChild(card);
    const modal = overlay;

    document.body.appendChild(modal);

    // Trigger animations
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      card.classList.add('is-open');
    });

    // Focus input if present
    if (inputRef) {
      setTimeout(() => inputRef.focus(), 100);
    }
  });
}
