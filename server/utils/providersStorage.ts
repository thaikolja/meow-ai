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

/**
 * Server-side encrypted storage for provider API keys.
 * Keys are encrypted using AES-256-GCM with a key derived from the session secret.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join }                                               from 'node:path'
import { ensureDataDir }                           from './dataDir'

export type StoredProvider = {
  id: string
  name: string
  baseUrl: string
  encryptedApiKey: string
  iv: string
  authTag: string
  models: string[]
  isActive: boolean
  createdAt: number
}

type ProviderWithoutKey = {
  id: string
  name: string
  baseUrl: string
  models: string[]
  isActive: boolean
  createdAt: number
}

const ALGORITHM  = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH  = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest().slice(0, KEY_LENGTH)
}

function getStoragePath(): string {
  const dataDir = ensureDataDir(useRuntimeConfig().dataDir || process.env['NUXT_DATA_DIR'])
  return join(dataDir, 'providers.json')
}

function loadProvidersFile(): StoredProvider[] {
  const filePath = getStoragePath()
  if (!existsSync(filePath)) {
    return []
  }
  try {
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

function saveProvidersFile(providers: StoredProvider[]): void {
  const filePath = getStoragePath()
  writeFileSync(filePath, JSON.stringify(providers, null, 2))
}

export function encryptApiKey(apiKey: string, secret: string): { encrypted: string; iv: string; authTag: string } {
  const key = getEncryptionKey(secret)
  const iv  = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(apiKey, 'utf-8', 'base64url')
  encrypted += cipher.final('base64url')

  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('base64url'),
    authTag: authTag.toString('base64url')
  }
}

export function decryptApiKey(encrypted: string, iv: string, authTag: string, secret: string): string | null {
  try {
    const key      = getEncryptionKey(secret)
    const ivBuffer = Buffer.from(iv, 'base64url')
    const authTagBuffer = Buffer.from(authTag, 'base64url')

    const decipher = createDecipheriv(ALGORITHM, key, ivBuffer)
    decipher.setAuthTag(authTagBuffer)

    let decrypted = decipher.update(encrypted, 'base64url', 'utf-8')
    decrypted += decipher.final('utf-8')

    return decrypted
  } catch {
    return null
  }
}

export function getAllProviders(secret: string): ProviderWithoutKey[] {
  const providers = loadProvidersFile()
  return providers.map(({ encryptedApiKey, iv, authTag, ...rest }) => rest)
}

export function getProviderWithKey(id: string, secret: string): (ProviderWithoutKey & { apiKey: string }) | null {
  const providers = loadProvidersFile()
  const provider = providers.find(p => p.id===id)
  if (!provider) return null

  // Decrypt API key, but allow empty result (fallback to env vars for default providers)
  const apiKey = decryptApiKey(provider.encryptedApiKey, provider.iv, provider.authTag, secret) || ''

  const { encryptedApiKey, iv, authTag, ...rest } = provider
  return { ...rest, apiKey }
}

export function addProvider(
    data: { id: string; name: string; baseUrl: string; apiKey: string; models?: string[] },
    secret: string
): ProviderWithoutKey {
  const providers = loadProvidersFile()
  const { encrypted, iv, authTag } = encryptApiKey(data.apiKey, secret)

  const newProvider: StoredProvider = {
    id:        data.id,
    name:      data.name,
    baseUrl:   data.baseUrl,
    encryptedApiKey: encrypted,
    iv,
    authTag,
    models:    data.models || [],
    isActive:  true,
    createdAt: Date.now()
  }

  providers.push(newProvider)
  saveProvidersFile(providers)

  const { encryptedApiKey: _, iv: __, authTag: ___, ...result } = newProvider
  return result
}

export function updateProvider(
    id: string,
    data: Partial<{ name: string; baseUrl: string; apiKey: string; models: string[]; isActive: boolean }>,
    secret: string
): ProviderWithoutKey | null {
  const providers = loadProvidersFile()
  const index = providers.findIndex(p => p.id===id)
  if (index=== -1) return null

  const existing = providers[index]!
  const updates: Partial<StoredProvider> = {}

  if (data.name!==undefined) updates.name = data.name
  if (data.baseUrl!==undefined) updates.baseUrl = data.baseUrl
  if (data.models!==undefined) updates.models = data.models
  if (data.isActive!==undefined) updates.isActive = data.isActive

  if (data.apiKey) {
    const { encrypted, iv, authTag } = encryptApiKey(data.apiKey, secret)
    updates.encryptedApiKey = encrypted
    updates.iv              = iv
    updates.authTag         = authTag
  }

  providers[index] = { ...existing, ...updates } as StoredProvider
  saveProvidersFile(providers)

  const { encryptedApiKey, iv, authTag, ...result } = providers[index]!
  return result
}

export function deleteProvider(id: string): boolean {
  const providers = loadProvidersFile()
  const index = providers.findIndex(p => p.id===id)
  if (index=== -1) return false

  providers.splice(index, 1)
  saveProvidersFile(providers)
  return true
}

export function initializeDefaultProviders(secret: string): void {
  const providers = loadProvidersFile()

  // Only add defaults if storage is empty
  if (providers.length > 0) return

  const defaults = [
    {
      id:      'openrouter-default',
      name:    'OpenRouter',
      baseUrl: 'https://openrouter.ai/api',
      apiKey:  '',
      models:  [
        'google/gemini-3-flash-preview',
        'google/gemini-3.1-flash-lite-preview',
        'google/gemini-2.5-flash',
        'google/gemini-3.5-flash'
      ]
    },
    {
      id:     'deepseek-default',
      name:   'DeepSeek',
      baseUrl: 'https://api.deepseek.com',
      apiKey: '',
      models: [ 'deepseek-v4-flash', 'deepseek-v4-pro' ]
    },
    {
      id:      'opencode-default',
      name:    'OpenCode AI',
      baseUrl: 'https://opencode.ai/zen/go',
      apiKey:  '',
      models:  [
        'minimax-m2.5',
        'mimo-v2.5'
      ]
    }
  ]

  for (const def of defaults) {
    const { encrypted, iv, authTag } = encryptApiKey(def.apiKey, secret)
    providers.push({
      id:        def.id,
      name:      def.name,
      baseUrl:   def.baseUrl,
      encryptedApiKey: encrypted,
      iv,
      authTag,
      models:    def.models,
      isActive:  true,
      createdAt: Date.now()
    })
  }

  saveProvidersFile(providers)
}
