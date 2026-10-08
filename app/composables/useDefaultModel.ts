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
 * Built-in provider and model ids, and the public runtime values that replace them.
 * A missing or empty config value falls back to OpenRouter and Gemini 3.8 Flash.
 */

/**
 * Provider id used when no public default is set.
 */
export const DEFAULT_PROVIDER_ID = 'openrouter-default'

/**
 * Model id used when no public default is set.
 */
export const DEFAULT_MODEL_ID    = 'google/gemini-3.8-flash'

/**
 * Resolves a provider id from runtime config.
 *
 * @param defaultProvider - Configured provider id, when one was set.
 * @returns That id, or `openrouter-default` when the argument is missing or empty.
 */
export function resolveDefaultProvider(defaultProvider?: string): string {
  return defaultProvider || DEFAULT_PROVIDER_ID
}

/**
 * Resolves a model id from runtime config.
 *
 * @param defaultModel - Configured model id, when one was set.
 * @returns That id, or `google/gemini-3.8-flash` when the argument is missing or empty.
 */
export function resolveDefaultModel(defaultModel?: string): string {
  return defaultModel || DEFAULT_MODEL_ID
}

/**
 * Reads the configured default provider.
 *
 * @returns A computed id from `public.defaultProvider`, using the built-in fallback.
 */
export function useDefaultProvider() {
  const config = useRuntimeConfig()
  return computed(() => resolveDefaultProvider(config.public.defaultProvider))
}

/**
 * Reads the configured default model.
 *
 * @returns A computed id from `public.defaultModel`, using the built-in fallback.
 */
export function useDefaultModel() {
  const config = useRuntimeConfig()
  return computed(() => resolveDefaultModel(config.public.defaultModel))
}

