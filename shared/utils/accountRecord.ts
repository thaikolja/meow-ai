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
 * Shape of one username's saved modal fields and chat list.
 * The server stores this under `.data/accounts`. It is not the model catalog.
 */

import { DEFAULT_MAX_CONTEXT_MESSAGES } from './settingsDraft'

/**
 * Modal fields saved for one username.
 * `systemPrompt` is null when the shipped prompt is in use.
 * `modelId` is a catalog id, or empty when the configured default should be used.
 */
export type AccountSettings = {
  systemPrompt: string | null
  modelId: string
  maxContext: number
}

/**
 * One stored message. Photo bytes stay in the browser; only `imageId` is kept.
 */
export type AccountMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  imageId?: string
  timestamp: number
  model?: string
  providerId?: string
  isError?: boolean
}

/**
 * One stored thread. `model` and each message `model` are catalog ids.
 */
export type AccountChat = {
  id: string
  title: string
  messages: AccountMessage[]
  createdAt: number
  updatedAt: number
  providerId?: string
  model?: string
  slug?: string
}

/**
 * Settings and chats for the username inside the signed session.
 */
export type AccountRecord = {
  settings: AccountSettings
  chats: AccountChat[]
  /** True when this username already has a file. An empty file still wins over a browser cache. */
  stored?: boolean
}

/**
 * Settings used when a username has no saved file yet.
 */
export function emptyAccountSettings(): AccountSettings {
  return {
    systemPrompt: null,
    modelId:      '',
    maxContext:   DEFAULT_MAX_CONTEXT_MESSAGES
  }
}

/**
 * An account with default settings and no chats.
 */
export function emptyAccountRecord(): AccountRecord {
  return {
    settings: emptyAccountSettings(),
    chats:    []
  }
}

/**
 * Keeps a finite context window of at least zero. Anything else becomes 25.
 *
 * @param value - Candidate context size.
 */
function normalizeMaxContext(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_MAX_CONTEXT_MESSAGES
  }

  return Math.floor(parsed)
}

/**
 * Accepts a settings object from the client. A blank prompt is stored as null.
 *
 * @param value - Untrusted settings payload.
 */
export function normalizeAccountSettings(value: unknown): AccountSettings {
  const raw     = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const prompt  = typeof raw['systemPrompt'] === 'string' ? raw['systemPrompt'].trim() : ''
  const modelId = typeof raw['modelId'] === 'string' ? raw['modelId'].trim() : ''

  return {
    systemPrompt: prompt || null,
    modelId,
    maxContext:   normalizeMaxContext(raw['maxContext'])
  }
}

/**
 * Copies a message that has an id and a known role. Other values are dropped.
 *
 * @param value - Untrusted message.
 */
function normalizeMessage(value: unknown): AccountMessage | null {
  if (!value || typeof value !== 'object') return null
  const raw  = value as Record<string, unknown>
  const id   = typeof raw['id'] === 'string' ? raw['id'].trim() : ''
  const role = raw['role']
  if (!id || (role !== 'user' && role !== 'assistant' && role !== 'system')) return null

  const message: AccountMessage = {
    id,
    role,
    content:   typeof raw['content'] === 'string' ? raw['content'] : '',
    timestamp: typeof raw['timestamp'] === 'number' && Number.isFinite(raw['timestamp']) ? raw['timestamp'] : 0
  }

  if (typeof raw['imageId'] === 'string' && raw['imageId'].trim()) message.imageId = raw['imageId'].trim()
  if (typeof raw['model'] === 'string' && raw['model'].trim()) message.model = raw['model'].trim()
  if (typeof raw['providerId'] === 'string' && raw['providerId'].trim()) message.providerId = raw['providerId'].trim()
  if (typeof raw['isError'] === 'boolean') message.isError = raw['isError']

  return message
}

/**
 * Copies a chat that has an id. Slug and model id are kept when they are strings.
 *
 * @param value - Untrusted chat.
 */
function normalizeChat(value: unknown): AccountChat | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id  = typeof raw['id'] === 'string' ? raw['id'].trim() : ''
  if (!id) return null

  const messages = Array.isArray(raw['messages'])
      ? raw['messages'].map(normalizeMessage).filter((message): message is AccountMessage => message !== null)
      : []

  const chat: AccountChat = {
    id,
    title:     typeof raw['title'] === 'string' && raw['title'].trim() ? raw['title'] : 'New Meow 🐾',
    messages,
    createdAt: typeof raw['createdAt'] === 'number' && Number.isFinite(raw['createdAt']) ? raw['createdAt'] : 0,
    updatedAt: typeof raw['updatedAt'] === 'number' && Number.isFinite(raw['updatedAt']) ? raw['updatedAt'] : 0
  }

  if (typeof raw['providerId'] === 'string' && raw['providerId'].trim()) chat.providerId = raw['providerId'].trim()
  if (typeof raw['model'] === 'string' && raw['model'].trim()) chat.model = raw['model'].trim()
  if (typeof raw['slug'] === 'string' && raw['slug'].trim()) chat.slug = raw['slug'].trim()

  return chat
}

/**
 * Accepts a chat list from the client. Entries without an id are dropped.
 *
 * @param value - Untrusted chat list.
 */
export function normalizeAccountChats(value: unknown): AccountChat[] {
  if (!Array.isArray(value)) {
    throw new Error('Invalid chats')
  }

  return value.slice(0, 500).map(normalizeChat).filter((chat): chat is AccountChat => chat !== null)
}
