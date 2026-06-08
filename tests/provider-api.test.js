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
 * @email     kolja.nolte@gmail.com
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

import {describe, expect, test} from 'bun:test';

import {
  assertProviderBaseUrl,
  buildChatRequest,
  buildModelsRequest,
  extractGoogleStreamText,
  extractModelIds,
  isGoogleProvider,
  isOpenRouterProvider,
  resolveProviderApiKey,
  normalizeGoogleModel,
}                                                    from '../server/utils/providerApi';
import {isThinkingModel}                             from '../app/composables/useProviders';
import {resolveDefaultModel, resolveDefaultProvider} from '../app/composables/useDefaultModel';

describe('providerApi', () => {
  test('detects OpenRouter providers and routes through the OpenAI-compatible path', () => {
    expect(isOpenRouterProvider('https://openrouter.ai/api')).toBe(true);
    expect(isOpenRouterProvider('https://openrouter.ai')).toBe(true);
    expect(isOpenRouterProvider('https://api.openai.com')).toBe(false);

    const request = buildChatRequest(
        'https://openrouter.ai/api',
        'test-key',
        'google/gemini-3-flash-preview',
        [{role: 'user', content: 'hi'}],
    );
    expect(request.kind).toBe('openai');
    expect(request.apiUrl).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(request.headers.Authorization).toBe('Bearer test-key');
    expect(request.body.model).toBe('google/gemini-3-flash-preview');
    expect(request.body.stream).toBe(true);
  });

  test('detects Google Generative Language providers and normalizes model listing URLs', () => {
    expect(isGoogleProvider('https://generativelanguage.googleapis.com')).toBe(true);
    expect(isGoogleProvider('https://generativelanguage.googleapis.com/v1beta/models')).toBe(true);

    const rootRequest = buildModelsRequest('https://generativelanguage.googleapis.com', 'test-key');
    const nestedRequest = buildModelsRequest('https://generativelanguage.googleapis.com/v1beta/models', 'test-key');

    expect(rootRequest).toEqual({
      kind:    'google',
      apiUrl:  'https://generativelanguage.googleapis.com/v1beta/models?key=test-key',
      headers: {},
    });

    expect(nestedRequest).toEqual({
      kind:    'google',
      apiUrl:  'https://generativelanguage.googleapis.com/v1beta/models?key=test-key',
      headers: {},
    });
  });

  test('filters Google models down to generation-capable entries', () => {
    const models = extractModelIds('google', {
      models: [
        {
          name:                       'models/gemma-4-26b-a4b-it',
          supportedGenerationMethods: ['generateContent', 'streamGenerateContent'],
        },
        {
          name:                       'models/text-embedding-004',
          supportedGenerationMethods: ['embedContent'],
        },
      ],
    });

    expect(models).toEqual(['models/gemma-4-26b-a4b-it']);
  });

  test('builds Google streaming chat requests from root and model URLs', () => {
    const request = buildChatRequest(
        'https://generativelanguage.googleapis.com/v1beta/models',
        'test-key',
        'models/gemma-4-26b-a4b-it',
        [
          {role: 'system', content: 'You are helpful.'},
          {role: 'user', content: 'Hello cat'},
          {role: 'assistant', content: 'Meow!'},
        ],
    );

    expect(request.kind).toBe('google');
    expect(request.apiUrl).
        toBe(
            'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:streamGenerateContent?alt=sse&key=test-key');
    expect(request.body).toEqual({
      contents:          [
        {role: 'user', parts: [{text: 'Hello cat'}]},
        {role: 'model', parts: [{text: 'Meow!'}]},
      ],
      systemInstruction: {
        parts: [{text: 'You are helpful.'}],
      },
    });
  });

  test('keeps OpenAI-compatible providers on the existing models path', () => {
    const request = buildModelsRequest('https://api.openai.com', 'test-key');

    expect(request).toEqual({
      kind:    'openai',
      apiUrl: 'https://api.openai.com/v1/models',
      headers: {
        Authorization: 'Bearer test-key',
      },
    });
  });

  test('rejects insecure or private provider URLs unless they are explicitly allowed', () => {
    expect(() => assertProviderBaseUrl('http://example.com')).toThrow();
    expect(() => assertProviderBaseUrl('https://192.168.1.20')).toThrow();
    expect(assertProviderBaseUrl('http://localhost:11434', {allowInsecureLocalhost: true})).
        toBe('http://localhost:11434');
    expect(assertProviderBaseUrl('https://api.openai.com/v1')).toBe('https://api.openai.com/v1');
    expect(assertProviderBaseUrl('https://192.168.1.20', {allowPrivate: true})).toBe('https://192.168.1.20');
  });

  test('resolves env-backed keys for the known default providers and keeps custom keys intact', () => {
    const secrets = {
      deepseekApiKey: 'deepseek-env-key',
      googleApiKey:   'google-env-key',
      openrouterApiKey: 'openrouter-env-key',
    };

    expect(resolveProviderApiKey(
        {providerId: 'deepseek-default', baseUrl: 'https://api.deepseek.com', clientApiKey: '', secrets})).
        toBe('deepseek-env-key');
    expect(resolveProviderApiKey({
      providerId:   'google-default',
      baseUrl:      'https://generativelanguage.googleapis.com',
      clientApiKey: '',
      secrets,
    })).toBe('google-env-key');
    expect(resolveProviderApiKey({
      providerId:   'gemini-default',
      baseUrl:      'https://generativelanguage.googleapis.com',
      clientApiKey: '',
      secrets,
    })).toBe('google-env-key');
    expect(resolveProviderApiKey({
      providerId:   'custom-google-provider',
      baseUrl:      'https://generativelanguage.googleapis.com',
      clientApiKey: 'custom-key',
      secrets,
    })).toBe('custom-key');
    expect(resolveProviderApiKey({
      providerId:   'custom-google-provider',
      baseUrl:      'https://generativelanguage.googleapis.com',
      clientApiKey: '',
      secrets,
    })).toBe('google-env-key');
    expect(resolveProviderApiKey({
      providerId: 'custom-openai-provider',
      baseUrl:    'https://api.openai.com',
      clientApiKey: '',
      secrets,
    })).toBe('');
    expect(resolveProviderApiKey({
      providerId:   'openrouter-default',
      baseUrl:      'https://openrouter.ai/api',
      clientApiKey: '',
      secrets,
    })).toBe('openrouter-env-key');
    expect(resolveProviderApiKey({
      providerId:   'custom-openrouter-provider',
      baseUrl:      'https://openrouter.ai/api',
      clientApiKey: '',
      secrets,
    })).toBe('openrouter-env-key');
  });

  test('flags thinking/reasoning models for the compact loader', () => {
    expect(isThinkingModel('deepseek-reasoner')).toBe(true);
    expect(isThinkingModel('models/gemma-4-26b-a4b-it')).toBe(false);
  });

  test('resolves env-backed default provider and model values', () => {
    expect(resolveDefaultProvider('openrouter-default')).toBe('openrouter-default');
    expect(resolveDefaultProvider('')).toBe('openrouter-default');
    expect(resolveDefaultModel('google/gemini-3-flash-preview')).toBe('google/gemini-3-flash-preview');
    expect(resolveDefaultModel('')).toBe('google/gemini-3-flash-preview');
  });

  test('extracts streamed text from Google SSE payloads', () => {
    expect(normalizeGoogleModel('gemma-4-26b-a4b-it')).toBe('models/gemma-4-26b-a4b-it');
    expect(extractGoogleStreamText({
      candidates: [
        {
          content: {
            parts: [
              {text: 'Hello'},
              {text: ' world'},
            ],
          },
        },
      ],
    })).toBe('Hello world');
  });
});

