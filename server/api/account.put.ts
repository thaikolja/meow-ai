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
 * Writes settings, chats, or both for the signed-in username.
 * The body cannot choose the username. Omitted fields stay as they are on disk.
 */

import { AUTH_SESSION_COOKIE_NAME }                                from '#shared/constants/auth'
import { clearAuthCookies, getAuthSecret }                         from '../utils/authSession'
import { validateCsrf }                                            from '../utils/csrf'
import { AccountAuthError, accountDataDir, saveAccountForSession } from '../utils/userRecord'

/**
 * PUT /api/account.
 * Requires a valid session and a passing CSRF check.
 * Accepts `{ settings }` and/or `{ chats }`. Responds 401 when the session is missing or invalid, and 400 when `chats` is not a list.
 *
 * @returns The stored `{ settings, chats }` for the session username.
 */
export default defineEventHandler(async (event) => {
  validateCsrf(event)

  const body                                           = await readBody(event)
  const patch: { settings?: unknown, chats?: unknown } = {}

  if (body && typeof body === 'object' && 'settings' in body) {
    patch.settings = body.settings
  }

  if (body && typeof body === 'object' && 'chats' in body) {
    patch.chats = body.chats
  }

  try {
    return await saveAccountForSession(
        accountDataDir(),
        getCookie(event, AUTH_SESSION_COOKIE_NAME),
        getAuthSecret(event),
        patch
    )
  } catch (error) {
    if (error instanceof AccountAuthError) {
      clearAuthCookies(event)
      throw createError({ statusCode: 401, message: error.message })
    }

    if (error instanceof Error && error.message === 'Invalid chats') {
      throw createError({ statusCode: 400, message: 'Invalid chats' })
    }

    throw error
  }
})
