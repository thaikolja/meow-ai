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
 * Reads the signed session cookie and reports whether it is still valid.
 */

import { AUTH_SESSION_COOKIE_NAME, AUTH_USERNAME_COOKIE_NAME } from '#shared/constants/auth'
import { clearAuthCookies, getAuthSecret, verifySessionToken } from '../../utils/authSession'

/**
 * GET /api/auth/session.
 * No CSRF check. A missing or invalid session is not an error.
 * Sets `Cache-Control: no-store`. An invalid token also clears the auth cookies.
 *
 * @returns `{ authenticated: false, username: null }` when the token is missing or invalid. When it is valid, `{ authenticated: true, username }` uses the username cookie if that cookie is set, otherwise the name inside the token.
 */
export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-store'
  })

  const sessionToken = getCookie(event, AUTH_SESSION_COOKIE_NAME)
  const session      = verifySessionToken(sessionToken, getAuthSecret(event))

  if (!session) {
    clearAuthCookies(event)
    return {
      authenticated: false,
      username:      null
    }
  }

  const username = getCookie(event, AUTH_USERNAME_COOKIE_NAME) || session.username

  return {
    authenticated: true,
    username
  }
})
