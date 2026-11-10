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
 * Reads the signed-in username's settings and chats.
 * The username comes from the session cookie. The request has no username field.
 */

import { AUTH_SESSION_COOKIE_NAME }                                from '#shared/constants/auth'
import { clearAuthCookies, getAuthSecret }                         from '../utils/authSession'
import { AccountAuthError, accountDataDir, loadAccountForSession } from '../utils/userRecord'

/**
 * GET /api/account.
 * Requires a valid `chat_session` cookie. A missing or invalid session is 401 and clears the auth cookies.
 *
 * @returns `{ settings, chats }` for the username inside the session.
 */
export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-store'
  })

  try {
    return loadAccountForSession(
        accountDataDir(),
        getCookie(event, AUTH_SESSION_COOKIE_NAME),
        getAuthSecret(event)
    )
  } catch (error) {
    if (error instanceof AccountAuthError) {
      clearAuthCookies(event)
      throw createError({ statusCode: 401, message: error.message })
    }

    throw error
  }
})
