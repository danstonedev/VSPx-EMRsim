// BillingSection.js - PT-Specific Billing and CPT Codes
// Common physical therapy billing codes with time-based unit tracking

import { el } from '../../../ui/utils.js';
import { createCustomSelect } from '../../../ui/CustomSelect.js';

function ensureSinglePrimaryDiagnosis(diagnosisCodes) {
  if (!Array.isArray(diagnosisCodes) || diagnosisCodes.length === 0) return;
  const firstWithCode = diagnosisCodes.findIndex((entry) => entry?.code);
  const primaryIndex = diagnosisCodes.findIndex((entry) => entry?.isPrimary);

  if (primaryIndex >= 0) {
    diagnosisCodes.forEach((entry, index) => {
      entry.isPrimary = index === primaryIndex;
    });
    return;
  }

  const target = firstWithCode >= 0 ? firstWithCode : 0;
  diagnosisCodes.forEach((entry, index) => {
    entry.isPrimary = index === target;
  });
}

function getPrimaryDiagnosisCode(data) {
  const diagnosisCodes = Array.isArray(data?.diagnosisCodes) ? data.diagnosisCodes : [];
  const primary = diagnosisCodes.find((entry) => entry?.isPrimary && entry?.code);
  if (primary?.code) return primary.code;
  const firstWithCode = diagnosisCodes.find((entry) => entry?.code);
  return firstWithCode?.code || '';
}

function getDiagnosisLinkOptions(data) {
  const diagnosisCodes = Array.isArray(data?.diagnosisCodes) ? data.diagnosisCodes : [];
  const options = [{ value: '', label: 'Select diagnosis...' }];

  diagnosisCodes.forEach((entry) => {
    const code = String(entry?.code || '').trim();
    if (!code) return;
    const desc = String(entry?.description || '').trim();
    const baseLabel = desc ? `${code} — ${desc}` : code;
    const label = entry?.isPrimary ? `${baseLabel} (Primary)` : baseLabel;
    options.push({ value: code, label });
  });

  return options;
}

function syncLinkedDiagnosisAssignments(data) {
  const validCodes = new Set(
    (Array.isArray(data?.diagnosisCodes) ? data.diagnosisCodes : [])
      .map((entry) => String(entry?.code || '').trim())
      .filter(Boolean),
  );
  const fallbackCode = getPrimaryDiagnosisCode(data);

  let changed = false;
  (Array.isArray(data?.billingCodes) ? data.billingCodes : []).forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const current = String(entry.linkedDiagnosisCode || '').trim();
    if (current && validCodes.has(current)) return;
    if (entry.linkedDiagnosisCode !== fallbackCode) {
      entry.linkedDiagnosisCode = fallbackCode;
      changed = true;
    }
  });

  (Array.isArray(data?.ordersReferrals) ? data.ordersReferrals : []).forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const current = String(entry.linkedDiagnosisCode || '').trim();
    if (current && validCodes.has(current)) return;
    if (entry.linkedDiagnosisCode !== fallbackCode) {
      entry.linkedDiagnosisCode = fallbackCode;
      changed = true;
    }
  });

  return changed;
}

function getDiagnosisGroupLabel(data, diagnosisCode) {
  const code = String(diagnosisCode || '').trim();
  if (!code) return 'Unlinked / No Diagnosis';
  const diagnosisCodes = Array.isArray(data?.diagnosisCodes) ? data.diagnosisCodes : [];
  const match = diagnosisCodes.find((entry) => String(entry?.code || '').trim() === code);
  if (!match) return code;
  const desc = String(match?.description || '').trim();
  return desc ? `${code} — ${desc}` : code;
}

function buildLinkedDiagnosisGroups(data, rows, getLinkedCode) {
  const list = Array.isArray(rows) ? rows : [];
  const diagnosisCodes = Array.isArray(data?.diagnosisCodes)
    ? data.diagnosisCodes.filter((entry) => String(entry?.code || '').trim())
    : [];

  const groups = [];
  const includedIndexes = new Set();

  diagnosisCodes.forEach((entry) => {
    const code = String(entry?.code || '').trim();
    if (!code) return;
    const indexes = [];
    list.forEach((row, index) => {
      if (String(getLinkedCode(row) || '').trim() === code) {
        indexes.push(index);
        includedIndexes.add(index);
      }
    });
    groups.push({
      key: code,
      label: getDiagnosisGroupLabel(data, code),
      indexes,
    });
  });

  const unlinkedIndexes = [];
  list.forEach((_, index) => {
    if (!includedIndexes.has(index)) {
      unlinkedIndexes.push(index);
    }
  });

  if (unlinkedIndexes.length || groups.length === 0) {
    groups.push({
      key: '__unlinked__',
      label: 'Unlinked / No Diagnosis',
      indexes: unlinkedIndexes,
    });
  }

  return groups;
}

/**
 * PT Billing Component - Professional billing with CPT codes
 */
