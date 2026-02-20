// attachments.js - IndexedDB-backed storage for artifact attachments (images, documents)
// Pure frontend; stores blobs in IDB and references (ids + metadata) in case modules

const DB_NAME = 'pt-emr-sim';
const DB_VERSION = 1;
const STORE = 'attachments';

function hasIndexedDB() {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    /* safe fallback */
  }
  return false;
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let req;
    try {
      req = fn(store);
    } catch (e) {
      reject(e);
      return;
    }
    // If the callback returned a request, resolve with its result; otherwise resolve on tx complete
    if (req && typeof req.onsuccess !== 'undefined') {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }
  });
}

function genId() {
  return 'att_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export const attachments = {
  isSupported: hasIndexedDB,
  async save(fileOrBlob, name, mime) {
    const blob = fileOrBlob instanceof Blob ? fileOrBlob : new Blob([fileOrBlob]);
    const record = {
      id: genId(),
      name: name || (fileOrBlob && fileOrBlob.name) || 'attachment',
      mime: mime || blob.type || 'application/octet-stream',
      size: blob.size || 0,
      createdAt: Date.now(),
      blob,
    };
    await withStore('readwrite', (store) => store.put(record));
    return { id: record.id, name: record.name, mime: record.mime, size: record.size };
  },
  async get(id) {
    const rec = await withStore('readonly', (store) => store.get(id));
    if (!rec) return null;
    return { blob: rec.blob, name: rec.name, mime: rec.mime, size: rec.size };
  },
  async delete(id) {
    await withStore('readwrite', (store) => store.delete(id));
    return true;
  },
  async createObjectURL(id) {
    const rec = await this.get(id);
    if (!rec) return null;
    const url = URL.createObjectURL(rec.blob);
    return { url, name: rec.name, mime: rec.mime };
  },
};

export default attachments;
