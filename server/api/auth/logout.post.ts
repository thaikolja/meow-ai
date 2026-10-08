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
 * Ends the browser session by clearing the auth cookies.
 */

import { clearAuthCookies } from '../../utils/authSession'
import { validateCsrf } from '../../utils/csrf'

/**
 * POST /api/auth/logout.
 * No session required. CSRF is required.
 * Clears the session and username cookies and sets `Cache-Control: no-store`.
 *
 * @returns `{ success: true }`.
 */
export default defineEventHandler((event) => {
  validateCsrf(event)

  clearAuthCookies(event)

  setResponseHeaders(event, {
    'Cache-Control': 'no-store'
  })

  return {
    success: true
  }
})
