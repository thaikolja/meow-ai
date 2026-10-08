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
 * Refuses to continue in production when the house secret is missing.
 */

type RuntimeSecretConfig = {
  appPassword?: string
}

/**
 * Does nothing unless `nodeEnv` is exactly `production`.
 * In production, throws when `appPassword` is missing or blank.
 *
 * @param config - Runtime config slice that may contain `appPassword`.
 * @param nodeEnv - Environment name. Defaults to `NODE_ENV`, or `''` when that is unset.
 */
export function assertProductionRuntimeSecrets(config: RuntimeSecretConfig, nodeEnv = process.env['NODE_ENV'] || '') {
  if (nodeEnv!=='production') {
    return
  }

  if (!config.appPassword?.trim()) {
    throw new Error('NUXT_APP_PASSWORD environment variable is required in production')
  }
}
