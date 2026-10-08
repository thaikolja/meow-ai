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
 * Shared login session for the challenge gate.
 * Checks the signed session with the server, mirrors the readable username cookie on the client, and clears both on logout.
 */

import { AUTH_USERNAME_COOKIE_NAME } from '#shared/constants/auth'

type AuthSessionState = {
  checked: boolean
  authenticated: boolean
  username: string | null
}

let verifyPromise: Promise<boolean> | null = null

/**
 * Shares auth state and the calls that verify, record, or end a session.
 * A finished check is reused unless verification is forced, and overlapping checks share one request.
 *
 * @returns The session state, `verifySession`, setters for a successful login and a local logout, and `logout`.
 */
export function useAuthSession() {
  const authState = useState<AuthSessionState>('auth-session-state', () => ({
    checked:       false,
    authenticated: false,
    username:      null
  }))

  const usernameCookie = useCookie<string | null>(AUTH_USERNAME_COOKIE_NAME, {
    default: () => null
  })

  /**
   * Mirrors the readable username cookie in the browser.
   *
   * @param username - Signed-in cat name, or `null` after logout.
   */
  function syncUsernameCookie(username: string | null) {
    if (import.meta.client) {
      usernameCookie.value = username
    }
  }

  /**
   * Asks `/api/auth/session` whether the signed cookie is still valid.
   * A finished check is reused unless `force` is set. Overlapping calls share one request.
   *
   * @param force - When true, ignore the cached check.
   * @returns Whether the session is authenticated.
   */
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

  /**
   * Records a login that just succeeded, without another session request.
   *
   * @param username - Cat name returned by login.
   */
  function setAuthenticated(username: string) {
    authState.value = {
      checked:       true,
      authenticated: true,
      username
    }
    syncUsernameCookie(username)
  }

  /**
   * Clears the local session state and the readable username cookie.
   */
  function setLoggedOut() {
    authState.value = {
      checked:       true,
      authenticated: false,
      username:      null
    }
    syncUsernameCookie(null)
  }

  /**
   * Posts `/api/auth/logout`, then clears the local session.
   */
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
