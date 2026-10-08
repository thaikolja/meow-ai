/*
 * Copyright (C) 2026 Kolja Nolte
 * https://meow.yanawa.io
 * info@meow.yanawa.io
 *
 * This work is licensed under the MIT License. You are free to use, modify,
 * and distribute this work, provided that you include the copyright notice
 * and this permission notice in all copies or substantial portions of the work.
 * For more information, visit: https://opensource.org/licenses/MIT
 *
 * @author    Kolja Nolte
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

/**
 * Page photos live in IndexedDB. The chat transcript in localStorage stores
 * only the id. The server never receives a file to keep.
 */

const DB_NAME    = 'meow-chat-images'
const STORE_NAME = 'images'
const DB_VERSION = 1

/**
 * One page photo in IndexedDB: its id, the chat and message it belongs to when known, the blob, and when it was saved.
 */
export type StoredChatImage = {
  id: string
  chatId: string | null
  messageId: string | null
  blob: Blob
  createdAt: number
}

/**
 * Creates an id for a new stored photo.
 * Uses `crypto.randomUUID` when the platform provides it, otherwise a random base-36 string plus the current time.
 *
 * @returns A new image id.
 */
export function createChatImageId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Writes a photo record, replacing any row with the same id.
 *
 * @param record - The image row to store.
 */
export async function putChatImage(record: StoredChatImage): Promise<void> {
  const db          = await openDb()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const done        = transactionDone(transaction, db)
  transaction.objectStore(STORE_NAME).put(record)
  await done
}

/**
 * Reads one photo by id.
 *
 * @param id - Stored image id.
 * @returns The record, or null when no row has that id.
 */
export async function getChatImage(id: string): Promise<StoredChatImage | null> {
  const db          = await openDb()
  const transaction = db.transaction(STORE_NAME, 'readonly')
  const done        = transactionDone(transaction, db)
  const record      = await requestResult(transaction.objectStore(STORE_NAME).get(id))
  await done
  return record || null
}

/**
 * Attaches an existing photo to a chat message.
 * Does nothing when that id is not stored.
 *
 * @param id - Stored image id.
 * @param chatId - Chat that owns the photo.
 * @param messageId - Message the photo belongs to.
 */
export async function bindChatImage(id: string, chatId: string, messageId: string): Promise<void> {
  const record = await getChatImage(id)
  if (!record) return
  await putChatImage({ ...record, chatId, messageId })
}

/**
 * Deletes one photo by id.
 *
 * @param id - Stored image id.
 */
export async function deleteChatImage(id: string): Promise<void> {
  const db          = await openDb()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const done        = transactionDone(transaction, db)
  transaction.objectStore(STORE_NAME).delete(id)
  await done
}

/**
 * Removes every photo that belongs to a chat. Matches the chat id stored on
 * the record and any image ids copied from the chat before it is discarded.
 * A full scan is used so a photo saved before it was tagged is still removed.
 */
export async function deleteImagesForChat(chatId: string, imageIds: readonly string[] = []): Promise<void> {
  const wanted        = new Set(imageIds.filter(id => id.trim()))
  const db            = await openDb()
  const transaction   = db.transaction(STORE_NAME, 'readwrite')
  const done          = transactionDone(transaction, db)
  const cursorRequest = transaction.objectStore(STORE_NAME).openCursor()

  await new Promise<void>((resolve, reject) => {
    cursorRequest.onerror   = () => reject(cursorRequest.error || new Error('This browser could not store that photo.'))
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result
      if (!cursor) {
        resolve()
        return
      }
      const record = cursor.value as StoredChatImage
      if (record.chatId === chatId || wanted.has(record.id)) {
        cursor.delete()
      }
      cursor.continue()
    }
  })

  await done
}

/**
 * Deletes every stored photo.
 */
export async function deleteAllChatImages(): Promise<void> {
  const db          = await openDb()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const done        = transactionDone(transaction, db)
  transaction.objectStore(STORE_NAME).clear()
  await done
}

/**
 * Reads a photo and encodes its bytes as a JPEG data URL.
 *
 * @param id - Stored image id.
 * @returns The `data:image/jpeg;base64,...` URL, or null when the row or its blob is missing.
 */
export async function readChatImageDataUrl(id: string): Promise<string | null> {
  const record = await getChatImage(id)
  if (!record?.blob) return null
  const bytes     = new Uint8Array(await record.blob.arrayBuffer())
  let binary      = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return `data:image/jpeg;base64,${btoa(binary)}`
}

/**
 * Opens the `meow-chat-images` database and creates the `images` store on first use.
 *
 * @returns The open database. The caller closes it when the transaction finishes.
 */
function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('This browser could not store that photo.'))
  }

  return new Promise((resolve, reject) => {
    const request           = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('chatId', 'chatId', { unique: false })
      }
    }
    request.onsuccess       = () => resolve(request.result)
    request.onerror         = () => reject(request.error || new Error('This browser could not store that photo.'))
  })
}

/**
 * Waits for one IndexedDB request.
 *
 * @param request - Request from an object store.
 * @returns The request result.
 */
function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror   = () => reject(request.error || new Error('This browser could not store that photo.'))
  })
}

/**
 * Resolves when the transaction completes, then closes the database.
 *
 * @param transaction - Open read or write transaction.
 * @param db - Database to close after completion.
 */
function transactionDone(transaction: IDBTransaction, db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror    = () => reject(transaction.error || new Error('This browser could not store that photo.'))
    transaction.onabort    = () => reject(transaction.error || new Error('This browser could not store that photo.'))
  })
}
