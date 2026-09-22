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

import { isIP } from 'node:net'

export type ChatMessageInput = {
  role: string
  content: string
}

export type ChatRequest = {
  apiUrl: string
  headers: Record<string, string>
  body: Record<string, any>
}

export type ProviderUrlValidationOptions = {
  allowPrivate?: boolean
  allowInsecureLocalhost?: boolean
}

function ensureUrl(baseUrl: string): URL {
  return new URL(baseUrl.trim())
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname==='localhost' || hostname==='127.0.0.1' || hostname==='::1'
}

function isPrivateIPv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number)
  if (octets.length!==4 || octets.some(Number.isNaN)) {
    return false
  }

  const [ first = 0, second = 0 ] = octets

  return first===10
      || first===127
      || (first===169 && second===254)
      || (first===172 && second >= 16 && second <= 31)
      || (first===192 && second===168)
      || (first===100 && second >= 64 && second <= 127)
}

function isPrivateIPv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return normalized==='::1'
      || normalized.startsWith('fc')
      || normalized.startsWith('fd')
      || normalized.startsWith('fe80:')
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase()

  if (isLoopbackHostname(normalized)) {
    return true
  }

  const ipVersion = isIP(normalized)
  if (ipVersion===4) {
    return isPrivateIPv4(normalized)
  }

  if (ipVersion===6) {
    return isPrivateIPv6(normalized)
  }

  return normalized.endsWith('.local')
      || normalized.endsWith('.internal')
      || normalized.endsWith('.localhost')
}

export function assertProviderBaseUrl(baseUrl: string, options: ProviderUrlValidationOptions = {}): string {
  const url                    = ensureUrl(baseUrl)
  const allowPrivate           = options.allowPrivate===true
  const allowInsecureLocalhost = options.allowInsecureLocalhost===true
  const isLoopback             = isLoopbackHostname(url.hostname.toLowerCase())

  if (url.username || url.password) {
    throw new Error('Provider URLs must not include embedded credentials')
  }

  const isLocalOrPrivate = isPrivateHostname(url.hostname)

  if (url.protocol!=='https:') {
    const isAllowedLocalHttp = url.protocol==='http:' && ((allowPrivate && isLocalOrPrivate) || (allowInsecureLocalhost && isLoopback))

    if (!isAllowedLocalHttp) {
      throw new Error('Provider URLs must use HTTPS unless explicit local/private access is enabled')
    }
  }

  if (isLocalOrPrivate && !(allowPrivate || (allowInsecureLocalhost && isLoopback))) {
    throw new Error('Private or local provider URLs are disabled in this deployment')
  }

  return `${url.origin}${url.pathname}`.replace(/\/+$/, '')
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '')
}

function normalizeOpenAIBaseUrl(baseUrl: string): string {
  const normalized = trimTrailingSlashes(baseUrl)
  .replace(/\/models(?:\/.*)?$/i, '')
  .replace(/\/chat\/completions$/i, '')

  if (/\/v\d+(?:beta\d*|alpha\d*)?$/i.test(normalized)) {
    return normalized
  }

  return `${normalized}/v1`
}

/** Official DeepSeek Chat Completions URL. It does not use an OpenAI `/v1` prefix. */
export const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/chat/completions'

export function isDeepSeekModel(modelId: unknown): boolean {
  if (typeof modelId !== 'string') return false
  const id = modelId.trim().toLowerCase()
  return id === 'deepseek-flash'
      || id === 'deepseek-v4-flash'
      || id === 'deepseek-v4-pro'
      || id.startsWith('deepseek/')
}

/**
 * DeepSeek's docs name the current Flash model `deepseek-flash`.
 * Retired ids and OpenRouter slugs are sent as that official name.
 */
export function resolveDeepSeekModel(modelId: string): string {
  const id = modelId.trim().toLowerCase()
  if (id.includes('v4-pro')) return 'deepseek-v4-pro'
  return 'deepseek-flash'
}

export function buildChatRequest(baseUrl: string, apiKey: string, model: string, messages: ChatMessageInput[]): ChatRequest {
  const normalizedBaseUrl = normalizeOpenAIBaseUrl(baseUrl)
  return {
    apiUrl:  `${normalizedBaseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${apiKey}`
    },
    body:    {
      model,
      messages,
      stream: true
    }
  }
}

export function buildDeepSeekRequest(apiKey: string, model: string, messages: ChatMessageInput[]): ChatRequest {
  return {
    apiUrl:  DEEPSEEK_CHAT_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${apiKey}`
    },
    body:    {
      model:  resolveDeepSeekModel(model),
      messages,
      stream: true,
      // Thinking is on by default and streams as reasoning_content, which this app does not render.
      thinking: { type: 'disabled' }
    }
  }
}