export const PTBilling = {
  /**
   * Creates comprehensive PT billing section
   * @param {Object} data - Current billing data
   * @param {Function} updateField - Function to update field values
   * @returns {HTMLElement} PT billing section
   */
  create(data, updateField) {
    const section = el('div', {
      id: 'pt-billing',
      class: 'billing-section',
    });

    // ICD-10 Codes anchor (title removed per request)
    const diagnosisSection = el('div', { id: 'diagnosis-codes', class: 'section-anchor' });
    section.append(diagnosisSection);

    // Initialize diagnosis codes array if not exists
    if (!Array.isArray(data.diagnosisCodes)) {
      data.diagnosisCodes = [];
    }
    ensureSinglePrimaryDiagnosis(data.diagnosisCodes);
    let renderLinkedBillingByDiagnosis = () => {};
    let preserveViewportOnNextRender = false;
    const diagnosisExpandState = new Map();

    const applyDiagnosisOrderState = () => {
      data.diagnosisCodes.forEach((entry, index) => {
        entry.isPrimary = index === 0;
      });
    };
    applyDiagnosisOrderState();

    const removeDiagnosisAtIndex = (index) => {
      data.diagnosisCodes.splice(index, 1);
      applyDiagnosisOrderState();
      syncLinkedDiagnosisAssignments(data);
      updateField('diagnosisCodes', data.diagnosisCodes);
      updateField('billingCodes', data.billingCodes || []);
      updateField('ordersReferrals', data.ordersReferrals || []);
      renderDiagnosisCodes();
      renderLinkedBillingByDiagnosis();
    };

    const moveDiagnosisAtIndex = (index, direction) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= data.diagnosisCodes.length) return;
      const current = data.diagnosisCodes[index];
      data.diagnosisCodes[index] = data.diagnosisCodes[targetIndex];
      data.diagnosisCodes[targetIndex] = current;
      preserveViewportOnNextRender = true;
      applyDiagnosisOrderState();
      syncLinkedDiagnosisAssignments(data);
      updateField('diagnosisCodes', data.diagnosisCodes);
      updateField('billingCodes', data.billingCodes || []);
      updateField('ordersReferrals', data.ordersReferrals || []);
      renderDiagnosisCodes();
      renderLinkedBillingByDiagnosis();
    };

    const bindAnimatedToggle = (detailsEl, summaryEl, contentEl, code) => {
      let animating = false;
      let safetyTimer = null;

      const cleanup = () => {
        if (safetyTimer) {
          clearTimeout(safetyTimer);
          safetyTimer = null;
        }
        contentEl.style.overflow = '';
        contentEl.style.height = '';
        contentEl.style.opacity = '';
        contentEl.style.transition = '';
        animating = false;
      };

      summaryEl.addEventListener('click', (event) => {
        event.preventDefault();
        if (animating) return;

        const isOpen = detailsEl.hasAttribute('open');
        animating = true;

        if (isOpen) {
          const startHeight = contentEl.scrollHeight;
          contentEl.style.overflow = 'hidden';
          contentEl.style.height = `${startHeight}px`;
          contentEl.style.opacity = '1';

          requestAnimationFrame(() => {
            contentEl.style.transition = 'height 220ms ease, opacity 180ms ease';
            contentEl.style.height = '0px';
            contentEl.style.opacity = '0';
          });

          const onEnd = (e) => {
            if (e && e.target !== contentEl) return;
            if (e && e.propertyName !== 'height') return;
            detailsEl.removeAttribute('open');
            diagnosisExpandState.set(code, false);
            cleanup();
            contentEl.removeEventListener('transitionend', onEnd);
          };
          contentEl.addEventListener('transitionend', onEnd);
          safetyTimer = setTimeout(() => {
            contentEl.removeEventListener('transitionend', onEnd);
            detailsEl.removeAttribute('open');
            diagnosisExpandState.set(code, false);
            cleanup();
          }, 300);
          return;
        }

        detailsEl.setAttribute('open', 'open');
        contentEl.style.overflow = 'hidden';
        contentEl.style.height = '0px';
        contentEl.style.opacity = '0';

        requestAnimationFrame(() => {
          const targetHeight = contentEl.scrollHeight;
          contentEl.style.transition = 'height 220ms ease, opacity 180ms ease';
          contentEl.style.height = `${targetHeight}px`;
          contentEl.style.opacity = '1';
        });

        const onEnd = (e) => {
          if (e && e.target !== contentEl) return;
          if (e && e.propertyName !== 'height') return;
          diagnosisExpandState.set(code, true);
          cleanup();
          contentEl.removeEventListener('transitionend', onEnd);
        };
        contentEl.addEventListener('transitionend', onEnd);
        safetyTimer = setTimeout(() => {
          contentEl.removeEventListener('transitionend', onEnd);
          diagnosisExpandState.set(code, true);
          cleanup();
        }, 300);
      });
    };

    // Add diagnosis code interface
    const diagnosisContainer = el('div', {
      class: 'billing-dx-selector',
      style: 'margin-top: 12px; margin-bottom: 24px;',
    });
    section.append(diagnosisContainer);

    // Function to render diagnosis codes
    function renderDiagnosisCodes() {
      diagnosisContainer.replaceChildren();

      const header = el('div', { class: 'billing-dx-selector__title' }, 'Diagnosis Codes (ICD-10)');
      diagnosisContainer.appendChild(header);

      const controls = el('div', { class: 'billing-dx-selector__controls' });
      const searchWrap = el('div', {
        class: 'billing-dx-selector__search-wrap',
        style: 'position: relative; overflow: visible;',
      });
      const searchInput = el('input', {
        type: 'text',
        class:
          'combined-neuroscreen__input combined-neuroscreen__input--left billing-dx-selector__search',
        placeholder: 'Search and add ICD-10 diagnosis…',
      });

      const resultsList = el('div', {
        class: 'billing-search-results billing-dx-selector__results',
        style:
          'position: absolute; top: calc(100% + 2px); left: 0; width: 100%; border: 1px solid var(--color-border); border-radius: 0 0 8px 8px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.16); max-height: 260px; display: none; background: white; z-index: 100;',
      });

      const allOptions = getPTICD10Codes()
        .filter((opt) => opt.value)
        .map((opt) => ({ ...opt, _norm: normalizeOption(opt) }));
      let currentResults = [];
      let highlightIndex = -1;

      const renderResults = () => {
        resultsList.replaceChildren();
        if (!currentResults.length) {
          resultsList.style.display = 'none';
          return;
        }
        resultsList.style.display = 'block';
        currentResults.forEach((item, idx) => {
          const { code, desc, friendlyLabel } = item._norm || {};
          const rightText = desc && desc.toLowerCase() !== friendlyLabel?.toLowerCase() ? desc : '';
          const row = el(
            'div',
            {
              class: 'billing-search-result-row',
              style:
                'padding: 0.45rem 0.65rem; display:flex; justify-content:space-between; align-items:flex-start; gap: 0.65rem; cursor:pointer; font-size: 0.95rem; background: ' +
                (idx === highlightIndex ? 'rgba(0,154,68,0.12);' : 'white;'),
              onmouseenter: () => {
                highlightIndex = idx;
                Array.from(resultsList.children).forEach((child, childIdx) => {
                  child.style.background = childIdx === idx ? 'rgba(0,154,68,0.12)' : 'white';
                });
              },
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                applySelection(item);
              },
            },
            [
              el('div', { style: 'font-weight:600; min-width: 8.5rem;' }, code || item.value),
              el(
                'div',
                { style: 'flex:1; color: var(--text-muted); text-align:left;' },
                rightText || friendlyLabel || '',
              ),
            ],
          );
          resultsList.appendChild(row);
        });
      };

      const performSearch = () => {
        const query = (searchInput.value || '').trim().toLowerCase();
        if (!query) {
          currentResults = [];
          renderResults();
          return;
        }
        const selectedCodes = new Set(
          (Array.isArray(data.diagnosisCodes) ? data.diagnosisCodes : [])
            .map((entry) => String(entry?.code || '').trim())
            .filter(Boolean),
        );
        currentResults = allOptions
          .filter((item) => !selectedCodes.has(String(item.value || '').trim()))
          .map((item) => ({ ...item, _score: scoreOption(item, query) }))
          .filter((item) => item._score > 0)
          .sort((a, b) => b._score - a._score)
          .slice(0, 10);
        highlightIndex = currentResults.length ? 0 : -1;
        renderResults();
      };

      const applySelection = (item) => {
        if (!item?.value) return;
        const next = {
          code: item.value,
          description: item.description,
          label: item.label,
          isPrimary: data.diagnosisCodes.length === 0,
        };
        data.diagnosisCodes.push(next);
        applyDiagnosisOrderState();
        syncLinkedDiagnosisAssignments(data);
        updateField('diagnosisCodes', data.diagnosisCodes);
        updateField('billingCodes', data.billingCodes || []);
        updateField('ordersReferrals', data.ordersReferrals || []);
        renderDiagnosisCodes();
        renderLinkedBillingByDiagnosis();
      };

      searchInput.addEventListener('input', performSearch);
      searchInput.addEventListener('keydown', (e) => {
        if (!currentResults.length) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          highlightIndex = (highlightIndex + 1) % currentResults.length;
          renderResults();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          highlightIndex = (highlightIndex - 1 + currentResults.length) % currentResults.length;
          renderResults();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selected = currentResults[highlightIndex >= 0 ? highlightIndex : 0];
          applySelection(selected);
        }
      });

      searchWrap.append(searchInput, resultsList);
      controls.appendChild(searchWrap);
      diagnosisContainer.appendChild(controls);
    }

    // Initial render - start with empty state
    renderDiagnosisCodes();

    // Initialize billing codes array if not exists
    if (!Array.isArray(data.billingCodes)) {
      data.billingCodes = [];
    }

    // Keep anchors for subsection navigation/completion checks
    const cptSection = el('div', { id: 'cpt-codes', class: 'section-anchor' });
    section.append(cptSection);

    if (!Array.isArray(data.ordersReferrals)) {
      data.ordersReferrals = [];
    }

    const ordersSection = el('div', { id: 'orders-referrals', class: 'section-anchor' });
    section.append(ordersSection);

    const linkedBillingContainer = el('div', {
      class: 'billing-linked-groups',
      style: 'margin-bottom: 24px;',
    });
    section.append(linkedBillingContainer);

    renderLinkedBillingByDiagnosis = function renderLinkedBillingByDiagnosisImpl() {
      const shouldPreserveViewport = preserveViewportOnNextRender;
      const previousScrollY = shouldPreserveViewport ? window.scrollY : 0;
      preserveViewportOnNextRender = false;

      const previousCardPositions = new Map();
      Array.from(linkedBillingContainer.querySelectorAll('.billing-linked-group')).forEach(
        (card) => {
          const code = card.getAttribute('data-dx-code');
          if (!code) return;
          previousCardPositions.set(code, card.getBoundingClientRect().top);
        },
      );

      linkedBillingContainer.replaceChildren();

      syncLinkedDiagnosisAssignments(data);
      let billingDefaultsAdded = false;
      let ordersDefaultsAdded = false;

      const diagnosisGroups = (Array.isArray(data.diagnosisCodes) ? data.diagnosisCodes : [])
        .map((entry, index) => ({
          index,
          code: String(entry?.code || '').trim(),
          label: getDiagnosisGroupLabel(data, entry?.code),
        }))
        .filter((entry) => entry.code);
      const showOrderingControls = diagnosisGroups.length > 1;

      if (diagnosisGroups.length === 0) {
        linkedBillingContainer.appendChild(
          el(
            'div',
            { class: 'billing-linked-empty-state' },
            'Add at least one ICD-10 diagnosis to enter CPT codes and orders.',
          ),
        );
        return;
      }

      diagnosisGroups.forEach((group) => {
        const rerenderRowsWithViewport = () => {
          preserveViewportOnNextRender = true;
          renderLinkedBillingByDiagnosis();
        };

        const isOpen = diagnosisExpandState.get(group.code) ?? true;
        const groupCard = el('details', {
          class: 'billing-linked-group',
          ...(isOpen ? { open: 'open' } : {}),
          'data-dx-code': group.code,
        });
        const cptIndexes = (data.billingCodes || [])
          .map((row, idx) =>
            String(row?.linkedDiagnosisCode || '').trim() === group.code ? idx : -1,
          )
          .filter((idx) => idx >= 0);
        if (cptIndexes.length === 0) {
          data.billingCodes.push({
            code: '',
            linkedDiagnosisCode: group.code,
            units: 1,
            description: '',
            label: '',
            timeSpent: '',
          });
          cptIndexes.push(data.billingCodes.length - 1);
          billingDefaultsAdded = true;
        }

        const orderIndexes = (data.ordersReferrals || [])
          .map((row, idx) =>
            String(row?.linkedDiagnosisCode || '').trim() === group.code ? idx : -1,
          )
          .filter((idx) => idx >= 0);
        if (orderIndexes.length === 0) {
          data.ordersReferrals.push({
            type: '',
            linkedDiagnosisCode: group.code,
            details: '',
          });
          orderIndexes.push(data.ordersReferrals.length - 1);
          ordersDefaultsAdded = true;
        }

        const orderControls = showOrderingControls
          ? (() => {
              const upButton = el(
                'button',
                {
                  type: 'button',
                  class: 'billing-linked-group__reorder-btn',
                  title: 'Move diagnosis up',
                  onmousedown: (event) => {
                    event.preventDefault();
                  },
                  onclick: (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    moveDiagnosisAtIndex(group.index, -1);
                  },
                },
                '↑',
              );
              if (group.index === 0) upButton.setAttribute('disabled', 'disabled');

              const downButton = el(
                'button',
                {
                  type: 'button',
                  class: 'billing-linked-group__reorder-btn',
                  title: 'Move diagnosis down',
                  onmousedown: (event) => {
                    event.preventDefault();
                  },
                  onclick: (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    moveDiagnosisAtIndex(group.index, 1);
                  },
                },
                '↓',
              );
              if (group.index === diagnosisGroups.length - 1)
                downButton.setAttribute('disabled', 'disabled');

              return el('span', { class: 'billing-linked-group__order-controls' }, [
                upButton,
                downButton,
              ]);
            })()
          : null;

        const summary = el('summary', { class: 'billing-linked-group__summary' }, [
          el('span', { class: 'billing-linked-group__chevron', 'aria-hidden': 'true' }, '▾'),
          showOrderingControls
            ? el('span', { class: 'billing-linked-group__order-badge' }, String(group.index + 1))
            : null,
          el('span', { class: 'billing-linked-group__summary-text' }, group.label),
          orderControls,
          el(
            'button',
            {
              type: 'button',
              class: 'remove-btn billing-linked-group__remove-btn',
              title: 'Remove diagnosis and linked billing items',
              onclick: (event) => {
                event.preventDefault();
                event.stopPropagation();
                removeDiagnosisAtIndex(group.index);
              },
            },
            '×',
          ),
        ]);

        const content = el('div', { class: 'billing-linked-group__content' });
        const substack = el('div', { class: 'billing-linked-subtables' });

        const cptBlock = el('div', { class: 'billing-linked-subtable' });
        const cptTable = el('table', {
          class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
        });
        cptTable.appendChild(
          el('colgroup', {}, [
            el('col', { style: 'width: auto;' }),
            el('col', { style: 'width: 5rem;' }),
            el('col', { style: 'width: 7rem;' }),
            el('col', { style: 'width: 3.75rem;' }),
          ]),
        );
        cptTable.appendChild(
          el('thead', { class: 'combined-neuroscreen-thead' }, [
            el('tr', {}, [
              el('th', { class: 'combined-neuroscreen-th billing-header' }, 'CPT Codes'),
              el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Units'),
              el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Time Spent'),
              el('th', { class: 'combined-neuroscreen-th billing-header action-col' }, [
                el(
                  'button',
                  {
                    type: 'button',
                    class: 'billing-row-add-btn',
                    title: `Add CPT Code for ${group.code}`,
                    onclick: () => {
                      data.billingCodes.push({
                        code: '',
                        linkedDiagnosisCode: group.code,
                        units: 1,
                        description: '',
                        label: '',
                        timeSpent: '',
                      });
                      updateField('billingCodes', data.billingCodes);
                      rerenderRowsWithViewport();
                    },
                  },
                  '+',
                ),
              ]),
            ]),
          ]),
        );
        const cptTbody = el('tbody', { class: 'combined-neuroscreen-tbody' });
        cptIndexes.forEach((rowIndex) => {
          const rowData = data.billingCodes[rowIndex];
          const row = rowData.code
            ? createBillingCodeRowForDiagnosis(
                rowData,
                rowIndex,
                data,
                updateField,
                rerenderRowsWithViewport,
              )
            : createCPTSearchRowForDiagnosis(
                rowData,
                rowIndex,
                data,
                updateField,
                rerenderRowsWithViewport,
              );
          cptTbody.appendChild(row);
        });
        cptTable.appendChild(cptTbody);
        cptBlock.append(cptTable);

        const ordersBlock = el('div', { class: 'billing-linked-subtable' });
        const ordersTable = el('table', {
          class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
        });
        ordersTable.appendChild(
          el('colgroup', {}, [
            el('col', { style: 'width: 10rem;' }),
            el('col', { style: 'width: auto;' }),
            el('col', { style: 'width: 3.75rem;' }),
          ]),
        );
        ordersTable.appendChild(
          el('thead', { class: 'combined-neuroscreen-thead' }, [
            el('tr', {}, [
              el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Orders & Referrals'),
              el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Details'),
              el('th', { class: 'combined-neuroscreen-th billing-header action-col' }, [
                el(
                  'button',
                  {
                    type: 'button',
                    class: 'billing-row-add-btn',
                    title: `Add Order/Referral for ${group.code}`,
                    onclick: () => {
                      data.ordersReferrals.push({
                        type: '',
                        linkedDiagnosisCode: group.code,
                        details: '',
                      });
                      updateField('ordersReferrals', data.ordersReferrals);
                      rerenderRowsWithViewport();
                    },
                  },
                  '+',
                ),
              ]),
            ]),
          ]),
        );
        const ordersTbody = el('tbody', { class: 'combined-neuroscreen-tbody' });
        orderIndexes.forEach((rowIndex) => {
          const rowData = data.ordersReferrals[rowIndex];
          const row = createOrderReferralRowForDiagnosis(
            rowData,
            rowIndex,
            data,
            updateField,
            rerenderRowsWithViewport,
          );
          ordersTbody.appendChild(row);
        });
        ordersTable.appendChild(ordersTbody);
        ordersBlock.append(ordersTable);

        substack.append(cptBlock, ordersBlock);
        content.appendChild(substack);
        groupCard.append(summary, content);
        bindAnimatedToggle(groupCard, summary, content, group.code);
        linkedBillingContainer.appendChild(groupCard);
      });

      if (shouldPreserveViewport) {
        window.scrollTo({ top: previousScrollY, left: window.scrollX, behavior: 'auto' });
      }

      if (previousCardPositions.size > 0) {
        requestAnimationFrame(() => {
          Array.from(linkedBillingContainer.querySelectorAll('.billing-linked-group')).forEach(
            (card) => {
              const code = card.getAttribute('data-dx-code');
              if (!code || !previousCardPositions.has(code)) return;

              const previousTop = previousCardPositions.get(code);
              const nextTop = card.getBoundingClientRect().top;
              const delta = previousTop - nextTop;
              if (Math.abs(delta) < 1) return;

              card.style.transition = 'none';
              card.style.transform = `translateY(${delta}px)`;
              card.style.willChange = 'transform';

              requestAnimationFrame(() => {
                card.style.transition = 'transform 220ms ease';
                card.style.transform = 'translateY(0)';
                const cleanup = (e) => {
                  if (e && e.target !== card) return;
                  card.style.transition = '';
                  card.style.transform = '';
                  card.style.willChange = '';
                  card.removeEventListener('transitionend', cleanup);
                };
                card.addEventListener('transitionend', cleanup);
              });
            },
          );
        });
      }

      if (billingDefaultsAdded) {
        updateField('billingCodes', data.billingCodes);
      }
      if (ordersDefaultsAdded) {
        updateField('ordersReferrals', data.ordersReferrals);
      }
    };

    renderLinkedBillingByDiagnosis();

    return section;
  },
};

