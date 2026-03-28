/**
 * Tests for attachments service — IndexedDB blob storage.
 * Uses fake-indexeddb to provide IndexedDB in jsdom.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { attachments } from '$lib/services/attachments';

describe('attachments service', () => {
  beforeEach(async () => {
    // Clear all attachments before each test
    const all = await attachments.list();
    for (const a of all) {
      await attachments.delete(a.id);
    }
  });

  it('isSupported returns true in jsdom', () => {
    expect(attachments.isSupported()).toBe(true);
  });

  it('saves a blob and returns metadata', async () => {
    const blob = new Blob(['hello world'], { type: 'text/plain' });
    const meta = await attachments.save(blob, 'test.txt', 'text/plain');

    expect(meta.id).toMatch(/^att_/);
    expect(meta.name).toBe('test.txt');
    expect(meta.mime).toBe('text/plain');
    expect(meta.size).toBe(blob.size);
    expect(meta.createdAt).toBeGreaterThan(0);
  });

  it('retrieves a saved attachment by id', async () => {
    const blob = new Blob(['attachment content'], { type: 'text/plain' });
    const meta = await attachments.save(blob, 'doc.txt');

    const result = await attachments.get(meta.id);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('doc.txt');
    expect(result!.mime).toBe('text/plain');
    expect(result!.size).toBe(blob.size);
    // Result blob is a Blob instance (re-wrapped if needed by IDB round-trip)
    expect(result!.blob).toBeInstanceOf(Blob);
  });

  it('returns null for missing id', async () => {
    const result = await attachments.get('nonexistent');
    expect(result).toBeNull();
  });

  it('lists all attachment metadata', async () => {
    await attachments.save(new Blob(['a']), 'a.txt');
    await attachments.save(new Blob(['b']), 'b.txt');

    const list = await attachments.list();
    expect(list).toHaveLength(2);
    expect(list.every((m) => m.id.startsWith('att_'))).toBe(true);
    // List should not include blob data
    expect((list[0] as unknown as Record<string, unknown>).blob).toBeUndefined();
  });

  it('deletes an attachment', async () => {
    const meta = await attachments.save(new Blob(['delete me']), 'temp.txt');
    expect(await attachments.get(meta.id)).not.toBeNull();

    const deleted = await attachments.delete(meta.id);
    expect(deleted).toBe(true);
    expect(await attachments.get(meta.id)).toBeNull();
  });

  it('creates an object URL', async () => {
    const meta = await attachments.save(new Blob(['preview']), 'preview.txt');
    const result = await attachments.createObjectURL(meta.id);

    expect(result).not.toBeNull();
    expect(result!.url).toMatch(/^blob:/);
    expect(result!.name).toBe('preview.txt');

    // Clean up
    URL.revokeObjectURL(result!.url);
  });

  it('createObjectURL returns null for missing id', async () => {
    const result = await attachments.createObjectURL('nonexistent');
    expect(result).toBeNull();
  });

  it('uses File name when no name provided', async () => {
    const file = new File(['content'], 'uploaded.pdf', { type: 'application/pdf' });
    const meta = await attachments.save(file);

    expect(meta.name).toBe('uploaded.pdf');
    expect(meta.mime).toBe('application/pdf');
  });
});
