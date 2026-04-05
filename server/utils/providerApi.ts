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

export type ProviderKind = 'google' | 'openai'

export type ChatMessageInput = {
  role: string
  content: string
}

export type ProviderSecrets = {
  deepseekApiKey?: string
  groqApiKey?: string
  googleApiKey?: string
}

export type ProviderChatRequest = {
  kind: ProviderKind
  apiUrl: string
  headers: Record<string, string>
  body: Record<string, any>
}

function ensureUrl(baseUrl: string): URL {
  return new URL(baseUrl.trim())
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '')
}

function detectGoogleVersion(pathname: string): string {
  const match = pathname.match(/\/(v\d+(?:beta\d*|alpha\d*)?)(?:\/|$)/i)
  return match?.[1] || 'v1beta'
}

function getGoogleOriginAndVersion(baseUrl: string) {
  const url = ensureUrl(baseUrl)
  return {
    origin:  url.origin,
    version: detectGoogleVersion(url.pathname)
  }
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

export function isGoogleProvider(baseUrl: string): boolean {
  try {
    return ensureUrl(baseUrl).hostname==='generativelanguage.googleapis.com'
  } catch {
    return false
  }
}

function isDeepSeekProvider(baseUrl: string): boolean {
  try {
    return ensureUrl(baseUrl).hostname.includes('deepseek.com')
  } catch {
    return false
  }
}

function isGroqProvider(baseUrl: string): boolean {
  try {
    return ensureUrl(baseUrl).hostname.includes('groq.com')
  } catch {
    return false
  }
}

export function normalizeGoogleModel(model: string): string {
  return model.startsWith('models/') ? model: `models/${model}`
}

export function resolveProviderApiKey(params: {
  providerId?: string
  baseUrl: string
  clientApiKey?: string
  secrets: ProviderSecrets
}): string {
  const fallbackKey = params.clientApiKey?.trim() || ''

  if (params.providerId==='google-default') {
    return params.secrets.googleApiKey?.trim() || fallbackKey
  }

  if (params.providerId==='groq-default') {
    return params.secrets.groqApiKey?.trim() || fallbackKey
  }

  if (params.providerId==='deepseek-default') {
    return params.secrets.deepseekApiKey?.trim() || fallbackKey
  }

  if (!params.providerId) {
    if (isGoogleProvider(params.baseUrl)) {
      return params.secrets.googleApiKey?.trim() || fallbackKey
    }

    if (isGroqProvider(params.baseUrl)) {
      return params.secrets.groqApiKey?.trim() || fallbackKey
    }

    if (isDeepSeekProvider(params.baseUrl)) {
      return params.secrets.deepseekApiKey?.trim() || fallbackKey
    }
  }

  return fallbackKey
}

export function buildModelsRequest(baseUrl: string, apiKey: string): { kind: ProviderKind; apiUrl: string; headers: Record<string, string> } {
  if (isGoogleProvider(baseUrl)) {
    const { origin, version } = getGoogleOriginAndVersion(baseUrl)
    return {
      kind:    'google',
      apiUrl:  `${origin}/${version}/models?key=${encodeURIComponent(apiKey)}`,
      headers: {}
    }
  }

  const normalizedBaseUrl = normalizeOpenAIBaseUrl(baseUrl)
  return {
    kind:    'openai',
    apiUrl:  `${normalizedBaseUrl}/models`,
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  }
}

export function extractModelIds(kind: ProviderKind, payload: any): string[] {
  if (kind==='google') {
    return (payload.models || [])
    .filter((model: any) => {
      const methods = model.supportedGenerationMethods || []
      return methods.includes('generateContent') || methods.includes('streamGenerateContent')
    })
    .map((model: any) => model.name)
    .filter(Boolean)
    .sort()
  }

  return (payload.data || [])
  .map((model: any) => model.id)
  .filter(Boolean)
  .sort()
}

export function buildChatRequest(baseUrl: string, apiKey: string, model: string, messages: ChatMessageInput[]): ProviderChatRequest {
  if (isGoogleProvider(baseUrl)) {
    const { origin, version }   = getGoogleOriginAndVersion(baseUrl)
    const systemInstructionText = messages
    .filter(message => message.role==='system' && message.content.trim())
    .map(message => message.content.trim())
    .join('\n\n')

    const contents = messages
    .filter(message => (message.role==='user' || message.role==='assistant') && message.content.trim())
    .map(message => ({
      role:  message.role==='assistant' ? 'model': 'user',
      parts: [ { text: message.content } ]
    }))

    return {
      kind:    'google' as const,
      apiUrl:  `${origin}/${version}/${normalizeGoogleModel(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
      headers: {
        'Content-Type': 'application/json'
      },
      body:    {
        contents,
        ...(systemInstructionText
            ? {
              systemInstruction: {
                parts: [ { text: systemInstructionText } ]
              }
            }
            : {})
      }
    }
  }

  const normalizedBaseUrl = normalizeOpenAIBaseUrl(baseUrl)
  return {
    kind:    'openai' as const,
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

export function extractGoogleStreamText(payload: any): string {
  const candidate = payload?.candidates?.[0]
  const parts     = candidate?.content?.parts || []

  return parts
  .map((part: any) => part?.text || '')
  .join('')
}