/**
 * Reusable widget: CPT Billing Codes list with header, rows, and compact add button
 * Returns an object with element and a refresh method
 * @param {Object} data - billing data object containing billingCodes array
 * @param {Function} updateField - updater for billing fields, e.g., (field, value) => {}
 */
export function createBillingCodesWidget(data, updateField) {
  // Ensure array exists
  if (!Array.isArray(data.billingCodes)) data.billingCodes = [];

  const container = el('div', {
    class: 'billing-section-container',
    style: 'margin-bottom: 24px;',
  });

  function render() {
    container.replaceChildren();

    syncLinkedDiagnosisAssignments(data);

    const groupContainer = el('div', { class: 'billing-linked-groups' });
    const groups = buildLinkedDiagnosisGroups(
      data,
      data.billingCodes,
      (entry) => entry?.linkedDiagnosisCode,
    );
    const groupsWithRows = groups.filter((group) => group.indexes.length > 0);

    groupsWithRows.forEach((group) => {
      const details = el('details', { class: 'billing-linked-group', open: true });
      const summary = el(
        'summary',
        { class: 'billing-linked-group__summary' },
        `${group.label} (${group.indexes.length})`,
      );
      const content = el('div', { class: 'billing-linked-group__content' });

      const table = el('table', {
        class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
      });

      const colgroup = el('colgroup', {}, [
        el('col', { style: 'width: auto;' }),
        el('col', { style: 'width: 13rem;' }),
        el('col', { style: 'width: 5rem;' }),
        el('col', { style: 'width: 7rem;' }),
        el('col', { style: 'width: 3.75rem;' }),
      ]);
      table.appendChild(colgroup);

      const thead = el('thead', { class: 'combined-neuroscreen-thead' }, [
        el('tr', {}, [
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'CPT Codes'),
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Linked ICD-10'),
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Units'),
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Time Spent'),
          el('th', { class: 'combined-neuroscreen-th billing-header action-col' }, ''),
        ]),
      ]);
      table.appendChild(thead);

      const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

      group.indexes.forEach((rowIndex) => {
        const codeEntry = data.billingCodes[rowIndex];
        if (!codeEntry.code) {
          const searchRow = createCPTSearchRow(codeEntry, rowIndex, data, updateField, render);
          tbody.appendChild(searchRow);
        } else {
          const codeRow = createBillingCodeRow(codeEntry, rowIndex, data, updateField, render);
          tbody.appendChild(codeRow);
        }
      });

      table.appendChild(tbody);
      content.appendChild(table);
      details.append(summary, content);
      groupContainer.appendChild(details);
    });

    if (groupsWithRows.length === 0) {
      groupContainer.appendChild(
        el('div', { class: 'billing-linked-empty-state' }, 'No CPT codes added yet.'),
      );
    }

    container.appendChild(groupContainer);

    const addButton = el(
      'div',
      {
        class: 'compact-add-btn',
        title: 'Add Treatment Code',
        onclick: () => {
          data.billingCodes.push({
            code: '',
            linkedDiagnosisCode: getPrimaryDiagnosisCode(data),
            units: 1,
            description: '',
            label: '',
            timeSpent: '',
          });
          updateField('billingCodes', data.billingCodes);
          render();
        },
      },
      '+',
    );
    container.append(addButton);
  }

  render();
  return { element: container, refresh: render };
}

