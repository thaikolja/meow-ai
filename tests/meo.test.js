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
 * Covers the `meo.confetti` guard and the copy onto public runtime config.
 */

import { describe, expect, test } from 'bun:test'

import { assertMeoConfetti, copyMeoToPublicRuntimeConfig } from '../shared/utils/meoConfig'
import { isMeoConfetti } from '../shared/types/meo'

describe('meo.confetti', () => {
  test('accepts only the strings yes and nein', () => {
    expect(isMeoConfetti('yes')).toBe(true)
    expect(isMeoConfetti('nein')).toBe(true)
    expect(assertMeoConfetti('yes')).toBe('yes')
    expect(assertMeoConfetti('nein')).toBe('nein')
    expect(isMeoConfetti(true)).toBe(false)
    expect(isMeoConfetti('no')).toBe(false)
    expect(() => assertMeoConfetti(true)).toThrow(/yes/)
    expect(() => assertMeoConfetti(undefined)).toThrow(/yes/)
  })

  test('copies the top-level value onto public runtime config', () => {
    const options = {
      meo:           { confetti: 'nein' },
      runtimeConfig: { public: {} }
    }

    expect(copyMeoToPublicRuntimeConfig(options)).toEqual({ confetti: 'nein' })
    expect(options.runtimeConfig.public.meo).toEqual({ confetti: 'nein' })
    expect(() => copyMeoToPublicRuntimeConfig({
      meo:           { confetti: false },
      runtimeConfig: { public: {} }
    })).toThrow(/yes/)
  })
})
