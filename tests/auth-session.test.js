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

import {shouldUseSecureCookies} from '../server/utils/authSession';

describe('authSession', () => {
  test('disables secure cookies for localhost preview requests', () => {
    expect(shouldUseSecureCookies({host: 'localhost:3000'})).toBe(false);
    expect(shouldUseSecureCookies({host: '127.0.0.1:3000'})).toBe(false);
    expect(shouldUseSecureCookies({host: '[::1]:3000'})).toBe(false);
  });

  test('keeps secure cookies enabled for HTTPS and proxied HTTPS requests', () => {
    expect(shouldUseSecureCookies({encrypted: true, host: 'localhost:3000'})).toBe(true);
    expect(shouldUseSecureCookies({forwardedProto: 'https', host: 'app.example.com'})).toBe(true);
  });

  test('defaults to secure cookies for non-local production hosts', () => {
    expect(shouldUseSecureCookies({host: 'meow.yanawa.io'})).toBe(true);
  });
});

