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
 * Builds the message list posted to the chat API from saved transcript rows.
 * A vision model receives only the newest stored photo as a data URL; blank turns are left out.
 */

import { MAX_IMAGES_PER_REQUEST, type ChatContentPart, type UpstreamMessage } from '#shared/utils/chatImage'
import { modelSupportsVision }                                                from '#shared/utils/models'
import { readChatImageDataUrl }                                               from '~/utils/chatImageStore'

type TranscriptMessage = {
  role: string
  content: string
  imageId?: string
}

/**
 * Turn saved messages into the provider payload. A vision model receives the
 * newest JPEG with the text of that turn. Older photos stay in the thread
 * and are not uploaded again.
 */
export async function toUpstreamMessages(messages: TranscriptMessage[], model: string): Promise<UpstreamMessage[]> {
  const vision       = modelSupportsVision(model)
  const includeImage = new Set<number>()

  if (vision) {
    const indexes = messages
    .map((message, index) => (message.role === 'user' && message.imageId ? index : -1))
    .filter((index) => index >= 0)
    for (const index of indexes.slice(-MAX_IMAGES_PER_REQUEST)) {
      includeImage.add(index)
    }
  }

  const upstream: UpstreamMessage[] = []

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index]
    if (!message) continue
    const text = message.content.trim()

    if (includeImage.has(index) && message.imageId) {
      const dataUrl = await readChatImageDataUrl(message.imageId)
      if (dataUrl) {
        const content: ChatContentPart[] = []
        if (text) content.push({ type: 'text', text })
        content.push({ type: 'image_url', image_url: { url: dataUrl } })
        upstream.push({ role: 'user', content })
        continue
      }
    }

    if (text) upstream.push({ role: message.role, content: text })
  }

  return upstream
}
