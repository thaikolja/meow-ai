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
 * Fails when a project `.ts` or `.js` function has no JSDoc summary,
 * is missing `@param` for a parameter, or returns a value without `@returns`.
 */

import { describe, expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

import { findJsDocGaps } from './jsdoc-coverage.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

describe('JSDoc on project scripts', () => {
  test('every function has a summary, parameters, and a return tag when it returns', () => {
    expect(findJsDocGaps(ROOT)).toEqual([])
  })
})
