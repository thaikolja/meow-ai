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
 * Project settings for Meow. `confetti` is the string `"yes"` or `"nein"`.
 */

/** Allowed values for `meo.confetti`. */
export const MEO_CONFETTI_VALUES = [ 'yes', 'nein' ] as const

/** `"yes"` shows celebration confetti. `"nein"` leaves it off. */
export type MeoConfetti = (typeof MEO_CONFETTI_VALUES)[number]

/** Top-level `meo` object in `nuxt.config.ts`. */
export type MeoConfig = {
  confetti: MeoConfetti
}

/**
 * True when `value` is exactly `"yes"` or `"nein"`.
 *
 * @param value - Untrusted config value.
 */
export function isMeoConfetti(value: unknown): value is MeoConfetti {
  return value === 'yes' || value === 'nein'
}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    meo: MeoConfig
  }
}
