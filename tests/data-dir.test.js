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

import {resolveDataDirPath} from '../server/utils/dataDir';

describe('dataDir', () => {
  test('prefers the configured data directory over the current working directory', () => {
    expect(resolveDataDirPath('/tmp/meow-data', '/tmp/app/.output')).toBe('/tmp/meow-data');
  });

  test('falls back to cwd/.data when no explicit directory is configured', () => {
    expect(resolveDataDirPath(undefined, '/tmp/app/.output')).toBe('/tmp/app/.output/.data');
  });
});
