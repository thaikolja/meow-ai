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
 * @email     kolja.nolte@gmail.com
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

import type { Chat, ChatMessage } from '~/types'

/** Local storage key for chat persistence */
const STORAGE_KEY         = 'chat-yanawa-chats'
const PERSIST_THROTTLE_MS = 250

let persistTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Generates a non-cryptographic short unique identifier.
 * Used for chat IDs and message IDs.
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11)
}

/**
 * Retrieves the stored chat history from the browser's localStorage.
 * Returns an empty array if running on server or if storage is empty.
 */
function loadChats(): Chat[] {
  if (import.meta.server) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw): []
  } catch {
    return []
  }
}

/**
 * Persists the current chat array into the browser's localStorage.
 * Skips operations during SSR.
 */
function saveChats(chats: Chat[]) {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
}

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
  /** Flag to track if initial load from storage has occurred */
  const isLoaded = useState('chats-loaded', () => false)

  // Hydrate state from localStorage on the first client-side execution
  if (import.meta.client && !isLoaded.value) {
    chats.value = loadChats()
    isLoaded.value = true
  }

  /** Gets all chats sorted by their most recent activity timestamp */
  const sortedChats = computed(() => {
    return [ ...chats.value ].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  /**
   * Initializes a new chat session.
   * @param providerId - Optional default provider for the new chat
   * @param model - Optional default model for the new chat
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

  /** Retrieves a chat thread by its ID */
  function getChat(id: string): Chat | undefined {
    return chats.value.find(c => c.id===id)
  }

  /** Removes a chat thread and updates persistence */
  function deleteChat(id: string) {
    chats.value = chats.value.filter(c => c.id!==id)
    flushSaveChats(chats.value)
  }

  /** Updates the human-readable title of a specific chat thread */
  function renameChat(id: string, title: string) {
    const index = chats.value.findIndex(c => c.id===id)
    if (index!== -1 && chats.value[index]) {
      const updated = { ...chats.value[index] as Chat, title }
      chats.value = [ ...chats.value.slice(0, index), updated, ...chats.value.slice(index + 1) ]
      flushSaveChats(chats.value)
    }
  }

  /**
   * Adds a new message to an existing chat thread.
   * Automatically generates a title from the first user message if still using default.
   */
  function addMessage(chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const chatIndex = chats.value.findIndex(c => c.id===chatId)
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
      updatedChat.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...': '')
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
   */
  function updateMessage(chatId: string, messageId: string, content: string, isError?: boolean) {
    const chatIndex = chats.value.findIndex(c => c.id===chatId)
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
   */
  function removeLastMessage(chatId: string) {
    const chatIndex = chats.value.findIndex(c => c.id===chatId)
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

  /** Switches the AI model configuration for a specific chat */
  function updateChatModel(chatId: string, providerId: string, model: string) {
    const chatIndex = chats.value.findIndex(c => c.id===chatId)
    if (chatIndex!== -1 && chats.value[chatIndex]) {
      const updatedChat: Chat = { ...chats.value[chatIndex] as Chat, providerId, model } as Chat
      chats.value = [
        ...chats.value.slice(0, chatIndex),
        updatedChat,
        ...chats.value.slice(chatIndex + 1)
      ] as Chat[]
      flushSaveChats(chats.value)
    }
  }

  /** Wipes all chat history from memory and storage */
  function clearAllChats() {
    chats.value = []
    flushSaveChats(chats.value)
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
    renameChat,
    addMessage,
    updateMessage,
    removeLastMessage,
    updateChatModel,
    clearAllChats,
    persist
  }
}