/**
 * Creates comprehensive PT billing section
 * @param {Object} billingData - Current billing data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete billing section
 */
export function createBillingSection(billingData, onUpdate) {
  const section = el('div', {
    class: 'billing-section',
    id: 'billing-section',
  });

  // Billing data should always be an object
  const data = billingData || {};

  // Initialize comprehensive data structure with default placeholder rows
  const defaultData = {
    diagnosisCodes: [{ code: '', description: '', isPrimary: true }],
    billingCodes: [{ code: '', linkedDiagnosisCode: '', units: '', timeSpent: '' }],
    ordersReferrals: [{ type: '', linkedDiagnosisCode: '', details: '' }],
  };

  // Merge with existing data, but ensure arrays are properly initialized
  const finalData = {
    ...defaultData,
    ...data,
    diagnosisCodes:
      Array.isArray(data?.diagnosisCodes) && data.diagnosisCodes.length > 0
        ? data.diagnosisCodes
        : defaultData.diagnosisCodes,
    billingCodes:
      Array.isArray(data?.billingCodes) && data.billingCodes.length > 0
        ? data.billingCodes
        : defaultData.billingCodes,
    ordersReferrals:
      Array.isArray(data?.ordersReferrals) && data.ordersReferrals.length > 0
        ? data.ordersReferrals
        : defaultData.ordersReferrals,
  };

  // Update helper
  const updateField = (field, value) => {
    finalData[field] = value;
    onUpdate(finalData);
  };

  // Create billing interface via PTBilling component
  section.append(PTBilling.create(finalData, updateField));

  return section;
}

function createOrderReferralRowForDiagnosis(entry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  const typeSelect = createCustomSelect({
    options: [
      { value: '', label: 'Select type...' },
      { value: 'referral', label: 'Referral' },
      { value: 'order', label: 'Order/Prescription' },
      { value: 'consult', label: 'Consult' },
    ],
    value: entry.type || '',
    className: 'combined-neuroscreen__input',
    onChange: (newValue) => {
      data.ordersReferrals[index].type = newValue;
      updateField('ordersReferrals', data.ordersReferrals);
    },
  }).element;

  const typeCell = el('td', { class: 'combined-neuroscreen-td' });
  typeCell.appendChild(typeSelect);
  row.appendChild(typeCell);

  const detailsInput = el('input', {
    type: 'text',
    value: entry.details || '',
    placeholder: 'Order/referral details or notes',
    class: 'combined-neuroscreen__input combined-neuroscreen__input--left',
    onblur: (e) => {
      data.ordersReferrals[index].details = e.target.value;
      updateField('ordersReferrals', data.ordersReferrals);
    },
  });
  const detailsCell = el('td', { class: 'combined-neuroscreen-td' });
  detailsCell.appendChild(detailsInput);
  row.appendChild(detailsCell);

  const actionCell = el('td', { class: 'combined-neuroscreen-td action-col' });
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      onclick: () => {
        data.ordersReferrals.splice(index, 1);
        updateField('ordersReferrals', data.ordersReferrals);
        renderCallback();
      },
    },
    '×',
  );
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  return row;
}

function createBillingCodeRowForDiagnosis(codeEntry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  const codeCell = el('td', { class: 'combined-neuroscreen-td' });
  codeCell.textContent = codeEntry.label || codeEntry.code || '';
  codeCell.style.fontWeight = '600';
  row.appendChild(codeCell);

  const unitsInput = el('input', {
    type: 'number',
    value: codeEntry.units || 1,
    min: 1,
    max: 8,
    class: 'combined-neuroscreen__input',
    style: 'text-align: center;',
    onblur: (e) => {
      data.billingCodes[index].units = parseInt(e.target.value) || 1;
      updateField('billingCodes', data.billingCodes);
    },
  });
  const unitsCell = el('td', { class: 'combined-neuroscreen-td' });
  unitsCell.appendChild(unitsInput);
  row.appendChild(unitsCell);

  const timeInput = el('input', {
    type: 'text',
    value: codeEntry.timeSpent || '',
    placeholder: '30 min',
    class: 'combined-neuroscreen__input',
    style: 'text-align: center;',
    onblur: (e) => {
      data.billingCodes[index].timeSpent = e.target.value;
      updateField('billingCodes', data.billingCodes);
    },
  });
  const timeCell = el('td', { class: 'combined-neuroscreen-td' });
  timeCell.appendChild(timeInput);
  row.appendChild(timeCell);

  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      title: 'Remove',
      onclick: () => {
        data.billingCodes.splice(index, 1);
        updateField('billingCodes', data.billingCodes);
        renderCallback();
      },
    },
    '×',
  );
  const actionCell = el('td', { class: 'combined-neuroscreen-td action-col' });
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  return row;
}

function createCPTSearchRowForDiagnosis(codeEntry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  const searchCell = el('td', {
    class: 'combined-neuroscreen-td',
    style: 'position: relative; overflow: visible;',
  });

  const searchInput = el('input', {
    type: 'text',
    class: 'combined-neuroscreen__input combined-neuroscreen__input--left',
    placeholder: 'Search CPT code or description…',
    style: 'width: 100%;',
  });

  const resultsList = el('div', {
    class: 'billing-search-results',
    style:
      'position: absolute; top: calc(100% + 2px); left: 0; width: 100%; border: 1px solid var(--color-border); border-radius: 0 0 8px 8px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.16); max-height: 260px; display: none; background: white; z-index: 100;',
  });

  let highlightIndex = -1;
  let currentResults = [];

  const codes = getPTCPTCodes()
    .filter((c) => c.value)
    .map((opt) => ({
      ...opt,
      _norm: normalizeOption(opt),
    }));

  const renderResults = () => {
    resultsList.replaceChildren();
    if (!currentResults.length) {
      resultsList.style.display = 'none';
      return;
    }
    resultsList.style.display = 'block';
    currentResults.forEach((item, idx) => {
      const { code, desc, friendlyLabel } = item._norm || {};
      const rightText = desc && desc.toLowerCase() !== friendlyLabel?.toLowerCase() ? desc : '';

      const resultRow = el(
        'div',
        {
          class: 'billing-search-result-row',
          style:
            'padding: 0.45rem 0.65rem; display:flex; justify-content:space-between; align-items:flex-start; gap: 0.65rem; cursor:pointer; font-size: 0.95rem; background: ' +
            (idx === highlightIndex ? 'rgba(0,154,68,0.12);' : 'white;'),
          onmouseenter: () => {
            highlightIndex = idx;
            Array.from(resultsList.children).forEach((child, cIdx) => {
              child.style.background = cIdx === idx ? 'rgba(0,154,68,0.12)' : 'white';
            });
          },
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            applySelection(item);
          },
        },
        [
          el('div', { style: 'font-weight:600; min-width: 6rem;' }, code || item.value),
          el(
            'div',
            { style: 'flex:1; color: var(--text-muted); text-align:left;' },
            rightText || friendlyLabel || '',
          ),
        ],
      );
      resultsList.appendChild(resultRow);
    });
  };

  const performSearch = () => {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) {
      currentResults = [];
      renderResults();
      return;
    }
    currentResults = codes
      .map((item) => ({ ...item, _score: scoreOption(item, q) }))
      .filter((i) => i._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 10);
    highlightIndex = currentResults.length ? 0 : -1;
    renderResults();
  };

  const applySelection = (item) => {
    if (!item) return;
    data.billingCodes[index] = {
      code: item.value,
      linkedDiagnosisCode: codeEntry.linkedDiagnosisCode || getPrimaryDiagnosisCode(data),
      description: item.description,
      label: item.label,
      units: codeEntry.units || 1,
      timeSpent: codeEntry.timeSpent || '',
    };
    updateField('billingCodes', data.billingCodes);
    renderCallback();
  };

  const commitSelection = () => {
    if (currentResults.length) {
      const choice = currentResults[highlightIndex >= 0 ? highlightIndex : 0];
      applySelection(choice);
    }
  };

  searchInput.addEventListener('input', () => performSearch());
  searchInput.addEventListener('keydown', (e) => {
    if (!currentResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = (highlightIndex + 1) % currentResults.length;
      renderResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = (highlightIndex - 1 + currentResults.length) % currentResults.length;
      renderResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitSelection();
    }
  });

  searchCell.append(searchInput, resultsList);
  row.appendChild(searchCell);

  const unitsInput = el('input', {
    type: 'number',
    value: codeEntry.units || 1,
    min: 1,
    max: 8,
    class: 'combined-neuroscreen__input',
    style: 'text-align: center;',
    onblur: (e) => {
      codeEntry.units = parseInt(e.target.value) || 1;
    },
  });
  const unitsCell = el('td', { class: 'combined-neuroscreen-td' });
  unitsCell.appendChild(unitsInput);
  row.appendChild(unitsCell);

  const timeInput = el('input', {
    type: 'text',
    value: codeEntry.timeSpent || '',
    placeholder: '30 min',
    class: 'combined-neuroscreen__input',
    style: 'text-align: center;',
    onblur: (e) => {
      codeEntry.timeSpent = e.target.value;
    },
  });
  const timeCell = el('td', { class: 'combined-neuroscreen-td' });
  timeCell.appendChild(timeInput);
  row.appendChild(timeCell);

  const actionCell = el('td', { class: 'combined-neuroscreen-td action-col' });
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      onclick: () => {
        data.billingCodes.splice(index, 1);
        updateField('billingCodes', data.billingCodes);
        renderCallback();
      },
    },
    '×',
  );
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  return row;
}

