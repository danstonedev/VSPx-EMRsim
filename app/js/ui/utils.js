export function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      // Convert onClick to click, onMouseOver to mouseover, etc.
      const eventName = k.slice(2).toLowerCase();
      e.addEventListener(eventName, v);
    } else e.setAttribute(k, v);
  });
  if (!Array.isArray(children)) children = [children];
  children.forEach((c) => {
    if (typeof c === 'string') {
      e.appendChild(document.createTextNode(c));
    } else if (c instanceof Node) {
      e.appendChild(c);
    }
  });
  return e;
}

export function textareaAutoResize(t) {
  const computeBaseHeight = () => {
    const cs = window.getComputedStyle(t);
    let lineHeight = parseFloat(cs.lineHeight);
    if (Number.isNaN(lineHeight)) {
      const fontSize = parseFloat(cs.fontSize) || 16;
      lineHeight = 1.2 * fontSize; // fallback if lineHeight returns 'normal'
    }
    const paddingTop = parseFloat(cs.paddingTop) || 0;
    const paddingBottom = parseFloat(cs.paddingBottom) || 0;
    const borderTop = parseFloat(cs.borderTopWidth) || 0;
    const borderBottom = parseFloat(cs.borderBottomWidth) || 0;
    const rows = parseInt(t.getAttribute('rows') || '2', 10);
    return Math.ceil(lineHeight * rows + paddingTop + paddingBottom + borderTop + borderBottom);
  };
  const fit = () => {
    const cs = window.getComputedStyle(t);
    const lineHeight = parseFloat(cs.lineHeight) || 18;
    const base = computeBaseHeight();
    const minHeight = parseFloat(cs.minHeight) || 0;
    // Determine max rows: prefer data attribute, then CSS var, then fallback
    const dataMax = parseInt(t.getAttribute('data-max-rows') || '0', 10);
    const cssVar = parseFloat(cs.getPropertyValue('--textarea-max-rows'));
    const maxRows = dataMax > 0 ? dataMax : !Number.isNaN(cssVar) && cssVar > 0 ? cssVar : 10;

    t.style.height = 'auto';
    const contentHeight = t.scrollHeight;
    const maxContent = Math.ceil(lineHeight * maxRows);
    const desired = Math.max(base, minHeight, Math.min(contentHeight, maxContent));
    t.style.height = desired + 'px';
    // Allow scrolling when capped
    if (contentHeight > maxContent) {
      t.style.overflowY = 'auto';
    } else {
      t.style.overflowY = 'hidden';
    }
  };
  t.addEventListener('input', fit);
  // Defer first fit to ensure styles/placeholders applied
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fit);
  else setTimeout(fit, 0);
}
export function printPage() {
  window.print();
}
