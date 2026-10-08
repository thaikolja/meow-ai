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

/**
 * Requests a unique cat-sentence slug and replaces the hash route once that chat address is current.
 * Tries the slug API twice, then stores a local fallback when the remote slug is missing or already taken.
 *
 * @returns `assignChatSlug`, which does nothing on the server and publishes in the background on the client.
 */
export function useChatSlug() {
  const router                          = useRouter()
  const { chats, getChat, setChatSlug } = useChats()

  /**
   * True when another chat already uses this slug or hash id.
   *
   * @param slug - Candidate public address.
   * @param chatId - Chat that is allowed to keep the slug.
   */
  function taken(slug: string, chatId: string): boolean {
    return chats.value.some(chat => chat.id !== chatId && (chat.slug === slug || chat.id === slug))
  }

  /**
   * Slugs the model should not repeat, capped at 20.
   *
   * @param extra - Slugs rejected during this assignment.
   */
  function avoidList(extra: string[]): string[] {
    const existing = chats.value
    .map(chat => chat.slug)
    .filter((slug): slug is string => Boolean(slug))

    return [ ...new Set([ ...extra, ...existing ]) ].slice(0, 20)
  }

  /**
   * Asks `/api/chat-slug` for one sentence. Network and empty replies become `null`.
   *
   * @param avoid - Slugs already in use.
   */
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

  /**
   * Replaces the hash route with the slug once that chat is the open page.
   *
   * @param chatId - Internal chat id.
   * @param slug - Public cat-sentence address.
   */
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

  /**
   * Stores the slug when no other chat already has it.
   *
   * @param chatId - Internal chat id.
   * @param slug - Public address to store.
   * @returns Whether the slug was stored.
   */
  function claim(chatId: string, slug: string): boolean {
    if (taken(slug, chatId)) return false
    return setChatSlug(chatId, slug)
  }

  /**
   * Starts the background slug assignment. Does nothing during server render.
   *
   * @param chatId - Internal chat id.
   */
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
