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
export default defineEventHandler(async (event) => {
  // Extract body contents from the POST request
  const body = await readBody(event)
  // Access global app settings (including the password secret)
  const config = useRuntimeConfig()

  /**
   * Validation Guard: Ensure both username and password parameters exist.
   * Responds with 400 Bad Request if parameters are missing.
   */
  if (!body?.password || !body?.username) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required'
    })
  }

  /**
   * Authentication Check: Compare provided secret with the master app password.
   * Rejects requests with 401 Unauthorized for incorrect secrets.
   */
  if (body.password!==config.appPassword) {
    throw createError({
      statusCode: 401,
      message: 'Invalid password provided'
    })
  }

  /**
   * Persistence: Create a login session valid for 7 days.
   * Security Note: httpOnly is false to allow the Nuxt client-side to read the username for UI greets.
   * Secure property is dynamically set based on production environment status.
   */
  setCookie(event, 'chat_username', body.username, {
    maxAge:   60 * 60 * 24 * 7, // 7 days in seconds
    httpOnly: false,
    secure:   !import.meta.dev,
    sameSite: 'lax',
    path:     '/'
  })

  return {
    success: true,
    username: body.username
  }
})
