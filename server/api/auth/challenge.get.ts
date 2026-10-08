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
 * Issues the one-time login challenge the client signs with the house secret.
 */

import { issueLoginChallenge } from '../../utils/authChallenge'

/**
 * GET /api/auth/challenge.
 * No session and no CSRF check. Responds 503 when the house secret is empty.
 * Binds a new challenge to the request IP (`x-forwarded-for` when present) and sets `Cache-Control: no-store`.
 *
 * @returns `{ challengeId, challenge, expiresAt }`.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  if (!config.appPassword?.trim()) {
    throw createError({
      statusCode: 503,
      message:    'The house secret is not configured yet.'
    })
  }

  setResponseHeaders(event, {
    'Cache-Control': 'no-store'
  })

  const ipAddress = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return issueLoginChallenge(ipAddress)
})
