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

import { MAX_CHAT_IMAGE_BYTES } from '#shared/utils/chatImage'

const MAX_INPUT_BYTES = 20 * 1024 * 1024
const TARGET_BYTES    = 600_000
const UNSUPPORTED     = 'This photo format isn\'t supported. Try a JPEG.'

const ATTEMPTS = [
  { edge: 1600, quality: 0.82 },
  { edge: 1600, quality: 0.7 },
  { edge: 1280, quality: 0.7 },
  { edge: 1280, quality: 0.58 },
  { edge: 1024, quality: 0.58 },
  { edge: 800, quality: 0.5 }
]

/**
 * Decode a picked photo and store a JPEG small enough to resend with a question.
 * 1600px on the long edge stays readable for a textbook page or a few handwritten words.
 */
export async function prepareChatImage(file: File): Promise<Blob> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('That photo is too large. Try one under 20 MB.')
  }

  if (file.type && (!file.type.startsWith('image/') || file.type === 'image/svg+xml')) {
    throw new Error(UNSUPPORTED)
  }

  const source = await decodeImage(file)
  try {
    let smallest: Blob | null = null
    for (const attempt of ATTEMPTS) {
      const blob = await renderJpeg(source, attempt.edge, attempt.quality)
      smallest   = blob
      if (blob.size <= TARGET_BYTES) return blob
    }

    if (smallest && smallest.size <= MAX_CHAT_IMAGE_BYTES) return smallest
    throw new Error('That photo is still too large after shrinking.')
  } finally {
    if ('close' in source) source.close()
  }
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error(UNSUPPORTED)
  }
}

function renderJpeg(source: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const fitted  = fitEdge(source.width, source.height, maxEdge)
  const canvas  = document.createElement('canvas')
  canvas.width  = fitted.width
  canvas.height = fitted.height
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('Could not read that photo.'))

  context.drawImage(source, 0, 0, fitted.width, fitted.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Could not read that photo.'))
      else resolve(blob)
    }, 'image/jpeg', quality)
  })
}

function fitEdge(width: number, height: number, maxEdge: number): { width: number; height: number } {
  if (width < 1 || height < 1) {
    throw new Error('Could not read that photo.')
  }

  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }

  const scale = maxEdge / longest
  return {
    width:  Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  }
}
