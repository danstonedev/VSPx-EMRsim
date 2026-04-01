// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import CaseFilePanel from '$lib/components/CaseFilePanel.svelte';
import MyNotesPanel from '$lib/components/MyNotesPanel.svelte';

describe('Sidebar tab labels', () => {
  it('keeps note history terminology aligned with the rail and panel header', () => {
    render(MyNotesPanel, {
      notes: [],
      onContinueEditing: vi.fn(),
      onView: vi.fn(),
      onAmend: vi.fn(),
    });

    expect(screen.getByRole('heading', { name: 'Note History' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'My Notes' })).not.toBeInTheDocument();
  });

  it('keeps shared case file terminology aligned with the rail and panel header', () => {
    render(CaseFilePanel, {
      entries: [],
      onViewEntry: vi.fn(),
      onAmendNote: vi.fn(),
    });

    expect(screen.getByRole('heading', { name: 'Shared Case File' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Case File' })).not.toBeInTheDocument();
  });
});
