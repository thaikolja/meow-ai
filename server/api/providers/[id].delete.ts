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
 * Server-side endpoint to delete a provider.
 */

import { deleteProvider } from '../../utils/providersStorage'
import { requireAuthenticatedSession } from '../../utils/authSession'
import { validateCsrf }   from '../../utils/csrf'

export default defineEventHandler((event) => {
  // CSRF protection
  validateCsrf(event)

  requireAuthenticatedSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Provider ID is required' })
  }

  const deleted = deleteProvider(id)

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Provider not found' })
  }

  return { success: true }
})
