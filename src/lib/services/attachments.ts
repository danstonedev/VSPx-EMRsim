/**
 * Attachments service — IndexedDB-backed blob storage for file attachments.
 * Port of app/js/services/attachments.js.
 *
 * Stores binary blobs (images, PDFs, documents) in IndexedDB with metadata.
 * Case modules reference attachments by id; blobs live outside localStorage.
 */

// ─── Constants ───

const DB_NAME = 'pt-emr-sim';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

// ─── Types ───

export interface AttachmentMeta {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
}

export interface AttachmentRecord extends AttachmentMeta {
  blob: Blob;
}

export interface AttachmentResult {
  blob: Blob;
  name: string;
  mime: string;
  size: number;
}

export interface ObjectURLResult {
  url: string;
  name: string;
  mime: string;
}

// ─── Helpers ───

function hasIndexedDB(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest | void,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let req: IDBRequest | void;
        try {
          req = fn(store);
        } catch (e) {
          reject(e);
          return;
        }
        if (req && 'onsuccess' in req) {
          req.onsuccess = () => resolve(req!.result as T);
          req.onerror = () => reject(req!.error);
        } else {
          tx.oncomplete = () => resolve(true as T);
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        }
      }),
  );
}

function genId(): string {
  return 'att_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// ─── Public API ───

export const attachments = {
  /** Check if IndexedDB is available in the current environment. */
  isSupported: hasIndexedDB,

  /** Save a file or blob with metadata. Returns the metadata (no blob). */
  async save(fileOrBlob: File | Blob, name?: string, mime?: string): Promise<AttachmentMeta> {
    const blob = fileOrBlob instanceof Blob ? fileOrBlob : new Blob([fileOrBlob]);
    const record: AttachmentRecord = {
      id: genId(),
      name: name || (fileOrBlob instanceof File ? fileOrBlob.name : 'attachment'),
      mime: mime || blob.type || 'application/octet-stream',
      size: blob.size || 0,
      createdAt: Date.now(),
      blob,
    };
    await withStore('readwrite', (store) => store.put(record));
    return {
      id: record.id,
      name: record.name,
      mime: record.mime,
      size: record.size,
      createdAt: record.createdAt,
    };
  },

  /** Get an attachment by id. Returns blob + metadata, or null. */
  async get(id: string): Promise<AttachmentResult | null> {
    const rec = await withStore<AttachmentRecord | undefined>('readonly', (store) => store.get(id));
    if (!rec) return null;
    // Re-wrap blob defensively — some IDB implementations lose Blob identity via structuredClone
    const blob = rec.blob instanceof Blob ? rec.blob : new Blob([rec.blob], { type: rec.mime });
    return { blob, name: rec.name, mime: rec.mime, size: rec.size };
  },

  /** List all attachment metadata (without blobs). */
  async list(): Promise<AttachmentMeta[]> {
    const records = await withStore<AttachmentRecord[]>('readonly', (store) => store.getAll());
    return (records || []).map(({ id, name, mime, size, createdAt }) => ({
      id,
      name,
      mime,
      size,
      createdAt,
    }));
  },

  /** Delete an attachment by id. */
  async delete(id: string): Promise<boolean> {
    await withStore('readwrite', (store) => store.delete(id));
    return true;
  },

  /** Create an object URL for previewing/downloading. Caller must revoke. */
  async createObjectURL(id: string): Promise<ObjectURLResult | null> {
    const rec = await this.get(id);
    if (!rec) return null;
    const url = URL.createObjectURL(rec.blob);
    return { url, name: rec.name, mime: rec.mime };
  },
};

export default attachments;
