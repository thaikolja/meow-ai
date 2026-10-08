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
 * Checks provider base URLs and builds streaming chat-completion requests.
 * DeepSeek ids are sent to the official Chat Completions URL; other ids use an OpenAI-compatible `/v1` path.
 */

import { isIP } from 'node:net'
import type { UpstreamMessage } from '../../shared/utils/chatImage'

/**
 * One chat message accepted by the upstream request builders.
 */
export type ChatMessageInput = UpstreamMessage

/**
 * URL, headers, and JSON body for one upstream chat completion.
 */
export type ChatRequest = {
  apiUrl: string
  headers: Record<string, string>
  body: Record<string, any>
}

/**
 * Opt-in exceptions for `assertProviderBaseUrl`.
 * `allowPrivate` permits private and local hosts, including plain HTTP to those hosts.
 * `allowInsecureLocalhost` permits loopback hosts, including plain HTTP to loopback only.
 */
export type ProviderUrlValidationOptions = {
  allowPrivate?: boolean
  allowInsecureLocalhost?: boolean
}

/**
 * Parses a provider base URL. Surrounding whitespace is ignored.
 *
 * @param baseUrl - Candidate URL. An unparseable value throws.
 */
function ensureUrl(baseUrl: string): URL {
  return new URL(baseUrl.trim())
}

/**
 * True for `localhost`, `127.0.0.1`, and `::1`.
 *
 * @param hostname - Hostname already extracted from a URL.
 */
function isLoopbackHostname(hostname: string): boolean {
  return hostname==='localhost' || hostname==='127.0.0.1' || hostname==='::1'
}

/**
 * True for loopback, private, link-local, and carrier-grade NAT IPv4 addresses.
 *
 * @param hostname - Dotted IPv4 string.
 */
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

/**
 * True for `::1`, unique-local (`fc`/`fd`), and link-local (`fe80:`) IPv6 addresses.
 *
 * @param hostname - IPv6 hostname.
 */
function isPrivateIPv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return normalized==='::1'
      || normalized.startsWith('fc')
      || normalized.startsWith('fd')
      || normalized.startsWith('fe80:')
}

/**
 * True for loopback, private IP addresses, and `.local`, `.internal`, or `.localhost` names.
 *
 * @param hostname - Hostname from a provider URL.
 */
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

/**
 * Accepts an HTTPS provider base URL with no embedded credentials.
 * Private, loopback, link-local, carrier-grade NAT, and `.local`, `.internal`, or `.localhost` hosts are rejected unless `allowPrivate` is set. `allowInsecureLocalhost` permits loopback hosts, including plain HTTP.
 *
 * @param baseUrl - Candidate base URL. An unparseable value throws.
 * @param options - Private-host and insecure-loopback exceptions. Both default to off.
 * @returns Origin plus pathname, without a trailing slash. The query string and hash are dropped.
 */
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

/**
 * Removes trailing slashes.
 *
 * @param value - URL or path.
 */
function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '')
}

/**
 * Strips a trailing `/models…` or `/chat/completions` segment.
 * Appends `/v1` unless the path already ends in a version suffix.
 *
 * @param baseUrl - Provider base URL.
 */
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

/**
 * True for `deepseek-flash`, `deepseek-v4-flash`, `deepseek-v4-pro`, and any id whose trimmed lowercase form starts with `deepseek/`.
 *
 * @param modelId - Raw model id. Non-strings are false.
 * @returns Whether the chat route should call the official DeepSeek API.
 */
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
 * An id that contains `v4-pro` is sent as `deepseek-v4-pro`. Every other id, including retired Flash ids and OpenRouter slugs, is sent as `deepseek-flash`.
 *
 * @param modelId - Client model id. Matching is case-insensitive.
 * @returns `deepseek-v4-pro` or `deepseek-flash`.
 */
export function resolveDeepSeekModel(modelId: string): string {
  const id = modelId.trim().toLowerCase()
  if (id.includes('v4-pro')) return 'deepseek-v4-pro'
  return 'deepseek-flash'
}

/**
 * Builds a streaming OpenAI-compatible chat completion.
 * Strips a trailing `/models…` or `/chat/completions` segment, then appends `/v1` unless the path already ends in a version suffix.
 *
 * @param baseUrl - Provider base URL.
 * @param apiKey - Bearer token, sent unchanged.
 * @param model - Model id, sent unchanged.
 * @param messages - Messages placed on the JSON body.
 * @returns The completions URL, JSON headers, and a body with `stream: true`.
 */
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

/**
 * Builds a streaming request to `DEEPSEEK_CHAT_URL` with thinking disabled.
 * The model id is rewritten by `resolveDeepSeekModel`.
 *
 * @param apiKey - DeepSeek bearer token.
 * @param model - Client model id.
 * @param messages - Messages placed on the JSON body.
 * @returns The official completions URL, JSON headers, and a body with `stream: true`.
 */
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
