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

type AuthSessionState = {
  checked: boolean
  authenticated: boolean
  username: string | null
}

let verifyPromise: Promise<boolean> | null = null

export function useAuthSession() {
  const authState = useState<AuthSessionState>('auth-session-state', () => ({
    checked:       false,
    authenticated: false,
    username:      null
  }))

  const usernameCookie = useCookie<string | null>(AUTH_USERNAME_COOKIE_NAME, {
    default: () => null
  })

  function syncUsernameCookie(username: string | null) {
    if (import.meta.client) {
      usernameCookie.value = username
    }
  }

  async function verifySession(force = false): Promise<boolean> {
    if (!force && authState.value.checked) {
      return authState.value.authenticated
    }

    if (verifyPromise) {
      return verifyPromise
    }

    verifyPromise = (async () => {
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
        syncUsernameCookie(session.username)
        return session.authenticated
      } catch {
        authState.value = {
          checked:       true,
          authenticated: false,
          username:      null
        }
        syncUsernameCookie(null)
        return false
      } finally {
        verifyPromise = null
      }
    })()

    return verifyPromise
  }

  function setAuthenticated(username: string) {
    authState.value = {
      checked:       true,
      authenticated: true,
      username
    }
    syncUsernameCookie(username)
  }

  function setLoggedOut() {
    authState.value = {
      checked:       true,
      authenticated: false,
      username:      null
    }
    syncUsernameCookie(null)
  }

  async function logout() {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })

    setLoggedOut()
  }

  return {
    authState,
    verifySession,
    setAuthenticated,
    setLoggedOut,
    logout
  }
}
