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

import { AUTH_USERNAME_COOKIE_NAME } from '#shared/constants/auth'

/**
 * Global authentication middleware for the Meow application.
 * Protects all routes except the login page and handles redirection logic based on user session state.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Access the authentication identifier stored in cookies
  const username  = useCookie(AUTH_USERNAME_COOKIE_NAME)
  const authState = useState<{ checked: boolean; authenticated: boolean; username: string | null }>('auth-session-state', () => ({
    checked:       false,
    authenticated: false,
    username:      null
  }))

  async function verifySession() {
    try {
      const headers = import.meta.server ? useRequestHeaders([ 'cookie' ]): undefined
      const session = await $fetch<{ authenticated: boolean; username: string | null }>('/api/auth/session', {
        headers
      })

      authState.value = {
        checked:       true,
        authenticated: session.authenticated,
        username:      session.username
      }

      if (session.username) {
        username.value = session.username
      }

      return session.authenticated
    } catch {
      authState.value = {
        checked:       true,
        authenticated: false,
        username:      null
      }
      username.value  = null
      return false
    }
  }

  const isAuthenticated = authState.value.checked
      ? authState.value.authenticated
      : await verifySession()

  /**
   * Primary Guard: If no valid session exists, redirect all page requests back to login.
   * Exemption: Explicitly ignore the login path to prevent redirect loops.
   */
  if (!isAuthenticated && to.path!=='/login') {
    return navigateTo('/login')
  }

  /**
   * Optimized Navigation: Prevent logged-in users from manually accessing the login screen.
   * Redirects them back to the main application interface.
   */
  if (isAuthenticated && to.path==='/login') {
    return navigateTo('/')
  }
})
