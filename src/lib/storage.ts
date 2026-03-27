/**
 * Storage adapter — wraps localStorage with memory fallback.
 * Ported from app/js/core/adapters/storageAdapter.js
 */

function createStorageAdapter(): Storage {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return localStorage;
  } catch {
    // Memory fallback for environments without localStorage
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
      get length() {
        return mem.size;
      },
      key: (i: number) => [...mem.keys()][i] ?? null,
    } as Storage;
  }
}

export const storage = createStorageAdapter();
