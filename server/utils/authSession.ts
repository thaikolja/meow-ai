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

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function createSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

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

function safeEqual(left: string, right: string): boolean {
  const leftBuffer  = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length!==rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function getAuthSecret(event: any): string {
  const config = useRuntimeConfig(event)
  return config.sessionSecret?.trim() || config.appPassword?.trim() || ''
}

export function createSessionToken(username: string, secret: string): string {
  const payload = base64UrlEncode(JSON.stringify({
    username,
    expiresAt: Date.now() + AUTH_SESSION_MAX_AGE * 1000
  } satisfies SessionPayload))

  return `${payload}.${createSignature(payload, secret)}`
}

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

export function clearAuthCookies(event: any) {
  deleteCookie(event, AUTH_SESSION_COOKIE_NAME, { path: '/' })
  deleteCookie(event, AUTH_USERNAME_COOKIE_NAME, { path: '/' })
}

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
    sameSite: 'lax',
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

