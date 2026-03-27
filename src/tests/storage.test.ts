import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '$lib/storage';

describe('storage adapter', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('stores and retrieves a value', () => {
    storage.setItem('key1', 'value1');
    expect(storage.getItem('key1')).toBe('value1');
  });

  it('returns null for missing keys', () => {
    expect(storage.getItem('nonexistent')).toBeNull();
  });

  it('removes items', () => {
    storage.setItem('key1', 'value1');
    storage.removeItem('key1');
    expect(storage.getItem('key1')).toBeNull();
  });

  it('clears all items', () => {
    storage.setItem('a', '1');
    storage.setItem('b', '2');
    storage.clear();
    expect(storage.getItem('a')).toBeNull();
    expect(storage.getItem('b')).toBeNull();
  });
});