/**
 * Creates a single billing code row displaying a selected CPT code with units/time
 */
function createBillingCodeRow(codeEntry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  // CPT Code display (read-only label)
  const codeCell = el('td', { class: 'combined-neuroscreen-td' });
  const codeLabel = codeEntry.label || codeEntry.code || '';
  codeCell.textContent = codeLabel;
  codeCell.style.fontWeight = '600';
  row.appendChild(codeCell);

  // Linked diagnosis select
  const linkedDiagnosisSelect = createCustomSelect({
    options: getDiagnosisLinkOptions(data),
    value: codeEntry.linkedDiagnosisCode || getPrimaryDiagnosisCode(data),
    className: 'combined-neuroscreen__input',
    onChange: (newValue) => {
      data.billingCodes[index].linkedDiagnosisCode = newValue;
      updateField('billingCodes', data.billingCodes);
      renderCallback();
    },
  }).element;

  const linkedDxCell = el('td', { class: 'combined-neuroscreen-td' });
  linkedDxCell.appendChild(linkedDiagnosisSelect);
  row.appendChild(linkedDxCell);

  // Units input
  const unitsInput = el('input', {
    type: 'number',
    value: codeEntry.units || 1,
    min: 1,
    max: 8,
    class: 'combined-neuroscreen__input',
    style: 'text-align: center;',
    onblur: (e) => {
      data.billingCodes[index].units = parseInt(e.target.value) || 1;
      updateField('billingCodes', data.billingCodes);
    },
  });
  const unitsCell = el('td', { class: 'combined-neuroscreen-td' });
  unitsCell.appendChild(unitsInput);
  row.appendChild(unitsCell);

  // Time spent input
  const timeInput = el('input', {
    type: 'text',
    value: codeEntry.timeSpent || '',
    placeholder: '30 min',
    class: 'combined-neuroscreen__input',
    style: 'text-align: center;',
    onblur: (e) => {
      data.billingCodes[index].timeSpent = e.target.value;
      updateField('billingCodes', data.billingCodes);
    },
  });
  const timeCell = el('td', { class: 'combined-neuroscreen-td' });
  timeCell.appendChild(timeInput);
  row.appendChild(timeCell);

  // Remove button
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      title: 'Remove',
      onclick: () => {
        data.billingCodes.splice(index, 1);
        updateField('billingCodes', data.billingCodes);
        renderCallback();
      },
    },
    '×',
  );
  const actionCell = el('td', { class: 'combined-neuroscreen-td action-col' });
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  return row;
}

/**
 * Creates a search row for adding new CPT codes (searchable input like ICD-10)
 */
function createCPTSearchRow(codeEntry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  // Search Cell - spans code column only
  const searchCell = el('td', {
    class: 'combined-neuroscreen-td',
    style: 'position: relative; overflow: visible;',
  });

  const searchInput = el('input', {
    type: 'text',
    class: 'combined-neuroscreen__input combined-neuroscreen__input--left',
    placeholder: 'Search CPT code or description…',
    style: 'width: 100%;',
  });

  // Results list container
  const resultsList = el('div', {
    class: 'billing-search-results',
    style:
      'position: absolute; top: calc(100% + 2px); left: 0; width: 100%; border: 1px solid var(--color-border); border-radius: 0 0 8px 8px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.16); max-height: 260px; display: none; background: white; z-index: 100;',
  });

  let highlightIndex = -1;
  let currentResults = [];

  const codes = getPTCPTCodes()
    .filter((c) => c.value) // skip the empty placeholder
    .map((opt) => ({
      ...opt,
      _norm: normalizeOption(opt),
    }));

  const renderResults = () => {
    resultsList.replaceChildren();
    if (!currentResults.length) {
      resultsList.style.display = 'none';
      return;
    }
    resultsList.style.display = 'block';
    currentResults.forEach((item, idx) => {
      const { code, desc, friendlyLabel } = item._norm || {};
      const rightText = desc && desc.toLowerCase() !== friendlyLabel?.toLowerCase() ? desc : '';

      const resultRow = el(
        'div',
        {
          class: 'billing-search-result-row',
          style:
            'padding: 0.45rem 0.65rem; display:flex; justify-content:space-between; align-items:flex-start; gap: 0.65rem; cursor:pointer; font-size: 0.95rem; background: ' +
            (idx === highlightIndex ? 'rgba(0,154,68,0.12);' : 'white;'),
          onmouseenter: () => {
            highlightIndex = idx;
            Array.from(resultsList.children).forEach((child, cIdx) => {
              child.style.background = cIdx === idx ? 'rgba(0,154,68,0.12)' : 'white';
            });
          },
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            applySelection(item);
          },
        },
        [
          el('div', { style: 'font-weight:600; min-width: 6rem;' }, code || item.value),
          el(
            'div',
            { style: 'flex:1; color: var(--text-muted); text-align:left;' },
            rightText || friendlyLabel || '',
          ),
        ],
      );
      resultsList.appendChild(resultRow);
    });
  };

  const performSearch = () => {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) {
      currentResults = [];
      renderResults();
      return;
    }
    currentResults = codes
      .map((item) => ({ ...item, _score: scoreOption(item, q) }))
      .filter((i) => i._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 10);
    highlightIndex = currentResults.length ? 0 : -1;
    renderResults();
  };

  const applySelection = (item) => {
    if (!item) return;
    data.billingCodes[index] = {
      code: item.value,
      linkedDiagnosisCode: codeEntry.linkedDiagnosisCode || getPrimaryDiagnosisCode(data),
      description: item.description,
      label: item.label,
      units: codeEntry.units || 1,
      timeSpent: codeEntry.timeSpent || '',
    };
    updateField('billingCodes', data.billingCodes);
    renderCallback();
  };

  const commitSelection = () => {
    if (currentResults.length) {
      const choice = currentResults[highlightIndex >= 0 ? highlightIndex : 0];
      applySelection(choice);
    }
  };

  searchInput.addEventListener('input', () => performSearch());
  searchInput.addEventListener('keydown', (e) => {
    if (!currentResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = (highlightIndex + 1) % currentResults.length;
      renderResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = (highlightIndex - 1 + currentResults.length) % currentResults.length;
      renderResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitSelection();
    }
  });

  searchCell.append(searchInput, resultsList);
  row.appendChild(searchCell);

  // Linked diagnosis cell
  const linkedDiagnosisSelect = createCustomSelect({
    options: getDiagnosisLinkOptions(data),
    value: codeEntry.linkedDiagnosisCode || getPrimaryDiagnosisCode(data),
    className: 'combined-neuroscreen__input',
    onChange: (newValue) => {
      codeEntry.linkedDiagnosisCode = newValue;
      updateField('billingCodes', data.billingCodes);
      renderCallback();
    },
  }).element;
  const linkedDxCell = el('td', { class: 'combined-neuroscreen-td' });
  linkedDxCell.appendChild(linkedDiagnosisSelect);
  row.appendChild(linkedDxCell);

  // Units cell (editable even during search)
  const unitsInput = el('input', {
    type: 'number',
    value: codeEntry.units || 1,
    min: 1,
    max: 8,
    class: 'combined-neuroscreen__input',
    style: 'text-align: center;',
    onblur: (e) => {
      codeEntry.units = parseInt(e.target.value) || 1;
    },
  });
  const unitsCell = el('td', { class: 'combined-neuroscreen-td' });
  unitsCell.appendChild(unitsInput);
  row.appendChild(unitsCell);

  // Time cell
  const timeInput = el('input', {
    type: 'text',
    value: codeEntry.timeSpent || '',
    placeholder: '30 min',
    class: 'combined-neuroscreen__input',
    style: 'text-align: center;',
    onblur: (e) => {
      codeEntry.timeSpent = e.target.value;
    },
  });
  const timeCell = el('td', { class: 'combined-neuroscreen-td' });
  timeCell.appendChild(timeInput);
  row.appendChild(timeCell);

  // Remove button
  const actionCell = el('td', { class: 'combined-neuroscreen-td action-col' });
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      onclick: () => {
        data.billingCodes.splice(index, 1);
        updateField('billingCodes', data.billingCodes);
        renderCallback();
      },
    },
    '×',
  );
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  return row;
}

