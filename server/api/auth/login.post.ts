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
 * Server-side login handler for the Meow application.
 * Validates the provided password against the environment runtime configuration.
 * Sets a persistent session cookie upon successful verification.
 */
import { getAuthSecret, setAuthCookies } from '../../utils/authSession'

const LOGIN_WINDOW_MS    = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5

const loginAttempts = new Map<string, { count: number; resetAt: number }>()

export default defineEventHandler(async (event) => {
  // Extract body contents from the POST request
  const body = await readBody(event)
  // Access global app settings (including the password secret)
  const config    = useRuntimeConfig(event)
  const ipAddress = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now       = Date.now()
  const attempt   = loginAttempts.get(ipAddress)

  if (attempt && attempt.resetAt > now && attempt.count >= MAX_LOGIN_ATTEMPTS) {
    throw createError({
      statusCode: 429,
      message:    'Too many failed login attempts. Please wait a few minutes and try again.'
    })
  }

  const username = typeof body?.username==='string' ? body.username.trim(): ''
  const password = typeof body?.password==='string' ? body.password.trim(): ''

  /**
   * Validation Guard: Ensure both username and password parameters exist.
   * Responds with 400 Bad Request if parameters are missing.
   */
  if (!password || !username) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required'
    })
  }

  if (username.length > 80) {
    throw createError({
      statusCode: 400,
      message:    'Username is too long'
    })
  }

  /**
   * Authentication Check: Compare provided secret with the master app password.
   * Rejects requests with 401 Unauthorized for incorrect secrets.
   */
  if (password!==config.appPassword) {
    loginAttempts.set(ipAddress, {
      count:   attempt && attempt.resetAt > now ? attempt.count + 1: 1,
      resetAt: now + LOGIN_WINDOW_MS
    })

    throw createError({
      statusCode: 401,
      message: 'Invalid password provided'
    })
  }

  loginAttempts.delete(ipAddress)

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
