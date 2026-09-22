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

import {
  assertProviderBaseUrl,
    buildChatRequest,
    buildDeepSeekRequest,
    DEEPSEEK_CHAT_URL
}                                          from '../server/utils/providerApi';
import {isThinkingModel}                   from '../shared/utils/models';
import {resolveDefaultModel, resolveDefaultProvider} from '../app/composables/useDefaultModel';

describe('providerApi', () => {
    test('sends DeepSeek Flash to the official DeepSeek endpoint', () => {
        const request = buildDeepSeekRequest(
                'ds-test-key',
                'deepseek-flash',
                [ { role: 'user', content: 'hi' } ]
        )
        expect(request.apiUrl).toBe(DEEPSEEK_CHAT_URL)
        expect(request.apiUrl).toBe('https://api.deepseek.com/chat/completions')
        expect(request.headers.Authorization).toBe('Bearer ds-test-key')
        expect(request.body.model).toBe('deepseek-flash')
        expect(request.body.thinking).toEqual({ type: 'disabled' })

        const legacy = buildDeepSeekRequest('ds-test-key', 'deepseek-v4-flash', [ { role: 'user', content: 'hi' } ])
        expect(legacy.body.model).toBe('deepseek-flash')
    })

  test('builds OpenRouter chat requests via the OpenAI-compatible path', () => {
    const request = buildChatRequest(
        'https://openrouter.ai/api',
        'test-key',
        'google/gemini-3-flash-preview',
        [{role: 'user', content: 'hi'}],
    );
    expect(request.apiUrl).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(request.headers.Authorization).toBe('Bearer test-key');
    expect(request.body.model).toBe('google/gemini-3-flash-preview');
    expect(request.body.stream).toBe(true);
  })

  test('rejects insecure or private provider URLs unless they are explicitly allowed', () => {
    expect(() => assertProviderBaseUrl('http://example.com')).toThrow();
    expect(() => assertProviderBaseUrl('https://192.168.1.20')).toThrow();
    expect(assertProviderBaseUrl('http://localhost:11434', {allowInsecureLocalhost: true})).
        toBe('http://localhost:11434');
    expect(assertProviderBaseUrl('https://api.openai.com/v1')).toBe('https://api.openai.com/v1');
    expect(assertProviderBaseUrl('https://192.168.1.20', {allowPrivate: true})).toBe('https://192.168.1.20');
  })

  test('rejects provider URLs with embedded credentials', () => {
    expect(() => assertProviderBaseUrl('https://user:pass@openrouter.ai/api')).toThrow(/credentials/);
  })

  test('flags thinking/reasoning models for the compact loader', () => {
    expect(isThinkingModel('deepseek-reasoner')).toBe(true);
    expect(isThinkingModel('models/gemma-4-26b-a4b-it')).toBe(false);
  })

  test('resolves env-backed default provider and model values', () => {
    expect(resolveDefaultProvider('openrouter-default')).toBe('openrouter-default');
    expect(resolveDefaultProvider('')).toBe('openrouter-default');
    expect(resolveDefaultModel('google/gemini-2.5-flash')).toBe('google/gemini-2.5-flash');
    expect(resolveDefaultModel('')).toBe('google/gemini-2.5-flash');
  })
})
