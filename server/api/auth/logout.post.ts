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

import { clearAuthCookies } from '../../utils/authSession'
import { validateCsrf } from '../../utils/csrf'

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
