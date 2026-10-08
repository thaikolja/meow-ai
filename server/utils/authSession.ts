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
 * Signed `chat_session` cookies and the readable `chat_username` cookie.
 * The session payload is HMAC-SHA256 and expires after the shared seven-day max age.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE,
  AUTH_USERNAME_COOKIE_NAME
} from '#shared/constants/auth'

type SessionPayload = {
  username: string
  expiresAt: number
}

type CookieSecurityContext = {
  forwardedProto?: string | null
  host?: string | null
  encrypted?: boolean
}

/**
 * Encodes a UTF-8 string as base64url.
 *
 * @param value - Plain payload text.
 */
function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

/**
 * Decodes a base64url string as UTF-8.
 *
 * @param value - Encoded payload text.
 */
function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

/**
 * HMAC-SHA256 of a session payload, encoded as base64url.
 *
 * @param payload - Canonical payload string.
 * @param secret - Session signing secret.
 */
function createSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

/**
 * Takes the first Host value, drops the port, and lowercases it.
 * Bracketed IPv6 hosts keep the address inside the brackets.
 *
 * @param host - Raw Host or X-Forwarded-Host header.
 */
function normalizeHostname(host: string | null | undefined): string {
  if (!host) {
    return ''
  }

  const [ firstHost = '' ] = host.split(',')
  const trimmedHost = firstHost.trim()

  if (!trimmedHost) {
    return ''
  }

  if (trimmedHost.startsWith('[')) {
    return trimmedHost.slice(1, trimmedHost.indexOf(']')).toLowerCase()
  }

  return trimmedHost.split(':')[0]?.toLowerCase() || ''
}

/**
 * Chooses the `Secure` flag for auth cookies.
 * A non-empty forwarded protocol wins: only `https` is secure. Otherwise an encrypted socket is secure.
 * With neither signal, loopback hosts are insecure and every other host is secure outside dev.
 *
 * @param context - Forwarded protocol, Host header, and socket encryption.
 * @returns Whether the cookie should be marked secure.
 */
export function shouldUseSecureCookies(context: CookieSecurityContext): boolean {
  const forwardedProto = context.forwardedProto?.split(',')[0]?.trim().toLowerCase()

  if (forwardedProto) {
    return forwardedProto==='https'
  }

  if (context.encrypted) {
    return true
  }

  const hostname = normalizeHostname(context.host)
  if ([ 'localhost', '127.0.0.1', '::1' ].includes(hostname)) {
    return false
  }

  return !import.meta.dev
}

/**
 * Compares two strings in constant time. Different lengths are rejected first.
 *
 * @param left - Expected value.
 * @param right - Supplied value.
 */
function safeEqual(left: string, right: string): boolean {
  const leftBuffer  = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length!==rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

/**
 * Prefers the trimmed session secret and falls back to the trimmed house password.
 *
 * @param event - Request whose runtime config holds the secrets.
 * @returns The signing secret, or `''` when neither value is set.
 */
export function getAuthSecret(event: any): string {
  const config = useRuntimeConfig(event)
  return config.sessionSecret?.trim() || config.appPassword?.trim() || ''
}

/**
 * Builds a `base64url(payload).signature` token.
 * The payload is `{ username, expiresAt }` and expires `AUTH_SESSION_MAX_AGE` seconds from now. The signature is HMAC-SHA256 over the encoded payload.
 *
 * @param username - Name stored in the payload.
 * @param secret - HMAC key. An empty secret is still signed.
 * @returns The token. This function does not reject an empty secret.
 */
export function createSessionToken(username: string, secret: string): string {
  const payload = base64UrlEncode(JSON.stringify({
    username,
    expiresAt: Date.now() + AUTH_SESSION_MAX_AGE * 1000
  } satisfies SessionPayload))

  return `${payload}.${createSignature(payload, secret)}`
}

/**
 * Accepts a token only when its HMAC matches, its username is a non-empty string, and `expiresAt` is still in the future.
 *
 * @param token - Session token, or null or undefined.
 * @param secret - HMAC key. An empty secret fails closed.
 * @returns The payload, or `null` when the token is missing, malformed, badly signed, or expired.
 */
export function verifySessionToken(token: string | null | undefined, secret: string): SessionPayload | null {
  if (!token || !secret) {
    return null
  }

  const [ encodedPayload, signature ] = token.split('.')
  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = createSignature(encodedPayload, secret)
  if (!safeEqual(signature, expectedSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as { username?: unknown; expiresAt?: unknown }
    if (!payload.username || typeof payload.username!=='string') {
      return null
    }

    if (!payload.expiresAt || typeof payload.expiresAt!=='number' || payload.expiresAt <= Date.now()) {
      return null
    }

    return {
      username:  payload.username,
      expiresAt: payload.expiresAt
    }
  } catch {
    return null
  }
}

/**
 * Deletes `chat_session` and `chat_username` on path `/`.
 *
 * @param event - Request whose cookies are cleared.
 */
export function clearAuthCookies(event: any) {
  deleteCookie(event, AUTH_SESSION_COOKIE_NAME, { path: '/' })
  deleteCookie(event, AUTH_USERNAME_COOKIE_NAME, { path: '/' })
}

/**
 * Sets a seven-day httpOnly `chat_session` cookie (`SameSite=strict`) and a readable `chat_username` cookie (`SameSite=lax`).
 * Both use path `/` and the secure flag from `shouldUseSecureCookies`.
 *
 * @param event - Request that receives the cookies.
 * @param username - Cat name stored in the token and in the username cookie.
 * @param secret - HMAC key passed to `createSessionToken`.
 */
export function setAuthCookies(event: any, username: string, secret: string) {
  const secure = shouldUseSecureCookies({
    forwardedProto: event?.node?.req?.headers?.['x-forwarded-proto'],
    host:           event?.node?.req?.headers?.host,
    encrypted:      Boolean(event?.node?.req?.socket?.encrypted)
  })

  setCookie(event, AUTH_SESSION_COOKIE_NAME, createSessionToken(username, secret), {
    maxAge:   AUTH_SESSION_MAX_AGE,
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path:     '/'
  })

  setCookie(event, AUTH_USERNAME_COOKIE_NAME, username, {
    maxAge:   AUTH_SESSION_MAX_AGE,
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path:     '/'
  })
}

/**
 * Returns the verified session or throws 401 with message `Authentication required`.
 * A missing or invalid `chat_session` cookie also clears both auth cookies.
 *
 * @param event - Request to read and, on failure, clear.
 * @returns The session payload `{ username, expiresAt }`.
 */
export function requireAuthenticatedSession(event: any) {
  const secret  = getAuthSecret(event)
  const session = verifySessionToken(getCookie(event, AUTH_SESSION_COOKIE_NAME), secret)

  if (!session) {
    clearAuthCookies(event)
    throw createError({
      statusCode: 401,
      message:    'Authentication required'
    })
  }

  return session
}

