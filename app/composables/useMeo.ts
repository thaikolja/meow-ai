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
 * Reads `meo.confetti` from public runtime config.
 * Throws unless the value is the string `"yes"` or `"nein"`.
 */

import { assertMeoConfetti } from '#shared/utils/meoConfig'

/**
 * Public Meow settings for the current request.
 *
 * @returns `confetti`, which is `"yes"` or `"nein"`.
 */
export function useMeo() {
  const confetti = assertMeoConfetti(useRuntimeConfig().public.meo?.confetti)
  return { confetti }
}
