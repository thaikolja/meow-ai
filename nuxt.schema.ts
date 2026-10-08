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
 * Types the top-level `meo` key. Nuxt loads this file itself. It is not a module.
 * `confetti` is the string `"yes"` or `"nein"`.
 */

export default defineNuxtSchema({
  meo: {
    $schema: {
      title:       'Meo',
      description: 'Meow project settings. This key is not a Nuxt module.'
    },
    /**
     * Celebration confetti. Only the strings "yes" and "nein" are valid.
     *
     * @type {'yes' | 'nein'}
     * @default 'yes'
     */
    confetti: 'yes' as const
  }
})
