/**
 * Editable Table Module
 * Consolidated table helper for all assessment tables
 */
import { el, textareaAutoResize } from '../../../ui/utils.js';
import { createCustomSelect } from '../../../ui/CustomSelect.js';

// ---- Bilateral helpers (extracted to reduce function complexity) ----
function groupBilateralItems(items) {
  const groups = {};
  items.forEach((item, index) => {
    const baseName = item.name || item.joint || item.muscle;
    if (!groups[baseName]) {
      groups[baseName] = { normal: item.normal, left: null, right: null, bilateral: null };
    }
    if (item.side === 'L') groups[baseName].left = index;
    else if (item.side === 'R') groups[baseName].right = index;
    else groups[baseName].bilateral = index;
  });
  return groups;
}

function buildBilateralColumns({
  valueType = 'text',
  options = [],
  normalValues = true,
  embedNormalInName = false,
  nameColumnLabel = 'Name',
  nameColumnShortLabel = '',
}) {
  const cols = [
    {
      field: 'name',
      label: nameColumnLabel,
      type: 'label',
      short: nameColumnShortLabel || undefined,
    },
    { field: 'left', label: 'Left', type: valueType, options, placeholder: 'L' },
    { field: 'right', label: 'Right', type: valueType, options, placeholder: 'R' },
  ];
  const hasNormal = !!(normalValues && !embedNormalInName);
  if (hasNormal) cols.push({ field: 'normal', label: 'Normal', type: 'label' });

  // Standard widths
  if (cols.length === 3) {
    cols[0].width = '50%';
    cols[1].width = '25%';
    cols[2].width = '25%';
  } else if (cols.length === 4) {
    cols[0].width = '40%';
    cols[1].width = '20%';
    cols[2].width = '20%';
    cols[3].width = '20%';
  }
  return { columns: cols, hasNormal };
}

function groupsToTableData(groups, data, { normalValues, embedNormalInName }) {
  const tableData = {};
  const groupsByRowId = {};
  Object.keys(groups).forEach((groupName) => {
    const group = groups[groupName];
    const rowId = groupName.toLowerCase().replace(/\s+/g, '-');
    groupsByRowId[rowId] = group;
    const displayName =
      normalValues && embedNormalInName && group.normal
        ? `${groupName} (${group.normal})`
        : groupName;

    const rowBase = {
      name: displayName,
      left: data[group.left] || '',
      right: data[group.right] || '',
    };
    if (!embedNormalInName && normalValues) rowBase.normal = group.normal || '';
    tableData[rowId] = rowBase;
  });
  return { tableData, groupsByRowId };
}

// Map common percentage widths to utility classes to avoid inline styles
function widthClass(width) {
  const v = String(width || '').trim();
  switch (v) {
    case '50%':
      return 'w-50p';
    case '40%':
      return 'w-40p';
    case '25%':
      return 'w-25p';
    case '20%':
      return 'w-20p';
    default:
      return '';
  }
}

// ---- Internal builders to reduce complexity ----
function buildTableHeader({ title, showAddButton, compactAddButton, addButtonText, onAdd }) {
  if (!title && !(showAddButton && !compactAddButton)) return null;
  const header = el('div', {
    class: 'editable-table__header d-flex jc-between ai-center mb-8',
  });
  if (title) {
    header.appendChild(el('h5', { class: 'editable-table__title m-0 text-accent' }, title));
  }
  if (showAddButton && !compactAddButton) {
    header.appendChild(
      el(
        'button',
        { type: 'button', class: 'btn small primary editable-table__add-btn', onclick: onAdd },
        addButtonText,
      ),
    );
  }
  return header;
}

function ensureEmptyOption(options) {
  const raw = Array.isArray(options) ? options.slice() : [];
  const hasEmpty = raw.some((opt) =>
    opt && typeof opt === 'object' ? String(opt.value ?? '') === '' : String(opt) === '',
  );
  if (!hasEmpty) raw.unshift({ value: '', label: '' });
  return raw;
}

function buildSelectInput(column, value, onChange) {
  const rawOptions = ensureEmptyOption(column.options);
  const options = rawOptions.map((option) => {
    const isObj = option && typeof option === 'object';
    const optValue = isObj
      ? Object.prototype.hasOwnProperty.call(option, 'value')
        ? option.value
        : (option.label ?? '')
      : option;
    const optLabel = isObj ? (option.label ?? String(optValue)) : String(optValue);
    return { value: String(optValue), label: optLabel };
  });

  const input = createCustomSelect({
    options: options,
    value: String(value ?? ''),
    className: 'editable-table__select form-input-standard',
    onChange: (newValue) => onChange(String(newValue)),
  }).element;

  return input;
}

