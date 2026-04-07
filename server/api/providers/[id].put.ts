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
 * Server-side endpoint to update a provider.
 */

import { updateProvider } from '../../utils/providersStorage'
import { getAuthSecret, requireAuthenticatedSession } from '../../utils/authSession'
import { validateCsrf } from '../../utils/csrf'

export default defineEventHandler(async (event) => {
  // CSRF protection
  validateCsrf(event)

  requireAuthenticatedSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Provider ID is required' })
  }

  const body = await readBody(event)
  const secret = getAuthSecret(event)

  // Validate base URL if provided
  if (body.baseUrl !== undefined) {
    try {
      const url = new URL(body.baseUrl.trim())
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid protocol')
      }
      body.baseUrl = body.baseUrl.trim().replace(/\/+$/, '')
    } catch {
      throw createError({ statusCode: 400, message: 'Invalid base URL format' })
    }
  }

  const provider = updateProvider(id, body, secret)

  if (!provider) {
    throw createError({ statusCode: 404, message: 'Provider not found' })
  }

  return { provider }
})
