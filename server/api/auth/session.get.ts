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

import { AUTH_SESSION_COOKIE_NAME, AUTH_USERNAME_COOKIE_NAME } from '#shared/constants/auth'
import { clearAuthCookies, getAuthSecret, verifySessionToken } from '../../utils/authSession'

export default defineEventHandler((event) => {
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

