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
 * Fills in a chat's public address after the chat has already opened.
 * If Gemini 3.5 Flash Lite fails, a local cat sentence is used instead.
 */
import { fallbackChatSlug } from '#shared/utils/chatSlug'

export function useChatSlug() {
  const router                          = useRouter()
  const { chats, getChat, setChatSlug } = useChats()

  function taken(slug: string, chatId: string): boolean {
    return chats.value.some(chat => chat.id !== chatId && (chat.slug === slug || chat.id === slug))
  }

  function avoidList(extra: string[]): string[] {
    const existing = chats.value
    .map(chat => chat.slug)
    .filter((slug): slug is string => Boolean(slug))

    return [ ...new Set([ ...extra, ...existing ]) ].slice(0, 20)
  }

  async function requestSlug(avoid: string[]): Promise<string | null> {
    try {
      const result = await $fetch<{ slug: string | null }>('/api/chat-slug', {
        method: 'POST',
        body:   { avoid }
      })
      return result?.slug || null
    } catch {
      return null
    }
  }

  async function publish(chatId: string, slug: string) {
    // The slug can arrive before router.push has committed the hash address.
    for (let attempt = 0; attempt < 20; attempt++) {
      const current = String(router.currentRoute.value.params.id || '')
      const chat    = getChat(chatId)
      if (!chat) return
      if (current === slug) return
      if (current === chat.id) {
        await router.replace(`/chat/${slug}`)
        return
      }
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  function claim(chatId: string, slug: string): boolean {
    if (taken(slug, chatId)) return false
    return setChatSlug(chatId, slug)
  }

  function assignChatSlug(chatId: string) {
    if (import.meta.server) return

    void (async () => {
      const rejected: string[] = []

      for (let attempt = 0; attempt < 2; attempt++) {
        const slug = await requestSlug(avoidList(rejected))
        if (!slug || !claim(chatId, slug)) {
          if (slug) rejected.push(slug)
          continue
        }

        await publish(chatId, slug)
        return
      }

      const local = fallbackChatSlug(avoidList(rejected))
      if (claim(chatId, local)) await publish(chatId, local)
    })()
  }

  return { assignChatSlug }
}
