import { el } from './utils.js';

/**
 * Creates a portal-based search results dropdown that escapes overflow:hidden ancestors.
 * The dropdown is appended to document.body with position:fixed and positioned
 * relative to the anchor element (the search input).
 */
export function createPortalDropdown(anchorEl, cssClass) {
  const dropdown = el('div', {
    class: cssClass || 'billing-search-results',
    style:
      'position:fixed; border:1px solid var(--color-border); border-radius:0 0 8px 8px; overflow-y:auto; overflow-x:hidden; box-shadow:0 6px 16px rgba(0,0,0,0.16); max-height:260px; display:none; background:white; z-index:10100;',
  });

  function position() {
    const rect = anchorEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropH = Math.min(dropdown.scrollHeight || 260, 260);
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;
    if (spaceBelow < dropH && spaceAbove > spaceBelow) {
      dropdown.style.top = 'auto';
      dropdown.style.bottom = `${window.innerHeight - rect.top + 2}px`;
      dropdown.style.borderRadius = '8px 8px 0 0';
    } else {
      dropdown.style.top = `${rect.bottom + 2}px`;
      dropdown.style.bottom = 'auto';
      dropdown.style.borderRadius = '0 0 8px 8px';
    }
  }

  let _scrollH, _resizeH;

  function show() {
    if (dropdown.parentNode !== document.body) document.body.appendChild(dropdown);
    dropdown.style.display = 'block';
    position();
    _scrollH = () => position();
    _resizeH = () => position();
    window.addEventListener('scroll', _scrollH, true);
    window.addEventListener('resize', _resizeH);
  }

  function hide() {
    dropdown.style.display = 'none';
    if (_scrollH) window.removeEventListener('scroll', _scrollH, true);
    if (_resizeH) window.removeEventListener('resize', _resizeH);
    _scrollH = null;
    _resizeH = null;
  }

  function destroy() {
    hide();
    if (dropdown.parentNode) dropdown.parentNode.removeChild(dropdown);
  }

  return { dropdown, show, hide, destroy, position };
}
