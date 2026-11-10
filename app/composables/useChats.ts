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
 * Chat threads for the signed-in username.
 * Edits are written to the server account and cached in `localStorage` under `chat-yanawa-chats`.
 * Creates and edits threads and messages, stores a public slug, and deletes saved photos when a chat is removed.
 */

import type { AccountChat }                                                                      from '#shared/utils/accountRecord'
import type { Chat, ChatMessage } from '~/types'
import { canPushAccountWrite, isAccountPushSuppressed, noteAccountMutation, withoutAccountPush } from '~/utils/accountSyncGate'
import { deleteAllChatImages, deleteImagesForChat } from '~/utils/chatImageStore'

/** Local storage key for chat persistence */
const STORAGE_KEY         = 'chat-yanawa-chats'
const PERSIST_THROTTLE_MS = 250

let persistTimer: ReturnType<typeof setTimeout> | null = null
/** True after the signed session is known. Server writes wait for this. */
let accountAuthenticated = false

/**
 * Generates a non-cryptographic short unique identifier.
 * Used for chat IDs and message IDs.
 * @returns The string this function produces.
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11)
}

/**
 * Reads the browser chat cache. The server record wins once a username has saved chats.
 * @returns The result (Chat[]).
 */
function readCachedChats(): Chat[] {
  if (import.meta.server) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as Chat[] : []
  } catch {
    return []
  }
}

/**
 * Persists the current chat array in the browser cache and, when signed in, on the server.
 * Skips the server write during hydration and during SSR.
 * @param chats - Chat list to persist.
 */
function saveChats(chats: Chat[]) {
  if (import.meta.server) return
  if (!canPushAccountWrite(accountAuthenticated, isAccountPushSuppressed())) return

  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  noteAccountMutation()
  void $fetch('/api/account', {
    method: 'PUT',
    body:   { chats }
  }).catch(() => undefined)
}

/**
 * Writes the chat list after a short quiet period so rapid edits share one save.
 *
 * @param chats - Chat list to persist.
 */
function scheduleSaveChats(chats: Chat[]) {
  if (import.meta.server) return

  if (persistTimer) {
    clearTimeout(persistTimer)
  }

  persistTimer = setTimeout(() => {
    saveChats(chats)
    persistTimer = null
  }, PERSIST_THROTTLE_MS)
}

/**
 * Cancels a pending save and writes the chat list immediately.
 *
 * @param chats - Chat list to persist.
 */
function flushSaveChats(chats: Chat[]) {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }

  saveChats(chats)
}

/**
 * Main composable for managing chat state, history, and persistence.
 * Provides CRUD operations for both chat threads and individual messages.
 */
