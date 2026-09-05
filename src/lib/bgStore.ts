// Local, per-device store for user-uploaded background images. Images can be a
// few MB each — too large for localStorage — so they live in IndexedDB. Nothing
// here touches the server: custom backgrounds are a personal convenience and do
// not sync across devices.

const DB_NAME = 'chess-bg'
const STORE = 'custom-backgrounds'
const MAX_BYTES = 4 * 1024 * 1024

export interface CustomBackground {
  id: string
  blob: Blob
  name: string
  createdAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

export function isAllowedImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'That file is not an image.'
  if (file.size > MAX_BYTES) return 'Image is larger than 4 MB.'
  return null
}

export async function addCustomBackground(file: File): Promise<CustomBackground> {
  const record: CustomBackground = {
    id: crypto.randomUUID(),
    blob: file,
    name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Image',
    createdAt: Date.now(),
  }
  await tx('readwrite', store => store.put(record))
  return record
}

export function listCustomBackgrounds(): Promise<CustomBackground[]> {
  return tx<CustomBackground[]>('readonly', store => store.getAll() as IDBRequest<CustomBackground[]>).then(rows =>
    rows.sort((a, b) => b.createdAt - a.createdAt),
  )
}

export function getCustomBackground(id: string): Promise<CustomBackground | undefined> {
  return tx<CustomBackground | undefined>('readonly', store => store.get(id) as IDBRequest<CustomBackground | undefined>)
}

export function deleteCustomBackground(id: string): Promise<void> {
  return tx('readwrite', store => store.delete(id)).then(() => undefined)
}
