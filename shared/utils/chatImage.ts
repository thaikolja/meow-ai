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
 * Checks one JPEG page photo and the chat messages that carry it.
 * Remote URLs and non-JPEG payloads are rejected before a provider sees them.
 */

import { modelSupportsVision } from './models'

/** Decoded JPEG size cap for one attached page. */
export const MAX_CHAT_IMAGE_BYTES = 1_200_000

/** One completion may forward a single page photo. Older photos stay in the thread. */
export const MAX_IMAGES_PER_REQUEST = 1

/** JSON body cap for /api/chat, enough for the photos above plus the transcript. */
export const MAX_CHAT_BODY_BYTES = 8_000_000

const JPEG_DATA_PREFIX = 'data:image/jpeg;base64,'

/**
 * One part of a user message that may include a page photo.
 * Text is a string; a photo is a JPEG data URL.
 */
export type ChatContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }

/**
 * Message forwarded to a provider.
 * `content` is plain text, or text plus at most one JPEG part.
 */
export type UpstreamMessage = {
  role: string
  content: string | ChatContentPart[]
}

/**
 * Accept only a JPEG data URL. Remote URLs are rejected so the proxy cannot be
 * pointed at another host. The returned URL is the canonical form that is forwarded.
 */
export function assertJpegDataUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.toLowerCase().startsWith(JPEG_DATA_PREFIX)) {
    throw new Error('Only a JPEG photo can be sent.')
  }

  const payload = value.slice(JPEG_DATA_PREFIX.length).replace(/\s/g, '')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) {
    throw new Error('Only a JPEG photo can be sent.')
  }

  let bytes: Uint8Array
  try {
    bytes = bytesFromBase64(payload)
  } catch {
    throw new Error('Only a JPEG photo can be sent.')
  }

  if (bytes.length > MAX_CHAT_IMAGE_BYTES) {
    throw new Error('That photo is too large.')
  }

  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error('Only a JPEG photo can be sent.')
  }

  return JPEG_DATA_PREFIX + payload
}

/**
 * Keep string transcripts as they are. A user message may also carry one JPEG
 * data URL. Non-vision models, assistant turns, and system turns cannot.
 */
export function sanitizeUpstreamMessages(messages: unknown, model: string): UpstreamMessage[] {
  if (!Array.isArray(messages)) {
    throw new Error('Missing required fields: model, messages')
  }

  if (messages.length > 100) {
    throw new Error('Too many messages supplied in a single request')
  }

  const vision                       = modelSupportsVision(model)
  const sanitized: UpstreamMessage[] = []
  let imageCount                     = 0

  for (const message of messages) {
    const parsed = readMessage(message, vision)
    if (!parsed) continue

    if (Array.isArray(parsed.content) && parsed.content.some(part => part.type === 'image_url')) {
      imageCount += 1
      if (imageCount > MAX_IMAGES_PER_REQUEST) {
        throw new Error('Too many images in one request.')
      }
    }

    sanitized.push(parsed)
  }

  if (sanitized.length === 0) {
    throw new Error('At least one valid message is required')
  }

  if (sanitized.length > 100) {
    throw new Error('Too many messages supplied in a single request')
  }

  return sanitized
}

/**
 * Accepts one chat message for the upstream request.
 * A vision model may keep one JPEG on a user message. Other models reject image parts.
 *
 * @param message - Raw message from the client.
 * @param vision - Whether the selected model may receive an image.
 * @returns A text or multipart message, or `null` when the message is empty.
 */
function readMessage(message: unknown, vision: boolean): UpstreamMessage | null {
  if (!message || typeof message !== 'object') return null

  const role    = (message as { role?: unknown }).role
  const content = (message as { content?: unknown }).content
  if (role !== 'user' && role !== 'assistant' && role !== 'system') return null

  if (typeof content === 'string') {
    const text = content.trim()
    return text ? { role, content: text } : null
  }

  if (!Array.isArray(content)) return null

  if (!vision) {
    throw new Error('This model can\'t read images.')
  }

  if (role !== 'user') {
    throw new Error('Only user messages can include an image.')
  }

  const parts = readUserParts(content)
  if (parts.length === 0) return null
  return { role, content: parts }
}

/**
 * Keeps one text part and one JPEG `image_url` from a user message.
 *
 * @param parts - Content parts from the client.
 * @returns The parts that will be forwarded. Empty text is dropped.
 */
function readUserParts(parts: unknown[]): ChatContentPart[] {
  let text                 = ''
  let image: string | null = null
  let sawText              = false
  let sawImage             = false

  for (const part of parts) {
    if (!part || typeof part !== 'object') {
      throw new Error('Invalid image attachment.')
    }

    const type = (part as { type?: unknown }).type
    if (type === 'text') {
      if (sawText) throw new Error('Invalid image attachment.')
      sawText     = true
      const value = (part as { text?: unknown }).text
      if (typeof value !== 'string') throw new Error('Invalid image attachment.')
      text = value.trim()
      continue
    }

    if (type === 'image_url') {
      if (sawImage) throw new Error('Only one image can be attached to a message.')
      sawImage  = true
      const url = (part as { image_url?: { url?: unknown } }).image_url?.url
      image     = assertJpegDataUrl(url)
      continue
    }

    throw new Error('Invalid image attachment.')
  }

  const list: ChatContentPart[] = []
  if (text) list.push({ type: 'text', text })
  if (image) list.push({ type: 'image_url', image_url: { url: image } })
  return list
}

/**
 * Decodes a base64 payload into bytes.
 *
 * @param payload - Base64 body of a data URL, without the prefix.
 */
function bytesFromBase64(payload: string): Uint8Array {
  const binary = atob(payload)
  const bytes  = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}
