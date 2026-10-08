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

import { readFileSync }         from 'node:fs'
import { describe, expect, it } from 'vitest'

import { shouldShowConfetti } from '../../shared/utils/celebration'

describe('shouldShowConfetti', () => {
  it('stays off until a successful login raises the sequence', () => {
    expect(shouldShowConfetti(0)).toBe(false)
    expect(shouldShowConfetti(-1)).toBe(false)
    expect(shouldShowConfetti(1)).toBe(true)
  })

  it('does not keep a meo.confetti flag in the shell or Nuxt config', () => {
    const appVue     = readFileSync(new URL('../../app/app.vue', import.meta.url), 'utf8')
    const nuxtConfig = readFileSync(new URL('../../nuxt.config.ts', import.meta.url), 'utf8')

    expect(appVue).not.toContain('useMeo')
    expect(appVue).not.toContain('confetti === \'yes\'')
    expect(appVue).toContain('shouldShowConfetti')
    expect(nuxtConfig).not.toContain('meo.confetti')
    expect(nuxtConfig).not.toContain('copyMeoToPublicRuntimeConfig')
  })
})
