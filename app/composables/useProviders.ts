/*
 * Copyright (C) 2026 Kolja Nolte
 * https://meow.yanawa.io
 * info@meow.yanawa.io
 *
 * This work is licensed under the MIT License. You are free to use, modify,
 * and distribute this work, provided that you include the copyright notice
 * and this permission notice in all copies or substantial portions of the work.
 * For more information, visit https://opensource.org/licenses/MIT
 *
 * @author    Kolja Nolte
 * @email     kolja.nolte@gmail.com
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

import type { LLMProvider } from '~/types'

/**
 * Provider type without sensitive API key - safe for client-side storage.
 */
type ProviderSafe = Omit<LLMProvider, 'apiKey'>

/**
 * Main composable for managing AI service providers.
 * API keys are now stored encrypted server-side; client only holds non-sensitive data.
 * Models are managed separately via useModels composable.
 */
export function useProviders() {
  /** Reactive state holding all providers (without API keys) */
  const providers = useState<ProviderSafe[]>('providers', () => [])
  const isLoaded = useState('providers-loaded', () => false)

  // Hydrate state from server API on client-side mount
  if (import.meta.client && !isLoaded.value) {
    loadProviders()
  }

  /** Fetches providers from server-side encrypted storage */
  async function loadProviders() {
    try {
      const response = await $fetch<{ providers: ProviderSafe[] }>('/api/providers')
      providers.value = response.providers || []
      isLoaded.value = true
    } catch (error) {
      console.error('Failed to load providers:', error)
      providers.value = []
      isLoaded.value = true
    }
  }

  /** Registers a new LLM provider with custom base URL and credentials */
  async function addProvider(data: { name: string; baseUrl: string; apiKey: string }): Promise<ProviderSafe> {
    const response = await $fetch<{ provider: ProviderSafe }>('/api/providers', {
      method: 'POST',
      body: {
        name: data.name,
        baseUrl: data.baseUrl.replace(/\/+$/, ''),
        apiKey: data.apiKey
      }
    })
    const provider = response.provider
    providers.value = [...providers.value, provider]
    return provider
  }

  /** Updates existing provider properties. Partial updates are supported. */
  async function updateProvider(id: string, data: Partial<LLMProvider> & { apiKey?: string }) {
    const index = providers.value.findIndex(p => p.id === id)
    if (index === -1) return

    // Only send safe fields to server; apiKey only sent if explicitly updating
    const body: Record<string, unknown> = {}
    if (data.name !== undefined) body.name = data.name
    if (data.baseUrl !== undefined) body.baseUrl = data.baseUrl
    if (data.apiKey !== undefined) body.apiKey = data.apiKey
    if (data.isActive !== undefined) body.isActive = data.isActive

    const response = await $fetch<{ provider: ProviderSafe }>(`/api/providers/${id}`, {
      method: 'PUT',
      body
    })

    providers.value = [
      ...providers.value.slice(0, index),
      response.provider,
      ...providers.value.slice(index + 1)
    ]
  }

  /** Permanently deletes a provider */
  async function removeProvider(id: string) {
    await $fetch(`/api/providers/${id}`, { method: 'DELETE' })
    providers.value = providers.value.filter(p => p.id !== id)
  }

  /** Accesses only providers that currently have their isActive flag set to true */
  const activeProviders = computed(() => providers.value.filter(p => p.isActive))

  /** Simple selector for finding a provider by ID */
  function getProvider(id: string): ProviderSafe | undefined {
    return providers.value.find(p => p.id === id)
  }

  /** Check if provider has an API key configured (server-side check) */
  function hasApiKey(providerId: string): boolean {
    // Default providers may use env secrets, always return true
    const defaultIds = ['deepseek-default', 'groq-default', 'google-default', 'gemini-default']
    if (defaultIds.includes(providerId)) return true
    // For custom providers, we assume they have a key if they exist
    // The actual validation happens server-side
    return providers.value.some(p => p.id === providerId)
  }

  return {
    providers,
    activeProviders,
    addProvider,
    updateProvider,
    removeProvider,
    getProvider,
    hasApiKey,
    loadProviders
  }
}

/** Identifies model IDs that expose chain-of-thought / reasoning style output. */
export function isThinkingModel(modelId: string): boolean {
  const normalized = modelId.replace(/^models\//, '').toLowerCase()
  return [/reasoner/, /thinking/, /deepseek-r1/, /r1-distill/].some(pattern => pattern.test(normalized))
}
