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
 * Checks production runtime secrets once when the Nitro server starts.
 */

import { assertProductionRuntimeSecrets } from '../utils/runtimeConfigValidation'

/**
 * Startup plugin with no route, session, or CSRF check.
 * Throws when production runtime config has a missing or blank house secret.
 */
export default defineNitroPlugin(() => {
  assertProductionRuntimeSecrets(useRuntimeConfig())
})
