/** 克隆音色音频 Blob → IndexedDB（PRD：不调外链） */

const DB_NAME = 'zhihuiben-voice-db'
const STORE = 'voice-blobs'
const VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

export async function putVoiceBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('indexedDB write failed'))
      tx.onabort = () => reject(new Error('indexedDB transaction aborted'))
      tx.objectStore(STORE).put(blob, id)
    })
  } finally {
    db.close()
  }
}

export async function getVoiceBlob(id: string): Promise<Blob | undefined> {
  const db = await openDb()
  try {
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const rq = tx.objectStore(STORE).get(id)
      rq.onsuccess = () => resolve(rq.result as Blob | undefined)
      rq.onerror = () => reject(rq.error ?? new Error('indexedDB read failed'))
    })
  } finally {
    db.close()
  }
}
