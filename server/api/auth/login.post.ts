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
 * Server-side login handler for the Meow application.
 * Verifies a one-time challenge response against the shared environment secret
 * and sets a persistent session cookie upon success.
 *
 * Note: brute-force throttling was previously provided by server/utils/rateLimit.ts
 * (Redis with in-memory fallback). It was removed in favor of relying on the
 * single-use, IP-bound, 5-minute challenge + HMAC proof. If a future deployment
 * needs stricter throttling, prefer a lightweight in-memory limiter scoped to
 * this endpoint over re-introducing the Redis dependency.
 */
import {
  AUTH_DISPLAY_NAME_MAX_LENGTH,
  isValidAuthUsername,
  normalizeAuthUsername
}                                         from '#shared/utils/authProof'
import { consumeLoginChallenge, verifyLoginProof } from '../../utils/authChallenge'
import { getAuthSecret, setAuthCookies }  from '../../utils/authSession'
import { validateCsrf }                   from '../../utils/csrf'

export default defineEventHandler(async (event) => {
  // CSRF protection
  validateCsrf(event)

  setResponseHeaders(event, {
    'Cache-Control': 'no-store'
  })

  // Extract body contents from the POST request
  const body = await readBody(event)
  // Access global app settings (including the password secret)
  const config    = useRuntimeConfig(event)
  const ipAddress = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  const username    = typeof body?.username==='string' ? normalizeAuthUsername(body.username): ''
  const challengeId = typeof body?.challengeId==='string' ? body.challengeId.trim(): ''
  const proof       = typeof body?.proof==='string' ? body.proof.trim(): ''

  /**
   * Validation Guard: Ensure challenge flow parameters exist.
   * Responds with 400 Bad Request if parameters are missing.
   */
  if (!username || !challengeId || !proof) {
    throw createError({
      statusCode: 400,
      message:    'Cat name, challenge, and paw-print proof are required'
    })
  }

  if (!isValidAuthUsername(username)) {
    throw createError({
      statusCode: 400,
      message:    username.length > AUTH_DISPLAY_NAME_MAX_LENGTH
                      ? 'Cat name is too long'
                      : 'Please choose a valid cat name'
    })
  }

  if (!config.appPassword?.trim()) {
    throw createError({
      statusCode: 503,
      message:    'The house secret is not configured yet.'
    })
  }

  const challenge = consumeLoginChallenge(challengeId, ipAddress)
  if (!challenge) {
    throw createError({
      statusCode: 400,
      message:    'That paw-print expired. Please fetch a fresh one and try again.'
    })
  }

  /**
   * Authentication Check: verify the one-time proof using the shared secret.
   */
  if (!verifyLoginProof({
    secret: config.appPassword,
    challengeId,
    challenge: challenge.challenge,
    username,
    proof
  })) {
    throw createError({
      statusCode: 401,
      message:    'The house secret did not match that paw-print.'
    })
  }

  /**
   * Persistence: Create a login session valid for 7 days.
   * Security Note: httpOnly is false to allow the Nuxt client-side to read the username for UI greets.
   * Secure property is dynamically set based on production environment status.
   */
  setAuthCookies(event, username, getAuthSecret(event))

  return {
    success: true,
    username
  }
})