/**
 * Top 25 PT CPT codes used in practice
 */
function getPTCPTCodes() {
  return [
    { value: '', label: 'Select CPT Code...', description: '' },

    // Time-Based Codes (Most Common)
    {
      value: '97110',
      label: '97110 - Therapeutic Exercise',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; therapeutic exercises to develop strength and endurance, range of motion and flexibility',
    },
    {
      value: '97112',
      label: '97112 - Neuromuscular Re-education',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; neuromuscular reeducation of movement, balance, coordination, kinesthetic sense, posture, and/or proprioception',
    },
    {
      value: '97116',
      label: '97116 - Gait Training',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; gait training (includes stair climbing)',
    },
    {
      value: '97140',
      label: '97140 - Manual Therapy',
      description:
        'Manual therapy techniques (eg, mobilization/manipulation, manual lymphatic drainage, manual traction), 1 or more regions, each 15 minutes',
    },
    {
      value: '97530',
      label: '97530 - Therapeutic Activities',
      description:
        'Therapeutic activities, direct (one-on-one) patient contact (use of dynamic activities to improve functional performance), each 15 minutes',
    },
    {
      value: '97535',
      label: '97535 - Self-Care Training',
      description:
        'Self-care/home management training (eg, activities of daily living (ADL) and compensatory training, meal preparation, safety procedures, and instructions in use of assistive technology devices/adaptive equipment) direct one-on-one contact, each 15 minutes',
    },

    // Modality Codes (Time-Based)
    {
      value: '97012',
      label: '97012 - Mechanical Traction',
      description: 'Application of a modality to 1 or more areas; traction, mechanical',
    },
    {
      value: '97014',
      label: '97014 - Electrical Stimulation',
      description:
        'Application of a modality to 1 or more areas; electrical stimulation (unattended)',
    },
    {
      value: '97035',
      label: '97035 - Ultrasound',
      description: 'Application of a modality to 1 or more areas; ultrasound, each 15 minutes',
    },
    {
      value: '97039',
      label: '97039 - Unlisted Modality',
      description: 'Unlisted modality (specify type and time if constant attendance)',
    },

    // Evaluation Codes (Non-Time Based)
    {
      value: '97161',
      label: '97161 - PT Evaluation Low Complexity',
      description:
        'Physical therapy evaluation: low complexity, requiring these components: A history with no personal factors and/or comorbidities that impact the plan of care; An examination of body system(s) using standardized tests and measures addressing 1-2 elements from any of the following: body structures and functions, activity limitations, and/or participation restrictions; A clinical presentation with stable and/or uncomplicated characteristics; and Clinical decision making of low complexity using standardized patient assessment instrument and/or measurable assessment of functional outcome. Typically 20 minutes are spent face-to-face with the patient and/or family.',
    },
    {
      value: '97162',
      label: '97162 - PT Evaluation Moderate Complexity',
      description:
        'Physical therapy evaluation: moderate complexity, requiring these components: A history of present problem with 1-2 personal factors and/or comorbidities that impact the plan of care; An examination of body systems using standardized tests and measures in addressing a total of 3 or more elements from any of the following: body structures and functions, activity limitations, and/or participation restrictions; An evolving clinical presentation with changing characteristics; and Clinical decision making of moderate complexity using standardized patient assessment instrument and/or measurable assessment of functional outcome. Typically 30 minutes are spent face-to-face with the patient and/or family.',
    },
    {
      value: '97163',
      label: '97163 - PT Evaluation High Complexity',
      description:
        'Physical therapy evaluation: high complexity, requiring these components: A history of present problem with 3 or more personal factors and/or comorbidities that impact the plan of care; An examination of body systems using standardized tests and measures addressing a total of 4 or more elements from any of the following: body structures and functions, activity limitations, and/or participation restrictions; A clinical presentation with unstable and unpredictable characteristics; and Clinical decision making of high complexity using standardized patient assessment instrument and/or measurable assessment of functional outcome. Typically 45 minutes are spent face-to-face with the patient and/or family.',
    },
    {
      value: '97164',
      label: '97164 - PT Re-evaluation',
      description:
        'Re-evaluation of physical therapy established plan of care, requiring these components: An examination including a review of history and use of standardized tests and measures is required; and Revised plan of care using a standardized patient assessment instrument and/or measurable assessment of functional outcome Typically 20 minutes are spent face-to-face with the patient and/or family.',
    },

    // Additional Common Codes
    {
      value: '97010',
      label: '97010 - Hot/Cold Packs',
      description: 'Application of a modality to 1 or more areas; hot or cold packs',
    },
    {
      value: '97018',
      label: '97018 - Paraffin Bath',
      description: 'Application of a modality to 1 or more areas; paraffin bath',
    },
    {
      value: '97022',
      label: '97022 - Whirlpool',
      description: 'Application of a modality to 1 or more areas; whirlpool',
    },
    {
      value: '97032',
      label: '97032 - Electrical Stimulation (Manual)',
      description:
        'Application of a modality to 1 or more areas; electrical stimulation (manual), each 15 minutes',
    },
    {
      value: '97033',
      label: '97033 - Iontophoresis',
      description: 'Application of a modality to 1 or more areas; iontophoresis, each 15 minutes',
    },
    {
      value: '97034',
      label: '97034 - Contrast Baths',
      description: 'Application of a modality to 1 or more areas; contrast baths, each 15 minutes',
    },
    {
      value: '97113',
      label: '97113 - Aquatic Therapy',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; aquatic therapy with therapeutic exercises',
    },
    {
      value: '97124',
      label: '97124 - Massage',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; massage, including effleurage, petrissage and/or tapotement (stroking, compression, percussion)',
    },
    {
      value: '97150',
      label: '97150 - Group Therapy',
      description:
        'Therapeutic procedure(s), group (2 or more individuals). Group therapy procedures involve constant attendance of the physician or other qualified health care professional (ie, therapist), but by definition do not require one-on-one patient contact by the same physician or other qualified health care professional.',
    },
    {
      value: '97542',
      label: '97542 - Wheelchair Management Training',
      description: 'Wheelchair management (eg, assessment, fitting, training), each 15 minutes',
    },
    {
      value: '97750',
      label: '97750 - Physical Performance Test',
      description:
        'Physical performance test or measurement (eg, musculoskeletal, functional capacity), with written report, each 15 minutes',
    },
    {
      value: '97755',
      label: '97755 - Assistive Technology Assessment',
      description:
        'Assistive technology assessment (eg, to restore, augment or compensate for existing function, optimize functional tasks and/or maximize environmental accessibility), direct one-on-one contact, with written report, each 15 minutes',
    },
    {
      value: '97760',
      label: '97760 - Orthotic Management and Training',
      description:
        'Orthotic(s) management and training (including assessment and fitting when not otherwise reported), upper extremity(ies), lower extremity(ies) and/or trunk, initial orthotic(s) encounter, each 15 minutes',
    },
    {
      value: '97761',
      label: '97761 - Prosthetic Training',
      description:
        'Prosthetic training, upper and/or lower extremity(ies), initial prosthetic(s) encounter, each 15 minutes',
    },
    {
      value: '97016',
      label: '97016 - Vasopneumatic Device',
      description:
        'Application of a modality to 1 or more areas; vasopneumatic devices (eg, compression therapy)',
    },
    {
      value: '97139',
      label: '97139 - Unlisted Therapeutic Procedure',
      description: 'Unlisted therapeutic procedure (specify)',
    },
    {
      value: '97597',
      label: '97597 - Debridement, Open Wound (first 20 sq cm)',
      description:
        'Debridement (eg, high pressure waterjet with/without suction, sharp selective debridement with scissors, scalpel and forceps), open wound, (eg, fibrin, devitalized epidermis and/or dermis, exudate, debris, biofilm), including topical application(s), wound assessment, use of a whirlpool, when performed and target instructions for ongoing care, per session, total wound(s) surface area; first 20 sq cm or less',
    },
    {
      value: '97598',
      label: '97598 - Debridement, Open Wound (each additional 20 sq cm)',
      description:
        'Debridement, open wound, each additional 20 sq cm, or part thereof (list separately in addition to code for primary procedure)',
    },
    {
      value: '95831',
      label: '95831 - Muscle Testing, Manual (Extremity/Trunk)',
      description:
        'Muscle testing, manual (separate procedure) with report; extremity (excluding hand) or trunk',
    },
    {
      value: '95852',
      label: '95852 - Range of Motion Measurements',
      description:
        'Range of motion measurements and report (separate procedure); each additional joint (list separately in addition to code for primary procedure)',
    },
    {
      value: '29125',
      label: '29125 - Application of Short Arm Splint (static)',
      description: 'Application of short arm splint (forearm to hand); static',
    },
    {
      value: '29126',
      label: '29126 - Application of Short Arm Splint (dynamic)',
      description: 'Application of short arm splint (forearm to hand); dynamic',
    },
  ];
}

