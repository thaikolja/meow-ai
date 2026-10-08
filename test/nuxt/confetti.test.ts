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

import { ConfettiRain }         from '#components'
import { mountSuspended }       from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

describe('ConfettiRain', () => {
  it('draws no pieces for the burst id that exists before login', async () => {
    const hidden = await mountSuspended(ConfettiRain, {
      props: { burstId: 0 }
    })

    expect(hidden.find('.confetti-piece').exists()).toBe(false)
  })

  it('draws a burst when login mounts it with a positive id', async () => {
    const shown = await mountSuspended(ConfettiRain, {
      props: { burstId: 1 }
    })

    expect(shown.findAll('.confetti-piece')).toHaveLength(64)
  })
})
