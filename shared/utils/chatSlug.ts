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

export const CHAT_SLUG_MODEL     = 'google/gemini-3.5-flash-lite'
export const CHAT_SLUG_MIN_WORDS = 4
export const CHAT_SLUG_MAX_WORDS = 8

/**
 * Turn a model reply into a URL segment of 4 to 8 lowercase words.
 * Returns null when the text is not a short letter-only sentence.
 */
export function normalizeChatSlug(raw: string): string | null {
  const firstLine = raw
  .split(/\r?\n/)
  .map(line => line.trim())
  .find(Boolean) || ''

  const cleaned = firstLine
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-{2,}/g, '-')

  if (!cleaned) return null

  const words = cleaned.split('-')
  if (words.length < CHAT_SLUG_MIN_WORDS || words.length > CHAT_SLUG_MAX_WORDS) return null
  if (words.some(word => !/^[a-z]+$/.test(word))) return null

  return words.join('-')
}

export function buildChatSlugPrompt(avoid: string[] = []): string {
  const lines = [
    'Write one short cat sentence of 4 or 5 words.',
    'Use lowercase English letters separated by single spaces.',
    'No punctuation, numbers, or quotes.',
    'It must be a coherent sentence about a cat, like "cat sits on sofa".',
    'Never use more than 8 words.',
    'Reply with the sentence only.'
  ]

  const banned = [ ...new Set(avoid.map(item => item.trim()).filter(Boolean)) ]
  if (banned.length > 0) {
    lines.push(`Do not reuse any of these: ${banned.join('; ')}.`)
  }

  return lines.join('\n')
}

export function chatAddress(chat: { id: string; slug?: string | null }): string {
  return `/chat/${chat.slug || chat.id}`
}

const SLUG_SUBJECTS = [ 'cat', 'kitten', 'tabby', 'tomcat' ]
const SLUG_PLACES   = [ 'sofa', 'cushion', 'rug', 'bed', 'mat', 'chair', 'blanket', 'shelf' ]
const SLUG_TRAITS   = [ 'warm', 'soft', 'sunny', 'quiet', 'cozy' ]
const SLUG_ACTIONS  = [
  [ 'sits', 'on' ],
  [ 'naps', 'on' ],
  [ 'sleeps', 'on' ],
  [ 'lies', 'on' ],
  [ 'leaps', 'onto' ],
  [ 'hides', 'under' ],
  [ 'walks', 'across' ],
  [ 'purrs', 'beside' ],
  [ 'curls', 'on' ],
  [ 'rests', 'on' ]
]

/**
 * A local 4- or 5-word cat sentence used when the model call fails or
 * returns something that is not a usable address.
 */
export function fallbackChatSlug(avoid: string[] = [], random: () => number = Math.random): string {
  const banned = new Set(avoid)
  const pick   = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length) % items.length] as T

  for (let attempt = 0; attempt < 40; attempt++) {
    const [ verb, prep ] = pick(SLUG_ACTIONS)
    const words          = random() < 0.5
        ? [ pick(SLUG_SUBJECTS), verb, prep, pick(SLUG_TRAITS), pick(SLUG_PLACES) ]
        : [ pick(SLUG_SUBJECTS), verb, prep, pick(SLUG_PLACES) ]
    const slug           = words.join('-')
    if (!banned.has(slug)) return slug
  }

  for (const subject of SLUG_SUBJECTS) {
    for (const [ verb, prep ] of SLUG_ACTIONS) {
      for (const place of SLUG_PLACES) {
        const slug = `${subject}-${verb}-${prep}-${place}`
        if (!banned.has(slug)) return slug
      }
    }
  }

  return 'cat-sits-on-sofa'
}