function buildInputForColumn(column, value, onChange) {
  if (column.type === 'label') {
    return el('span', { class: 'editable-table__label' }, String(value ?? ''));
  }
  if (column.type === 'select') return buildSelectInput(column, value, onChange);
  if (column.type === 'number')
    return el('input', {
      type: 'number',
      class: 'editable-table__input form-input-standard',
      value: value,
      placeholder: column.placeholder || '',
      min: column.min,
      max: column.max,
      step: column.step,
      onblur: (e) => onChange(e.target.value),
    });
  if (column.type === 'textarea') {
    const t = el(
      'textarea',
      {
        class: 'editable-table__textarea form-input-standard resize-vertical',
        rows: column.rows || 1,
        placeholder: column.placeholder || '',
        onblur: (e) => onChange(e.target.value),
      },
      value,
    );
    textareaAutoResize(t);
    return t;
  }
  return el('input', {
    type: column.type || 'text',
    class: 'editable-table__input form-input-standard',
    value: value,
    placeholder: column.placeholder || '',
    onblur: (e) => onChange(e.target.value),
  });
}

function buildBodyRow(columns, rowId, rowData, createCell, showDeleteButton, onDelete) {
  return el('tr', { class: 'editable-table__row', 'data-row-id': rowId }, [
    ...columns.map((col) => createCell(col, rowData, rowId)),
    ...(showDeleteButton
      ? [
          el(
            'td',
            { class: 'editable-table__cell editable-table__cell--actions' },
            el(
              'button',
              {
                type: 'button',
                class: 'remove-btn editable-table__delete-btn',
                title: 'Delete row',
                'aria-label': 'Delete row',
                onclick: () => onDelete(rowId),
              },
              '×',
            ),
          ),
        ]
      : []),
  ]);
}

function buildTableElement({
  columns,
  data,
  showHeader,
  actionsHeaderLabel,
  showDeleteButton,
  createCell,
  onDelete,
}) {
  const rows = Object.keys(data);
  const tableChildren = [];
  if (showHeader) {
    tableChildren.push(
      el(
        'thead',
        { class: 'editable-table__head' },
        el('tr', {}, [
          ...columns.map((col) =>
            el(
              'th',
              {
                class:
                  `editable-table__header-cell editable-table__header-cell--${col.field} ${widthClass(col.width)}`.trim(),
                style: widthClass(col.width)
                  ? undefined
                  : col.width
                    ? `width: ${col.width};`
                    : undefined,
                scope: 'col',
                ...(col.short ? { 'data-short': String(col.short) } : {}),
              },
              col.label,
            ),
          ),
          ...(showDeleteButton
            ? [
                el(
                  'th',
                  {
                    class: 'editable-table__header-cell editable-table__header-cell--actions',
                    style: undefined,
                    scope: 'col',
                    'aria-label': 'Actions',
                  },
                  actionsHeaderLabel,
                ),
              ]
            : []),
        ]),
      ),
    );
  }
  tableChildren.push(
    el(
      'tbody',
      { class: 'editable-table__body' },
      rows.map((rowId) =>
        buildBodyRow(columns, rowId, data[rowId], createCell, showDeleteButton, onDelete),
      ),
    ),
  );
  const table = el('table', { class: 'table editable-table__table' }, tableChildren);
  // Wrap in responsive container for mobile horizontal scroll when needed
  return el('div', { class: 'table-responsive' }, table);
}

function buildCompactFooter(showAddButton, compactAddButton, onAdd) {
  if (!(showAddButton && compactAddButton)) return null;
  return el(
    'div',
    {
      class: 'editable-table__footer d-flex jc-center mb-16',
    },
    el(
      'button',
      {
        type: 'button',
        class: 'compact-add-btn',
        title: 'Add row',
        'aria-label': 'Add row',
        onclick: onAdd,
      },
      '+',
    ),
  );
}

/**
 * Creates a standardized editable table with consistent styling and behavior
 * @param {object} config - Table configuration
 */
export function createEditableTable(config) {
  const {
    title,
    columns,
    data,
    onChange,
    addButtonText = '+ Add Row',
    showAddButton = true,
    showDeleteButton = true,
    actionsHeaderLabel = '',
    compactAddButton = false,
    startWithOneRow = false,
    showHeader = true,
    className = '',
    style = {},
  } = config;

  const container = el('div', {
    class: `editable-table mb-16 ${className}`.trim(),
    style: style,
  });

  // Add title and controls
  const updateCell = makeUpdateCell(data, onChange);
  let rebuildTable;
  const addRow = makeAddRow(columns, data, onChange, () => rebuildTable());
  const deleteRow = makeDeleteRow(data, onChange, () => rebuildTable());

  attachHeader(container, { title, showAddButton, compactAddButton, addButtonText }, () =>
    addRow(),
  );

  const createCell = makeCreateCell(updateCell);
  rebuildTable = makeRebuildTable({
    container,
    columns,
    data,
    showHeader,
    actionsHeaderLabel,
    showDeleteButton,
    createCell,
    onDelete: deleteRow,
    showAddButton,
    compactAddButton,
    onAdd: () => addRow(),
  });

  initializeTable(startWithOneRow, data, addRow, rebuildTable);
  return {
    element: container,
    rebuild: rebuildTable,
    addRow,
    deleteRow,
    updateCell,
  };
}