/**
 * Determines if a CPT code is time-based (requires units)
 */
// function isTimeBasedCode(code) {
//   const timeBasedCodes = [
//     '97110',
//     '97112',
//     '97116',
//     '97140',
//     '97530',
//     '97535',
//     '97032',
//     '97033',
//     '97034',
//     '97035',
//     '97113',
//     '97124',
//     '97542',
//     '97750',
//     '97755',
//   ];
//   return timeBasedCodes.includes(code);
// }

// Helper: Normalize code/description
function normalizeOption(opt) {
  const rawCode = (opt?.value || '').trim();
  const rawLabel = (opt?.label || '').trim();
  const rawDesc = (opt?.description || '').trim();
  let code = rawCode;
  let descFromLabel = '';
  const m = rawLabel.match(/^([A-Z0-9.]+)\s*[-–—:]\s*(.+)$/i);
  if (m) {
    if (!code) code = m[1];
    descFromLabel = m[2].trim();
  }
  const desc = rawDesc || descFromLabel;
  const friendlyLabel = desc ? desc : rawLabel || code;
  return { code, desc, friendlyLabel };
}

// Helper: Score match
function scoreOption(item, q) {
  const norm = item._norm || normalizeOption(item);
  const code = (norm.code || item.value || '').toLowerCase();
  const desc = (norm.desc || item.description || '').toLowerCase();
  const label = (norm.friendlyLabel || item.label || '').toLowerCase();
  if (code === q) return 100;
  if (code.startsWith(q)) return 90;
  if (label.startsWith(q)) return 80;
  if (desc.startsWith(q)) return 75;
  if (code.includes(q)) return 60;
  if (label.includes(q)) return 55;
  if (desc.includes(q)) return 50;
  return 0;
}

/**
 * Top 25 ICD-10 diagnosis codes commonly used in Physical Therapy
 */
