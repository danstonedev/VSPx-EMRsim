function syncTextarea(
  textarea: HTMLTextAreaElement,
  baseHeights: WeakMap<HTMLTextAreaElement, number>,
) {
  const styles = getComputedStyle(textarea);
  const minHeight = Number.parseFloat(styles.minHeight) || 0;
  const currentHeight = textarea.getBoundingClientRect().height;
  const knownBase = baseHeights.get(textarea) ?? 0;
  const baseHeight = Math.max(knownBase, minHeight, currentHeight);

  baseHeights.set(textarea, baseHeight);
  textarea.style.overflowY = 'hidden';
  textarea.style.resize = 'none';
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(textarea.scrollHeight, baseHeight)}px`;
}

export function autogrowTextareas(node: HTMLElement) {
  const baseHeights = new WeakMap<HTMLTextAreaElement, number>();
  let frame = 0;

  const syncAll = () => {
    for (const textarea of node.querySelectorAll('textarea')) {
      syncTextarea(textarea as HTMLTextAreaElement, baseHeights);
    }
  };

  const queueSync = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(syncAll);
  };

  const handleInput = (event: Event) => {
    if (event.target instanceof HTMLTextAreaElement && node.contains(event.target)) {
      syncTextarea(event.target, baseHeights);
    }
  };

  const handleFocusIn = (event: FocusEvent) => {
    if (event.target instanceof HTMLTextAreaElement && node.contains(event.target)) {
      queueSync();
    }
  };

  const observer = new MutationObserver(() => {
    queueSync();
  });

  observer.observe(node, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });

  node.addEventListener('input', handleInput);
  node.addEventListener('focusin', handleFocusIn);
  queueSync();

  return {
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      node.removeEventListener('input', handleInput);
      node.removeEventListener('focusin', handleFocusIn);
    },
  };
}