function attachHeader(container, { title, showAddButton, compactAddButton, addButtonText }, onAdd) {
  const header = buildTableHeader({ title, showAddButton, compactAddButton, addButtonText, onAdd });
  if (header) container.appendChild(header);
}

function makeCreateCell(updateCell) {
  function applyA11yLabel(input, column, rowData, rowId) {
    if (!input || !input.tagName || !/^(INPUT|TEXTAREA|SELECT)$/.test(input.tagName)) return;
    try {
      if (input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')) return;
      const rowLabel = rowData.name || rowId;
      const colLabel = column.label || column.field;
      input.setAttribute('aria-label', `${colLabel}: ${rowLabel}`);
    } catch {}
  }
  return (column, rowData, rowId) => {
    const value = rowData[column.field] || '';
    const input = buildInputForColumn(column, value, (val) => updateCell(rowId, column.field, val));
    // Accessibility: ensure interactive form control has a programmatic name.
    applyA11yLabel(input, column, rowData, rowId);
    return el(
      'td',
      {
        class:
          `editable-table__cell editable-table__cell--${column.field} ${widthClass(column.width)}`.trim(),
        style: widthClass(column.width)
          ? undefined
          : column.width
            ? `width: ${column.width};`
            : undefined,
        'data-col-label': String(column.label || ''),
      },
      input,
    );
  };
}

function makeRebuildTable({
  container,
  columns,
  data,
  showHeader,
  actionsHeaderLabel,
  showDeleteButton,
  createCell,
  onDelete,
  showAddButton,
  compactAddButton,
  onAdd,
}) {
  let table = null;
  let footerEl = null;
  return () => {
    if (table) table.remove();
    if (footerEl) {
      footerEl.remove();
      footerEl = null;
    }
    table = buildTableElement({
      columns,
      data,
      showHeader,
      actionsHeaderLabel,
      showDeleteButton,
      createCell,
      onDelete,
    });
    container.appendChild(table);
    const footer = buildCompactFooter(showAddButton, compactAddButton, onAdd);
    if (footer) {
      footerEl = footer;
      container.appendChild(footerEl);
    }
  };
}

function initializeTable(startWithOneRow, data, addRow, rebuildTable) {
  if (startWithOneRow && Object.keys(data || {}).length === 0) {
    addRow();
  } else {
    rebuildTable();
  }
}

function makeAddRow(columns, data, onChange, onAfter) {
  return () => {
    const newRow = {};
    columns.forEach((col) => {
      newRow[col.field] = col.defaultValue || '';
    });
    const newId = Date.now().toString();
    data[newId] = newRow;
    onChange(data);
    onAfter();
  };
}

function makeDeleteRow(data, onChange, onAfter) {
  return (rowId) => {
    delete data[rowId];
    onChange(data);
    onAfter();
  };
}

function makeUpdateCell(data, onChange) {
  return (rowId, field, value) => {
    if (!data[rowId]) data[rowId] = {};
    data[rowId][field] = value;
    onChange(data);
  };
}

/**
 * Creates a bilateral assessment table (common for ROM/MMT)
 * @param {object} config - Configuration object
 */
export function createBilateralTable(config) {
  const {
    title,
    items,
    data,
    onChange,
    valueType = 'text', // 'text', 'select', 'number'
    options = [],
    normalValues = true,
    // notesColumn removed (UI simplification)
    nameColumnLabel = 'Name',
    nameColumnShortLabel = '',
    showTitle = true,
    embedNormalInName = false,
    // notesWidth no longer used
  } = config;

  // Group items and build columns/data
  const groups = groupBilateralItems(items);
  const { columns, hasNormal } = buildBilateralColumns({
    valueType,
    options,
    normalValues,
    embedNormalInName,
    nameColumnLabel,
    nameColumnShortLabel,
  });
  const { tableData, groupsByRowId } = groupsToTableData(groups, data, {
    normalValues,
    embedNormalInName,
  });

  return createEditableTable({
    title: showTitle ? title : undefined,
    columns,
    data: tableData,
    onChange: (newData) => {
      // Convert back to original format and call onChange
      const updatedData = { ...data };
      Object.keys(newData).forEach((rowId) => {
        const row = newData[rowId];
        const group = groupsByRowId[rowId] || groups[row.name];

        if (group.left !== null) updatedData[group.left] = row.left;
        if (group.right !== null) updatedData[group.right] = row.right;
        // notes removed
      });
      onChange(updatedData);
    },
    showAddButton: false, // Bilateral tables typically have fixed structure
    actionsHeaderLabel: '', // Blank header to avoid 'Actions' label
    className: `bilateral-table ${hasNormal ? 'has-normal' : 'no-normal'}`,
  });
}
