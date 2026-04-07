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
 * CSRF protection utility using Origin/Referer header validation.
 * Protects against Cross-Site Request Forgery attacks.
 */

/**
 * Validates that the request originates from the same origin.
 * Must be called for all state-changing operations (POST, PUT, DELETE, PATCH).
 */
export function validateCsrf(event: any): void {
  const method = getMethod(event)

  // Only validate state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return
  }

  const headers = getHeaders(event)
  const origin = String(headers['origin'] || headers['Origin'] || '')
  const referer = String(headers['referer'] || headers['Referer'] || '')

  // Get the expected origin from the host header
  const host = String(headers['host'] || headers['Host'] || '')
  const protocol = event?.node?.req?.socket?.encrypted ? 'https' : 'http'
  const forwardedProto = String(headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'] || '')
  const expectedProtocol = forwardedProto ? (forwardedProto.split(',')[0] || protocol).trim() : protocol
  const expectedOrigin = `${expectedProtocol}://${host}`

  // Allow requests with no origin/referer for same-origin requests from bookmarks/direct navigation
  // This is safe because browsers only omit these headers for GET/HEAD, not POST
  // However, to be extra safe, we require at least one of them for POST requests

  const hasOrigin = origin.length > 0
  const hasReferer = referer.length > 0

  if (!hasOrigin && !hasReferer) {
    // In development, allow requests without origin/referer for easier testing
    if (import.meta.dev) {
      return
    }
    throw createError({
      statusCode: 403,
      message: 'CSRF validation failed: Missing origin header'
    })
  }

  // Validate origin if present
  if (hasOrigin) {
    if (!isValidOrigin(origin, expectedOrigin)) {
      throw createError({
        statusCode: 403,
        message: 'CSRF validation failed: Invalid origin'
      })
    }
    return
  }

  // Validate referer if present (fallback)
  if (hasReferer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = refererUrl.origin
      if (!isValidOrigin(refererOrigin, expectedOrigin)) {
        throw createError({
          statusCode: 403,
          message: 'CSRF validation failed: Invalid referer'
        })
      }
    } catch {
      throw createError({
        statusCode: 403,
        message: 'CSRF validation failed: Invalid referer format'
      })
    }
  }
}

/**
 * Checks if the request origin matches the expected origin.
 * Handles localhost variations and common development scenarios.
 */
function isValidOrigin(requestOrigin: string, expectedOrigin: string): boolean {
  // Exact match
  if (requestOrigin === expectedOrigin) {
    return true
  }

  // Parse both origins for comparison
  try {
    const requestUrl = new URL(requestOrigin)
    const expectedUrl = new URL(expectedOrigin)

    // Compare protocol and hostname
    if (requestUrl.protocol !== expectedUrl.protocol) {
      // Allow http->https upgrade in production
      if (!(requestUrl.protocol === 'https:' && expectedUrl.protocol === 'http:')) {
        return false
      }
    }

    // Compare hostnames
    if (requestUrl.hostname !== expectedUrl.hostname) {
      // Allow localhost variations in development
      if (import.meta.dev) {
        const localhosts = ['localhost', '127.0.0.1', '::1']
        if (localhosts.includes(requestUrl.hostname) && localhosts.includes(expectedUrl.hostname)) {
          return true
        }
      }
      return false
    }

    return true
  } catch {
    return false
  }
}
