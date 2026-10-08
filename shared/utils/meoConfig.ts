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
 * Copies the top-level `meo` setting onto public runtime config.
 * The value is rejected unless it is the string `"yes"` or `"nein"`.
 */

import { isMeoConfetti, type MeoConfig, type MeoConfetti } from '../types/meo'

/**
 * Returns `value` when it is `"yes"` or `"nein"`.
 *
 * @param value - Candidate confetti flag.
 * @throws When the value is anything else, including booleans.
 */
export function assertMeoConfetti(value: unknown): MeoConfetti {
  if (!isMeoConfetti(value)) {
    throw new Error('meo.confetti must be the string "yes" or "nein".')
  }

  return value
}

/**
 * Writes `options.meo.confetti` onto `runtimeConfig.public.meo`.
 *
 * @param options - Nuxt options slice with the top-level `meo` key and runtime config.
 * @returns The public `meo` object that was written.
 */
export function copyMeoToPublicRuntimeConfig(options: {
  meo?: { confetti?: unknown }
  runtimeConfig: { public: object }
}): MeoConfig {
  const meo: MeoConfig = { confetti: assertMeoConfetti(options.meo?.confetti) }
  ;(options.runtimeConfig.public as { meo?: MeoConfig }).meo = meo
  return meo
}
