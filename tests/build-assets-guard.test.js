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

import {describe, expect, test} from 'bun:test';

import {isBareBuildAssetsPath} from '../server/utils/buildAssetsGuard';

describe('buildAssetsGuard', () => {
  test('matches only the bare Nuxt asset directory path', () => {
    expect(isBareBuildAssetsPath('/_nuxt')).toBe(true);
    expect(isBareBuildAssetsPath('/_nuxt/')).toBe(true);
    expect(isBareBuildAssetsPath('/_nuxt/app.js')).toBe(false);
    expect(isBareBuildAssetsPath('/_nuxt/builds/meta/test.json')).toBe(false);
    expect(isBareBuildAssetsPath('/favicon.svg')).toBe(false);
  });
});
