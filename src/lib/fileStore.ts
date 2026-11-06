// Stores uploaded files (documents, signed contracts, photos) in the browser's
// IndexedDB. localStorage is too small (about 5 MB) for files.
import { StoredFile } from './hrTypes';

const DB = 'agencyos_files';
const STORE = 'files';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const MAX_FILE_MB = 10;

export async function saveFile(file: File): Promise<StoredFile> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`File is larger than ${MAX_FILE_MB} MB`);
  const db = await open();
  const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, fileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return { fileId, fileName: file.name, mimeType: file.type || 'application/octet-stream', size: file.size };
}

export async function getFile(fileId: string): Promise<Blob | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(fileId);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function openStoredFile(f: StoredFile) {
  const blob = await getFile(f.fileId);
  if (!blob) { alert('File not found in this browser. Files are stored on the computer where they were uploaded.'); return; }
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
