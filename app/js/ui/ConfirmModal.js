/**
 * ConfirmModal - Reusable confirmation dialog with text verification
 * Prevents accidental destructive actions by requiring user to type a confirmation string
 */
import { el } from './utils.js';
import { buildBrandedModal, openBrandedModal, closeBrandedModal } from './ModalShell.js';

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

    let modalRef;

    const close = (confirmed = false) => {
      closeBrandedModal(modalRef || {}, {
        cleanup: () => {
          if (confirmed && onConfirm) onConfirm();
          else if (!confirmed && onCancel) onCancel();
          resolve(confirmed);
        },
      });
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

    const cancelBtn = el(
      'button',
      {
        class: 'btn secondary small',
        onclick: () => close(false),
      },
      cancelButton,
    );
    confirmBtnRef = el(
      'button',
      {
        class: `btn small ${danger ? 'danger' : 'primary'}`,
        disabled: !!confirmText,
        onclick: handleConfirm,
      },
      confirmButton,
    );

    const modal = buildBrandedModal({
      title,
      contentClass: 'popup-card-base confirm-modal',
      bodyChildren: [
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
      ].filter(Boolean),
      footerChildren: [cancelBtn, confirmBtnRef],
      onRequestClose: () => close(false),
    });
    modalRef = modal;

    openBrandedModal(modalRef, {
      focusTarget: inputRef ? () => inputRef : null,
      focusDelay: 100,
    });
  });
}
