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

import {assertProductionRuntimeSecrets} from '../server/utils/runtimeConfigValidation';

describe('runtimeConfigValidation', () => {
  test('allows missing app password outside production', () => {
    expect(() => assertProductionRuntimeSecrets({}, 'development')).not.toThrow();
  });

  test('requires app password in production', () => {
    expect(() => assertProductionRuntimeSecrets({}, 'production')).
        toThrow('NUXT_APP_PASSWORD environment variable is required in production');
  });

  test('accepts a trimmed app password in production', () => {
    expect(() => assertProductionRuntimeSecrets({appPassword: '  meow-secret  '}, 'production')).not.toThrow();
  });
});
