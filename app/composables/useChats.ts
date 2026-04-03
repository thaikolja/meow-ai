import type { Chat, ChatMessage } from '~/types'

const STORAGE_KEY = 'chat-yanawa-chats'

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11)
}

function loadChats(): Chat[] {
  if (import.meta.server) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveChats(chats: Chat[]) {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
}

export function useChats() {
  const chats = useState<Chat[]>('chats', () => [])
  const isLoaded = useState('chats-loaded', () => false)

  // Load from localStorage on client only
  if (import.meta.client && !isLoaded.value) {
    chats.value = loadChats()
    isLoaded.value = true
  }

  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  function createChat(providerId?: string, model?: string): Chat {
    const now = Date.now()
    const chat: Chat = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
      providerId,
      model
    }
    chats.value = [...chats.value, chat]
    saveChats(chats.value)
    return chat
  }

  function getChat(id: string): Chat | undefined {
    return chats.value.find(c => c.id === id)
  }

  function deleteChat(id: string) {
    chats.value = chats.value.filter(c => c.id !== id)
    saveChats(chats.value)
  }

  function renameChat(id: string, title: string) {
    const index = chats.value.findIndex(c => c.id === id)
    if (index !== -1) {
      const updated = { ...chats.value[index], title }
      chats.value = [...chats.value.slice(0, index), updated, ...chats.value.slice(index + 1)]
      saveChats(chats.value)
    }
  }

  function addMessage(chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex === -1) throw new Error(`Chat ${chatId} not found`)

    const msg: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now()
    }

    const chat = chats.value[chatIndex]
    const updatedChat = {
      ...chat,
      messages: [...chat.messages, msg],
      updatedAt: Date.now()
    }

    // Auto-title from first user message
    if (updatedChat.title === 'New Chat' && message.role === 'user') {
      updatedChat.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
    }

    chats.value = [
      ...chats.value.slice(0, chatIndex),
      updatedChat,
      ...chats.value.slice(chatIndex + 1)
    ]
    saveChats(chats.value)
    return msg
  }

  function updateMessage(chatId: string, messageId: string, content: string) {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex === -1) return

    const chat = chats.value[chatIndex]
    const msgIndex = chat.messages.findIndex(m => m.id === messageId)
    if (msgIndex === -1) return

    const updatedMessages = [...chat.messages]
    updatedMessages[msgIndex] = { ...updatedMessages[msgIndex], content }

    const updatedChat: Chat = { ...chat, messages: updatedMessages, updatedAt: Date.now() } as Chat
    chats.value = [
      ...chats.value.slice(0, chatIndex),
      updatedChat,
      ...chats.value.slice(chatIndex + 1)
    ]
    saveChats(chats.value)
  }

  function removeLastMessage(chatId: string) {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex === -1) return

    const chat = chats.value[chatIndex]
    if (!chat || chat.messages.length === 0) return

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
    saveChats(chats.value)
  }

  function updateChatModel(chatId: string, providerId: string, model: string) {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex !== -1) {
      const updatedChat: Chat = { ...chats.value[chatIndex], providerId, model } as Chat
      chats.value = [
        ...chats.value.slice(0, chatIndex),
        updatedChat,
        ...chats.value.slice(chatIndex + 1)
      ]
      saveChats(chats.value)
    }
  }

  function clearAllChats() {
    chats.value = []
    saveChats(chats.value)
  }

  function persist() {
    saveChats(chats.value)
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