export function useChats() {
  /** Reactive state holding all chat threads */
  const chats = useState<Chat[]>('chats', () => [])
  /** Flag to track if the composable has been set up on this client */
  const isLoaded = useState('chats-loaded', () => false)
  const { authState } = useAuthSession()

  watch(() => authState.value.authenticated, (authenticated) => {
    accountAuthenticated = authenticated
  }, { immediate: true })

  // The server account replaces this list after login. Do not read another user's cache first.
  if (import.meta.client && !isLoaded.value) {
    isLoaded.value = true
  }

  /**
   * Replaces the thread list from the server. Does not write it back.
   *
   * @param next - Chats stored for the signed-in username.
   */
  function applyRemoteChats(next: AccountChat[]) {
    withoutAccountPush(() => {
      chats.value = next as Chat[]
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.value))
      }
    })
  }

  /**
   * Drops the in-memory threads on logout without deleting the server copy.
   */
  function clearMemory() {
    withoutAccountPush(() => {
      chats.value = []
    })
  }

  /** Gets all chats sorted by their most recent activity timestamp */
  const sortedChats = computed(() => {
    return [ ...chats.value ].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  /**
   * Initializes a new chat session.
   * @param providerId - Optional default provider for the new chat
   * @param model - Optional default model for the new chat
   * @returns The result (Chat).
   */
  function createChat(providerId?: string, model?: string): Chat {
    const now        = Date.now()
    const chat: Chat = {
      id:       generateId(),
      title:    'New Meow 🐾',
      messages: [],
      createdAt: now,
      updatedAt: now,
      providerId,
      model
    }
    chats.value      = [ ...chats.value, chat ]
    flushSaveChats(chats.value)
    return chat
  }

  /**
   * Finds a chat by its stored id or its public slug.
   *
   * @param key - Stored chat id or public slug.
   * @returns The number this function produces.
   */
  function findChatIndex(key: string): number {
    return chats.value.findIndex(chat => chat.id === key || chat.slug === key)
  }

  /**
   * Retrieves a chat thread by its ID or public slug
   *
   * @param key - Stored chat id or public slug.
   * @returns The result (Chat|undefined).
   */
  function getChat(key: string): Chat | undefined {
    const index = findChatIndex(key)
    return index === -1 ? undefined : chats.value[index]
  }

  /**
   * Removes a chat thread, its saved photos, and updates persistence.
   *
   * @param id - Stored id, or a public slug when this call accepts either.
   */
  async function deleteChat(id: string) {
    const existing = chats.value.find(chat => chat.id === id || chat.slug === id)
    if (!existing) return

    const imageIds = existing.messages.flatMap(message => message.imageId ? [ message.imageId ] : [])
    if (import.meta.client) {
      await deleteImagesForChat(existing.id, imageIds)
    }

    chats.value = chats.value.filter(chat => chat.id !== existing.id)
    flushSaveChats(chats.value)
  }

  /**
   * Remembers which model this chat should use from now on.
   * Does not touch the global default, and does not reorder the sidebar.
   * @param id - Stored id, or a public slug when this call accepts either.
   * @param model - Catalog id to store or send.
   */
  function setChatModel(id: string, model: string) {
    const nextModel = model.trim()
    if (!nextModel) return

    const index = findChatIndex(id)
    if (index === -1 || !chats.value[index]) return
    if (chats.value[index]?.model === nextModel) return

    const updated = { ...chats.value[index] as Chat, model: nextModel }
    chats.value   = [ ...chats.value.slice(0, index), updated, ...chats.value.slice(index + 1) ]
    flushSaveChats(chats.value)
  }

  /**
   * Updates the human-readable title of a specific chat thread
   *
   * @param id - Stored id, or a public slug when this call accepts either.
   * @param title - Replacement chat title.
   */
  function renameChat(id: string, title: string) {
    const index = findChatIndex(id)
    if (index!== -1 && chats.value[index]) {
      const updated = { ...chats.value[index] as Chat, title }
      chats.value = [ ...chats.value.slice(0, index), updated, ...chats.value.slice(index + 1) ]
      flushSaveChats(chats.value)
    }
  }

  /**
   * Adds a new message to an existing chat thread.
   * Automatically generates a title from the first user message if still using default.
   * @param chatId - Stored id of the chat to change.
   * @param message - Message fields, without an id or timestamp.
   * @returns The result (ChatMessage).
   */
  function addMessage(chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const chatIndex = findChatIndex(chatId)
    if (chatIndex=== -1) throw new Error(`Chat ${chatId} not found`)

    const msg: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now()
    }

    const chat = chats.value[chatIndex]
    if (!chat) throw new Error(`Chat ${chatId} not found at index ${chatIndex}`)
    const updatedChat = {
      ...chat,
      messages: [ ...chat.messages, msg ],
      updatedAt: Date.now()
    }

    // Auto-generate a descriptive title from the initial user input
    if (updatedChat && (updatedChat.title==='New Meow 🐾' || updatedChat.title==='') && message.role==='user') {
      const source = message.content.trim() || (message.imageId ? 'Photo' : '')
      if (source) {
        updatedChat.title = source.substring(0, 50) + (source.length > 50 ? '...' : '')
      }
    }

    chats.value = [
      ...chats.value.slice(0, chatIndex),
      updatedChat as Chat,
      ...chats.value.slice(chatIndex + 1)
    ] as Chat[]
    flushSaveChats(chats.value)
    return msg
  }

  /**
   * Updates the content or error status of an existing message.
   * Typically used during streaming to append raw text.
   * @param chatId - Stored id of the chat to change.
   * @param messageId - Stored id of the message to change.
   * @param content - Replacement message text.
   * @param isError - When set, replaces the message error flag.
   */
  function updateMessage(chatId: string, messageId: string, content: string, isError?: boolean) {
    const chatIndex = findChatIndex(chatId)
    if (chatIndex=== -1) return

    const chat = chats.value[chatIndex]
    if (!chat) return
    const msgIndex = chat.messages.findIndex(m => m.id===messageId)
    if (msgIndex=== -1) return

    const updatedMessages     = [ ...chat.messages ]
    updatedMessages[msgIndex] = {
      ...updatedMessages[msgIndex] as ChatMessage,
      content,
      isError: isError!==undefined ? isError: updatedMessages[msgIndex]?.isError
    }

    const updatedChat: Chat = { ...chat, messages: updatedMessages, updatedAt: Date.now() } as Chat
    chats.value = [
      ...chats.value.slice(0, chatIndex),
      updatedChat,
      ...chats.value.slice(chatIndex + 1)
    ] as Chat[]
    scheduleSaveChats(chats.value)
  }

  /**
   * Specifically used to rollback the last response for regeneration.
   * @param chatId - Stored id of the chat to change.
   */
  function removeLastMessage(chatId: string) {
    const chatIndex = findChatIndex(chatId)
    if (chatIndex=== -1) return

    const chat = chats.value[chatIndex]
    if (!chat || chat.messages.length===0) return

    const updatedChat: Chat = {
      ...chat,
      messages: chat.messages.slice(0, -1),
      updatedAt: Date.now()
    } as Chat

    chats.value = [
      ...chats.value.slice(0, chatIndex),
      updatedChat,
      ...chats.value.slice(chatIndex + 1)
    ]
    flushSaveChats(chats.value)
  }

  /** Wipes all chat history and every saved photo from the browser. */
  async function clearAllChats() {
    if (import.meta.client) {
      await deleteAllChatImages()
    }
    chats.value = []
    flushSaveChats(chats.value)
  }

  /**
   * Stores the public address for a chat. Rejects a slug another chat already uses.
   * Does not reorder the sidebar.
   * @param id - Stored id, or a public slug when this call accepts either.
   * @param slug - Public cat-sentence address.
   * @returns `true` when the check passes.
   */
  function setChatSlug(id: string, slug: string): boolean {
    const nextSlug = slug.trim()
    if (!nextSlug) return false

    const index = chats.value.findIndex(chat => chat.id === id)
    if (index === -1 || !chats.value[index]) return false
    if (chats.value.some(chat => chat.id !== id && (chat.slug === nextSlug || chat.id === nextSlug))) return false
    if (chats.value[index]?.slug === nextSlug) return true

    const updated = { ...chats.value[index] as Chat, slug: nextSlug }
    chats.value   = [ ...chats.value.slice(0, index), updated, ...chats.value.slice(index + 1) ]
    flushSaveChats(chats.value)
    return true
  }

  /** Manual trigger to force-sync state to localStorage */
  function persist() {
    flushSaveChats(chats.value)
  }

  return {
    chats,
    sortedChats,
    createChat,
    getChat,
    deleteChat,
    setChatModel,
    setChatSlug,
    renameChat,
    addMessage,
    updateMessage,
    removeLastMessage,
    clearAllChats,
    persist,
    applyRemoteChats,
    readCachedChats,
    clearMemory
  }
}
