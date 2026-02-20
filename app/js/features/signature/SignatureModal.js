// SignatureModal.js
// Lightweight signature capture dialog used to gate Word export.
// Captures clinician name + optional title/credentials and an attestation checkbox.
// Persists name/title to localStorage for convenience.

import { el } from '../../ui/utils.js';

const LS_NAME_KEY = 'pt_emr_signature_name';
const LS_TITLE_KEY = 'pt_emr_signature_title';

function createStyleOnce() {
  if (document.getElementById('signature-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'signature-modal-styles';
  style.textContent = `
  .signature-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(2px); display:flex; align-items:center; justify-content:center; z-index:var(--z-modal,10000); padding:16px; }
  .signature-modal { background: var(--panel, var(--surface, #fff)); color: var(--text,#111); width: min(520px, 100%); border-radius: var(--radius-lg, 12px); padding: 24px 28px 28px; box-shadow: var(--shadow-2, 0 8px 24px rgba(0,0,0,.35)); display:flex; flex-direction:column; gap:18px; max-height:calc(100vh - 64px); overflow:auto; border:1px solid var(--border,#ccc); }
  /* Fade transitions */
  .signature-overlay, .signature-modal { opacity: 0; transform: scale(.985); transition: opacity 280ms ease, transform 260ms ease; }
  .signature-overlay.is-open, .signature-modal.is-open { opacity: 1; transform: scale(1); }
  @media (prefers-reduced-motion: reduce) { .signature-overlay, .signature-modal { transition:none !important; transform:none !important; } }
  .signature-modal h2 { margin:0 0 2px; font-size:1.35rem; font-weight:600; letter-spacing:.5px; color: var(--text,#111); }
  .signature-modal form { display:flex; flex-direction:column; gap:14px; }
  .signature-field { display:flex; flex-direction:column; gap:4px; }
  .signature-field label { font-weight:600; font-size:0.8rem; letter-spacing:.6px; text-transform:uppercase; color: var(--text-secondary,var(--neutral-600)); }
  .signature-field input[type=text] { padding:8px 10px; border:1px solid var(--input-border,var(--border,#999)); border-radius: var(--input-radius,6px); font:inherit; background: var(--input-bg,#fff); color: var(--input-text,var(--text,#111)); box-shadow: 0 0 0 1px transparent; transition: box-shadow .15s, border-color .15s, background .2s; }
  .signature-field input[type=text]:focus { outline:none; border-color: var(--accent,#009a44); box-shadow:0 0 0 2px color-mix(in srgb,var(--accent,#009a44) 55%, transparent); }
  .signature-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:8px; }
  .signature-actions button { flex:0 0 auto; min-width:110px; }
  .signature-actions .btn { background: var(--btn-bg,var(--surface-secondary,#eee)); color: var(--text,#111); border:1px solid var(--border,#ccc); }
  .signature-actions .btn:hover { background: var(--btn-hover,var(--surface,#e6e6e6)); }
  .signature-actions .btn.primary { background: var(--primary,#009a44); color:#fff; border:1px solid var(--primary,#009a44); font-weight:600; }
  .signature-actions .btn.primary:hover { filter:brightness(1.05); }
  .signature-error { color: var(--danger,#b00020); font-size:0.7rem; min-height:14px; letter-spacing:.3px; }
  :root[data-theme='dark'] .signature-modal { background: var(--panel,#2c2c2c); border-color: var(--border,#444); }
  :root[data-theme='dark'] .signature-field input[type=text] { background: var(--input-bg,#424242); color: var(--input-text,#fafafa); }
  :root[data-theme='dark'] .signature-field label { color: var(--text-secondary,#bdbdbd); }
  :root[data-theme='dark'] .signature-actions .btn { background: var(--btn-bg,#424242); color: var(--text,#fafafa); border-color: var(--border,#555); }
  :root[data-theme='dark'] .signature-actions .btn:hover { background: var(--btn-hover,#525252); }
  :root[data-theme='dark'] .signature-actions .btn.primary { background: var(--primary,#009a44); }
  `;
  document.head.appendChild(style);
}

function trapFocus(container) {
  function handle(e) {
    if (e.key === 'Tab') {
      const focusables = Array.from(
        container.querySelectorAll('[tabindex], button, input, select, textarea, a[href]'),
      ).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === 'Escape') {
      container.__onCancel && container.__onCancel();
    }
  }
  container.addEventListener('keydown', handle);
  return () => container.removeEventListener('keydown', handle);
}

export function openSignatureDialog({ onSigned, existingSignature } = {}) {
  createStyleOnce();
  const priorFocus = document.activeElement;

  const savedName =
    localStorage.getItem(LS_NAME_KEY) || (existingSignature && existingSignature.name) || '';
  const savedTitle =
    localStorage.getItem(LS_TITLE_KEY) || (existingSignature && existingSignature.title) || 'SPT';

  const nameInput = el('input', {
    type: 'text',
    required: true,
    value: savedName,
    placeholder: 'First Last',
    id: 'signature_name_input',
  });
  const titleInput = el('input', {
    type: 'text',
    required: false,
    value: savedTitle,
    placeholder: 'Credentials / Title (optional)',
    id: 'signature_title_input',
  });
  const errorBox = el('div', { class: 'signature-error', 'aria-live': 'polite' }, '');

  const overlay = el('div', { class: 'signature-overlay', role: 'presentation' });
  const dialog = el('div', {
    class: 'signature-modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'signature_modal_title',
  });

  function close() {
    // Animate out, then remove
    overlay.classList.remove('is-open');
    dialog.classList.remove('is-open');
    const removeNow = () => {
      try {
        overlay.remove();
      } catch {
        /* element may not exist */
      }
      detachTrap();
      priorFocus && priorFocus.focus && priorFocus.focus();
    };
    // If reduced motion or no transitions, remove immediately
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) return removeNow();
    let done = 0;
    const handleEnd = () => {
      if (++done >= 1) removeNow();
    };
    overlay.addEventListener('transitionend', handleEnd, { once: true });
    // Fallback safety
    setTimeout(removeNow, 400);
  }

  function cancel() {
    close();
  }
  function submit() {
    errorBox.textContent = '';
    const name = nameInput.value.trim();
    const title = titleInput.value.trim();
    if (!name) {
      errorBox.textContent = 'Name required.';
      nameInput.focus();
      return;
    }
    // Persist
    localStorage.setItem(LS_NAME_KEY, name);
    if (title) localStorage.setItem(LS_TITLE_KEY, title);
    else localStorage.removeItem(LS_TITLE_KEY);
    const signature = {
      name,
      title: title || undefined,
      signedAt: new Date().toISOString(),
      version: 1,
    };
    try {
      onSigned && onSigned(signature);
    } catch (e) {
      console.error('Signature handler failed', e);
    }
    close();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cancel();
  });

  const form = el(
    'form',
    {
      onsubmit: (e) => {
        e.preventDefault();
        submit();
      },
    },
    [
      el('div', { class: 'signature-field' }, [
        el('label', { for: nameInput.id }, 'Clinician Name *'),
        nameInput,
      ]),
      el('div', { class: 'signature-field' }, [
        el('label', { for: titleInput.id }, 'Title / Credentials'),
        titleInput,
      ]),
      errorBox,
      el('div', { class: 'signature-actions' }, [
        el('button', { type: 'button', class: 'btn', onclick: cancel }, 'Cancel'),
        el('button', { type: 'submit', class: 'btn primary' }, 'Sign & Export'),
      ]),
    ],
  );

  dialog.append(
    el('h2', { id: 'signature_modal_title', style: 'margin-top:0;' }, 'Sign Evaluation'),
    form,
  );
  overlay.append(dialog);
  document.body.appendChild(overlay);
  // Next frame -> add open classes
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    dialog.classList.add('is-open');
  });

  const detachTrap = trapFocus(dialog);
  dialog.__onCancel = cancel;
  setTimeout(() => nameInput.focus(), 30);
}

export function getPersistedSignatureMeta() {
  const name = localStorage.getItem(LS_NAME_KEY);
  const title = localStorage.getItem(LS_TITLE_KEY);
  if (!name) return null;
  return { name, title: title || undefined };
}
