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
 * Server-side endpoint to list all providers (without API keys).
 */

import { getAllProviders, initializeDefaultProviders } from '../../utils/providersStorage'
import { getAuthSecret, requireAuthenticatedSession } from '../../utils/authSession'

export default defineEventHandler((event) => {
  requireAuthenticatedSession(event)

  const secret = getAuthSecret(event)

  // Initialize default providers if storage is empty
  initializeDefaultProviders(secret)

  const providers = getAllProviders(secret)

  return { providers }
})
