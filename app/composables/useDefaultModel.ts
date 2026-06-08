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

export const DEFAULT_PROVIDER_ID = 'openrouter-default'
export const DEFAULT_MODEL_ID    = 'google/gemini-3-flash-preview'

export function resolveDefaultProvider(defaultProvider?: string): string {
  return defaultProvider || DEFAULT_PROVIDER_ID
}

export function resolveDefaultModel(defaultModel?: string): string {
  return defaultModel || DEFAULT_MODEL_ID
}

export function useDefaultProvider() {
  const config = useRuntimeConfig()
  return computed(() => resolveDefaultProvider(config.public.defaultProvider))
}

export function useDefaultModel() {
  const config = useRuntimeConfig()
  return computed(() => resolveDefaultModel(config.public.defaultModel))
}