function getPTICD10Codes() {
  return [
    { value: '', label: 'Select ICD-10 Code...', description: '' },

    // Low Back Pain (Most Common)
    { value: 'M54.5', label: 'M54.5 - Low back pain', description: 'Low back pain, unspecified' },
    {
      value: 'M51.36',
      label: 'M51.36 - Other intervertebral disc degeneration, lumbar region',
      description: 'Disc degeneration in lumbar spine',
    },
    {
      value: 'M54.16',
      label: 'M54.16 - Radiculopathy, lumbar region',
      description: 'Nerve root compression in lumbar spine',
    },

    // Neck Pain
    { value: 'M54.2', label: 'M54.2 - Cervicalgia', description: 'Neck pain, unspecified' },
    {
      value: 'M50.30',
      label: 'M50.30 - Other cervical disc degeneration, unspecified cervical region',
      description: 'Cervical disc degeneration',
    },
    {
      value: 'M54.12',
      label: 'M54.12 - Radiculopathy, cervical region',
      description: 'Nerve root compression in cervical spine',
    },

    // Shoulder Conditions
    {
      value: 'M75.41',
      label: 'M75.41 - Impingement syndrome of right shoulder',
      description: 'Impingement syndrome, right shoulder',
    },
    {
      value: 'M75.42',
      label: 'M75.42 - Impingement syndrome of left shoulder',
      description: 'Impingement syndrome, left shoulder',
    },
    {
      value: 'M75.21',
      label: 'M75.21 - Bicipital tendinitis, right shoulder',
      description: 'Bicipital tendinitis, right shoulder',
    },
    {
      value: 'M75.22',
      label: 'M75.22 - Bicipital tendinitis, left shoulder',
      description: 'Bicipital tendinitis, left shoulder',
    },
    {
      value: 'M25.511',
      label: 'M25.511 - Pain in right shoulder',
      description: 'Right shoulder pain, unspecified cause',
    },
    {
      value: 'M25.512',
      label: 'M25.512 - Pain in left shoulder',
      description: 'Left shoulder pain, unspecified cause',
    },
    {
      value: 'M75.30',
      label: 'M75.30 - Calcific tendinitis of unspecified shoulder',
      description: 'Calcific deposits in shoulder tendons',
    },
    {
      value: 'M75.100',
      label:
        'M75.100 - Unspecified rotator cuff tear or rupture of unspecified shoulder, not specified as traumatic',
      description: 'Rotator cuff pathology',
    },
    {
      value: 'M75.101',
      label: 'M75.101 - Unspecified rotator cuff tear, right shoulder, not specified as traumatic',
      description: 'Rotator cuff tear, right shoulder',
    },
    {
      value: 'M75.102',
      label: 'M75.102 - Unspecified rotator cuff tear, left shoulder, not specified as traumatic',
      description: 'Rotator cuff tear, left shoulder',
    },
    {
      value: 'M75.111',
      label: 'M75.111 - Incomplete rotator cuff tear, right shoulder',
      description: 'Partial thickness rotator cuff tear, right shoulder',
    },
    {
      value: 'M75.112',
      label: 'M75.112 - Incomplete rotator cuff tear, left shoulder',
      description: 'Partial thickness rotator cuff tear, left shoulder',
    },
    {
      value: 'M75.121',
      label: 'M75.121 - Complete rotator cuff tear, right shoulder',
      description: 'Full thickness rotator cuff tear, right shoulder',
    },
    {
      value: 'M75.122',
      label: 'M75.122 - Complete rotator cuff tear, left shoulder',
      description: 'Full thickness rotator cuff tear, left shoulder',
    },
    {
      value: 'M75.01',
      label: 'M75.01 - Adhesive capsulitis of right shoulder',
      description: 'Frozen shoulder, right side',
    },
    {
      value: 'M75.02',
      label: 'M75.02 - Adhesive capsulitis of left shoulder',
      description: 'Frozen shoulder, left side',
    },
    {
      value: 'S43.401A',
      label: 'S43.401A - Unspecified sprain of right shoulder joint, initial encounter',
      description: 'Right shoulder sprain, first treatment',
    },
    {
      value: 'S43.402A',
      label: 'S43.402A - Unspecified sprain of left shoulder joint, initial encounter',
      description: 'Left shoulder sprain, first treatment',
    },
    {
      value: 'M19.011',
      label: 'M19.011 - Primary osteoarthritis, right shoulder',
      description: 'Shoulder osteoarthritis, right side',
    },
    {
      value: 'M19.012',
      label: 'M19.012 - Primary osteoarthritis, left shoulder',
      description: 'Shoulder osteoarthritis, left side',
    },
    {
      value: 'S42.201A',
      label: 'S42.201A - Unspecified fracture of upper end of right humerus, initial encounter',
      description: 'Proximal humerus fracture, right, initial treatment',
    },

    // Elbow Conditions
    {
      value: 'M77.11',
      label: 'M77.11 - Lateral epicondylitis, right elbow',
      description: 'Tennis elbow, right side',
    },
    {
      value: 'M77.12',
      label: 'M77.12 - Lateral epicondylitis, left elbow',
      description: 'Tennis elbow, left side',
    },
    {
      value: 'M77.01',
      label: 'M77.01 - Medial epicondylitis, right elbow',
      description: "Golfer's elbow, right side",
    },
    {
      value: 'M77.02',
      label: 'M77.02 - Medial epicondylitis, left elbow',
      description: "Golfer's elbow, left side",
    },
    {
      value: 'M25.521',
      label: 'M25.521 - Pain in right elbow',
      description: 'Right elbow pain, unspecified cause',
    },
    {
      value: 'M25.522',
      label: 'M25.522 - Pain in left elbow',
      description: 'Left elbow pain, unspecified cause',
    },
    {
      value: 'S53.401A',
      label: 'S53.401A - Unspecified sprain of right elbow, initial encounter',
      description: 'Right elbow sprain, first treatment',
    },
    {
      value: 'S53.402A',
      label: 'S53.402A - Unspecified sprain of left elbow, initial encounter',
      description: 'Left elbow sprain, first treatment',
    },
    {
      value: 'M19.021',
      label: 'M19.021 - Primary osteoarthritis, right elbow',
      description: 'Elbow osteoarthritis, right side',
    },
    {
      value: 'M19.022',
      label: 'M19.022 - Primary osteoarthritis, left elbow',
      description: 'Elbow osteoarthritis, left side',
    },

    // Wrist and Hand Conditions
    {
      value: 'M25.531',
      label: 'M25.531 - Pain in right wrist',
      description: 'Right wrist pain, unspecified cause',
    },
    {
      value: 'M25.532',
      label: 'M25.532 - Pain in left wrist',
      description: 'Left wrist pain, unspecified cause',
    },
    {
      value: 'M25.541',
      label: 'M25.541 - Pain in joints of right hand',
      description: 'Right hand joint pain, unspecified cause',
    },
    {
      value: 'M25.542',
      label: 'M25.542 - Pain in joints of left hand',
      description: 'Left hand joint pain, unspecified cause',
    },
    {
      value: 'G56.01',
      label: 'G56.01 - Carpal tunnel syndrome, right upper limb',
      description: 'Median nerve compression at wrist, right side',
    },
    {
      value: 'G56.02',
      label: 'G56.02 - Carpal tunnel syndrome, left upper limb',
      description: 'Median nerve compression at wrist, left side',
    },
    {
      value: 'M65.311',
      label: 'M65.311 - Trigger finger, right index finger',
      description: 'Stenosing tenosynovitis, right index finger',
    },
    {
      value: 'M65.30',
      label: 'M65.30 - Trigger finger, unspecified finger',
      description: 'Stenosing tenosynovitis, unspecified digit',
    },
    {
      value: 'M65.841',
      label: 'M65.841 - Other synovitis and tenosynovitis, right hand',
      description: "de Quervain's tenosynovitis / hand tendinitis, right",
    },
    {
      value: 'M65.842',
      label: 'M65.842 - Other synovitis and tenosynovitis, left hand',
      description: "de Quervain's tenosynovitis / hand tendinitis, left",
    },
    {
      value: 'S63.501A',
      label: 'S63.501A - Unspecified sprain of right wrist, initial encounter',
      description: 'Right wrist sprain, first treatment',
    },
    {
      value: 'S63.502A',
      label: 'S63.502A - Unspecified sprain of left wrist, initial encounter',
      description: 'Left wrist sprain, first treatment',
    },
    {
      value: 'S62.101A',
      label: 'S62.101A - Fracture of unspecified carpal bone, right wrist, initial encounter',
      description: 'Carpal fracture, right wrist, initial treatment',
    },
    {
      value: 'S62.102A',
      label: 'S62.102A - Fracture of unspecified carpal bone, left wrist, initial encounter',
      description: 'Carpal fracture, left wrist, initial treatment',
    },
    {
      value: 'M18.11',
      label: 'M18.11 - Primary osteoarthritis, right first carpometacarpal joint',
      description: 'Thumb CMC osteoarthritis, right side',
    },
    {
      value: 'M18.12',
      label: 'M18.12 - Primary osteoarthritis, left first carpometacarpal joint',
      description: 'Thumb CMC osteoarthritis, left side',
    },
    {
      value: 'M72.0',
      label: "M72.0 - Palmar fascial fibromatosis (Dupuytren's)",
      description: "Dupuytren's contracture",
    },

    // Knee Conditions
    {
      value: 'M25.561',
      label: 'M25.561 - Pain in right knee',
      description: 'Right knee pain, unspecified cause',
    },
    {
      value: 'M25.562',
      label: 'M25.562 - Pain in left knee',
      description: 'Left knee pain, unspecified cause',
    },
    {
      value: 'M17.10',
      label: 'M17.10 - Unilateral primary osteoarthritis, unspecified knee',
      description: 'Knee osteoarthritis, one side',
    },
    {
      value: 'S83.511A',
      label: 'S83.511A - Sprain of anterior cruciate ligament of right knee, initial encounter',
      description: 'ACL injury, right knee, first treatment',
    },
    {
      value: 'S83.512A',
      label: 'S83.512A - Sprain of anterior cruciate ligament of left knee, initial encounter',
      description: 'ACL injury, left knee, first treatment',
    },
    {
      value: 'S83.521A',
      label: 'S83.521A - Sprain of posterior cruciate ligament of right knee, initial encounter',
      description: 'PCL injury, right knee, first treatment',
    },
    {
      value: 'M22.41',
      label: 'M22.41 - Chondromalacia patellae, right knee',
      description: "Patellofemoral syndrome / runner's knee, right side",
    },
    {
      value: 'M22.42',
      label: 'M22.42 - Chondromalacia patellae, left knee',
      description: "Patellofemoral syndrome / runner's knee, left side",
    },
    {
      value: 'S83.241A',
      label: 'S83.241A - Other tear of medial meniscus, right knee, initial encounter',
      description: 'Medial meniscus tear, right knee',
    },

    // Hip Conditions
    {
      value: 'M25.551',
      label: 'M25.551 - Pain in right hip',
      description: 'Right hip pain, unspecified cause',
    },
    {
      value: 'M25.552',
      label: 'M25.552 - Pain in left hip',
      description: 'Left hip pain, unspecified cause',
    },
    {
      value: 'M16.10',
      label: 'M16.10 - Unilateral primary osteoarthritis, unspecified hip',
      description: 'Hip osteoarthritis, one side',
    },

    // General Musculoskeletal
    {
      value: 'M79.3',
      label: 'M79.3 - Panniculitis, unspecified',
      description: 'Inflammation of subcutaneous fat tissue',
    },
    {
      value: 'M62.81',
      label: 'M62.81 - Muscle weakness (generalized)',
      description: 'Generalized muscle weakness',
    },
    {
      value: 'M25.50',
      label: 'M25.50 - Pain in unspecified joint',
      description: 'Joint pain, location not specified',
    },
    {
      value: 'M79.1',
      label: 'M79.1 - Myalgia',
      description: 'Muscle pain, unspecified',
    },
    {
      value: 'M79.7',
      label: 'M79.7 - Fibromyalgia',
      description: 'Fibromyalgia syndrome',
    },

    // Thoracic Spine
    {
      value: 'M54.6',
      label: 'M54.6 - Pain in thoracic spine',
      description: 'Thoracic back pain, unspecified',
    },
    {
      value: 'M54.14',
      label: 'M54.14 - Radiculopathy, thoracic region',
      description: 'Nerve root compression in thoracic spine',
    },

    // Ankle/Foot Conditions
    {
      value: 'M25.571',
      label: 'M25.571 - Pain in right ankle and joints of right foot',
      description: 'Right ankle/foot pain',
    },
    {
      value: 'M25.572',
      label: 'M25.572 - Pain in left ankle and joints of left foot',
      description: 'Left ankle/foot pain',
    },
    {
      value: 'S93.401A',
      label: 'S93.401A - Sprain of unspecified ligament of right ankle, initial encounter',
      description: 'Right ankle sprain, first treatment',
    },

    // Balance and Gait
    {
      value: 'R26.81',
      label: 'R26.81 - Unsteadiness on feet',
      description: 'Balance impairment, unsteadiness',
    },
    {
      value: 'R26.2',
      label: 'R26.2 - Difficulty in walking, not elsewhere classified',
      description: 'Walking difficulty, gait dysfunction',
    },
    {
      value: 'R29.6',
      label: 'R29.6 - Repeated falls',
      description: 'History of recurrent falls, fall risk',
    },

    // Post-Surgical / Aftercare
    {
      value: 'Z96.641',
      label: 'Z96.641 - Presence of right artificial hip joint',
      description: 'Status post right total hip replacement',
    },
    {
      value: 'Z96.642',
      label: 'Z96.642 - Presence of left artificial hip joint',
      description: 'Status post left total hip replacement',
    },
    {
      value: 'Z96.651',
      label: 'Z96.651 - Presence of right artificial knee joint',
      description: 'Status post right total knee replacement',
    },
    {
      value: 'Z96.652',
      label: 'Z96.652 - Presence of left artificial knee joint',
      description: 'Status post left total knee replacement',
    },
    {
      value: 'Z87.39',
      label: 'Z87.39 - Personal history of other musculoskeletal disorders',
      description: 'History of prior musculoskeletal conditions',
    },
    {
      value: 'Z48.89',
      label: 'Z48.89 - Encounter for other specified surgical aftercare',
      description: 'Post-operative rehabilitation encounter',
    },
  ];
}
