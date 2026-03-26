import { el } from './utils.js';

let modalIdCounter = 0;

function nextModalId(prefix = 'modal-shell') {
  modalIdCounter += 1;
  return `${prefix}-${modalIdCounter}`;
}

function resolveTitleNode({ headerLead, titleTag, resolvedTitleId, titleClass, title }) {
  if (headerLead) return headerLead;
  return el(
    titleTag,
    {
      id: resolvedTitleId,
      ...(titleClass ? { class: titleClass } : {}),
    },
    title || 'Dialog',
  );
}

function createOverlay({ dataModal, overlayClass }, requestClose) {
  const overlay = el(
    'div',
    {
      ...(dataModal ? { 'data-modal': dataModal } : {}),
      class: `modal-overlay popup-overlay-base ${overlayClass}`.trim(),
      role: 'presentation',
      tabindex: '-1',
    },
    [],
  );

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) requestClose();
  });

  overlay.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    requestClose();
  });

  return overlay;
}

function createFooter(footerClass, footerChildren) {
  if (!Array.isArray(footerChildren) || !footerChildren.length) return null;
  return el('footer', { class: `modal-actions ${footerClass}`.trim() }, footerChildren);
}

function createCard(
  {
    contentTag,
    contentClass,
    resolvedTitleId,
    headerClass,
    bodyClass,
    footerClass,
    closeButtonClass,
    closeAriaLabel,
    showCloseButton,
    headerMain,
    bodyChildren,
    footerChildren,
  },
  requestClose,
) {
  const closeButton = showCloseButton
    ? el(
        'button',
        {
          type: 'button',
          class: `close-btn ${closeButtonClass}`.trim(),
          'aria-label': closeAriaLabel,
          onClick: requestClose,
        },
        '\u2715',
      )
    : null;

  const header = el(
    'header',
    { class: `modal-header ${headerClass}`.trim() },
    [headerMain, closeButton].filter(Boolean),
  );
  const body = el('div', { class: `modal-body ${bodyClass}`.trim() }, bodyChildren);
  const footer = createFooter(footerClass, footerChildren);
  const card = el(
    contentTag,
    {
      class: `modal-content modal-content--brand ${contentClass}`.trim(),
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': resolvedTitleId,
      onClick: (event) => event.stopPropagation(),
    },
    [header, body, footer].filter(Boolean),
  );

  return { card, header, body, footer, closeButton };
}

/**
 * Shared branded modal builder.
 * Example:
 * const modal = buildBrandedModal({
 *   title: 'Example',
 *   contentClass: 'popup-card-base',
 *   bodyChildren: [contentNode],
 *   footerChildren: [cancelBtn, saveBtn],
 *   onRequestClose: close,
 * });
 * openBrandedModal(modal, { focusTarget: () => inputEl });
 */
/* eslint-disable-next-line complexity */
export function buildBrandedModal(options = {}) {
  const {
    title = '',
    titleId = '',
    titleTag = 'h3',
    titleClass = '',
    headerLead = null,
    overlayClass = '',
    contentClass = '',
    headerClass = '',
    bodyClass = '',
    footerClass = '',
    closeButtonClass = '',
    showCloseButton = true,
    contentTag = 'div',
    dataModal = '',
    closeLabel = '',
    bodyChildren = [],
    footerChildren = [],
    onRequestClose = null,
  } = options;
  const resolvedTitleId = titleId || nextModalId();
  const closeAriaLabel = closeLabel || (title ? `Close ${title}` : 'Close dialog');
  const headerMain = resolveTitleNode({
    headerLead,
    titleTag,
    resolvedTitleId,
    titleClass,
    title,
  });
  const requestClose = () => {
    if (typeof onRequestClose === 'function') onRequestClose();
  };
  const overlay = createOverlay({ dataModal, overlayClass }, requestClose);
  const { card, header, body, footer, closeButton } = createCard(
    {
      contentTag,
      contentClass,
      resolvedTitleId,
      headerClass,
      bodyClass,
      footerClass,
      closeButtonClass,
      closeAriaLabel,
      showCloseButton,
      headerMain,
      bodyChildren,
      footerChildren,
    },
    requestClose,
  );

  overlay.appendChild(card);

  return { overlay, card, header, body, footer, closeButton, titleId: resolvedTitleId };
}

export function openBrandedModal(
  { overlay, card },
  { focusTarget = null, focusDelay = 80, appendTarget = document.body } = {},
) {
  if (!overlay) return;
  appendTarget?.appendChild(overlay);
  const activate = () => {
    overlay.classList.add('is-open');
    card?.classList.add('is-open');
  };
  // Apply open classes immediately so dialogs never appear "half rendered"
  // when requestAnimationFrame is delayed (tab throttling, heavy frame load).
  activate();
  requestAnimationFrame(() => {
    activate();
    if (!focusTarget) return;
    setTimeout(() => {
      const target = typeof focusTarget === 'function' ? focusTarget() : focusTarget;
      target?.focus?.();
    }, focusDelay);
  });
}

export function closeBrandedModal({ overlay, card }, { fallbackMs = 480, cleanup = null } = {}) {
  if (!overlay) {
    cleanup?.();
    return;
  }

  let didFinish = false;
  const finish = () => {
    if (didFinish) return;
    didFinish = true;
    try {
      cleanup?.();
    } finally {
      try {
        overlay.remove();
      } catch {
        /* element may not exist */
      }
    }
  };

  overlay.classList.remove('is-open');
  card?.classList.remove('is-open');

  try {
    overlay.style.opacity = '';
    if (card) {
      card.style.opacity = '';
      card.style.transform = '';
    }
  } catch {
    /* element may not exist */
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish();
    return;
  }

  overlay.addEventListener('transitionend', finish, { once: true });
  setTimeout(finish, fallbackMs);
}
