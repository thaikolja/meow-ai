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
 * Asks Gemini 3.5 Flash Lite for one short cat sentence and returns it as a
 * URL slug. The chat itself keeps using whatever model the session selected.
 */
import { requireAuthenticatedSession } from '../utils/authSession'
import { assertProviderBaseUrl }       from '../utils/providerApi'
import { validateCsrf }                from '../utils/csrf'
import { stripThinkBlocks }            from '#shared/utils/models'
import {
  CHAT_SLUG_MODEL,
  buildChatSlugPrompt,
  fallbackChatSlug,
  normalizeChatSlug
}                                      from '#shared/utils/chatSlug'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api'

function readMessageContent(payload: unknown): string {
  const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> })
      ?.choices?.[0]?.message?.content

  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
  .map(part => {
    if (typeof part === 'string') return part
    if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') return part.text
    return ''
  })
  .join(' ')
}

function avoidList(body: unknown): string[] {
  const raw = (body as { avoid?: unknown })?.avoid
  if (!Array.isArray(raw)) return []

  const slugs: string[] = []
  for (const entry of raw) {
    if (typeof entry !== 'string') continue
    const slug = normalizeChatSlug(entry.replace(/-/g, ' '))
    if (!slug || slugs.includes(slug)) continue
    slugs.push(slug)
    if (slugs.length >= 20) break
  }
  return slugs
}

export default defineEventHandler(async (event) => {
  validateCsrf(event)
  requireAuthenticatedSession(event)

  const runtimeConfig    = useRuntimeConfig(event)
  const openrouterApiKey = runtimeConfig.openrouterApiKey?.trim() || ''
  const body             = await readBody(event)
  const avoid            = avoidList(body)

  if (!openrouterApiKey) {
    return { slug: fallbackChatSlug(avoid) }
  }

  const baseUrl = assertProviderBaseUrl(OPENROUTER_BASE_URL, {
    allowPrivate:           runtimeConfig.allowPrivateProviderUrls,
    allowInsecureLocalhost: import.meta.dev
  })

  let response: Response
  try {
    response = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${openrouterApiKey}`
      },
      body:    JSON.stringify({
        model:       CHAT_SLUG_MODEL,
        messages:    [ { role: 'user', content: buildChatSlugPrompt(avoid) } ],
        stream:      false,
        max_tokens:  200,
        temperature: 0.9,
        // This model rejects effort "none". "minimal" still returns the sentence.
        reasoning: { effort: 'minimal' }
      }),
      signal:  AbortSignal.timeout(12_000)
    })
  } catch {
    return { slug: fallbackChatSlug(avoid) }
  }

  if (!response.ok) {
    return { slug: fallbackChatSlug(avoid) }
  }

  const payload = await response.json().catch(() => null)
  const slug    = normalizeChatSlug(stripThinkBlocks(readMessageContent(payload)))

  return { slug: slug || fallbackChatSlug(avoid) }
})
