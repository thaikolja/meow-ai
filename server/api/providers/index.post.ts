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
 * Server-side endpoint to add a new provider.
 */

import { addProvider }  from '../../utils/providersStorage'
import { getAuthSecret, requireAuthenticatedSession } from '../../utils/authSession'
import { validateCsrf } from '../../utils/csrf'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export default defineEventHandler(async (event) => {
  // CSRF protection
  validateCsrf(event)

  requireAuthenticatedSession(event)

  const body   = await readBody(event)
  const { name, baseUrl, apiKey } = body
  const secret = getAuthSecret(event)

  if (!name || typeof name!=='string' || !name.trim()) {
    throw createError({ statusCode: 400, message: 'Provider name is required' })
  }

  if (!baseUrl || typeof baseUrl!=='string' || !baseUrl.trim()) {
    throw createError({ statusCode: 400, message: 'Base URL is required' })
  }

  if (!apiKey || typeof apiKey!=='string' || !apiKey.trim()) {
    throw createError({ statusCode: 400, message: 'API key is required' })
  }

  // Validate URL format
  try {
    const url = new URL(baseUrl.trim())
    if (!url.protocol.startsWith('http')) {
      throw new Error('Invalid protocol')
    }
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid base URL format' })
  }

  const provider = addProvider(
      {
        id:      generateId(),
        name:    name.trim(),
        baseUrl: baseUrl.trim().replace(/\/+$/, ''),
        apiKey:  apiKey.trim()
      },
      secret
  )

  return { provider }
})
