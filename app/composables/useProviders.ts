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

import type { LLMProvider } from '~/types'

/**
 * Local storage key for persisting provider configurations (endpoints and keys).
 */
const STORAGE_KEY = 'chat-yanawa-providers'
const DEFAULT_PROVIDER_IDS = new Set([ 'deepseek-default', 'groq-default', 'google-default', 'gemini-default' ])

/**
 * Hardcoded fallback providers used for initial app state.
 * Includes DeepSeek and Groq with public-facing/default API configurations.
 */
const DEFAULT_PROVIDERS: LLMProvider[] = [
  {
    id:       'deepseek-default',
    name:     'DeepSeek',
    baseUrl:  'https://api.deepseek.com',
    apiKey:   '',
    models:   [ 'deepseek-chat', 'deepseek-reasoner' ],
    isActive: true,
    createdAt: Date.now()
  },
  {
    id:      'groq-default',
    name:    'Groq',
    baseUrl: 'https://api.groq.com/openai',
    apiKey:    '',
    models:  [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'deepseek-r1-distill-llama-70b',
      'deepseek-r1-distill-qwen-32b'
    ],
    isActive:  true,
    createdAt: Date.now()
  },
  {
    id:       'gemini-default',
    name:     'Gemini',
    baseUrl:  'https://generativelanguage.googleapis.com',
    apiKey:   '',
    models:   [ 'models/gemini-3.1-flash-lite-preview', 'models/gemma-4-26b-a4b-it' ],
    isActive: true,
    createdAt: Date.now()
  }
]

function isGoogleProvider(baseUrl: string): boolean {
  return baseUrl.includes('generativelanguage.googleapis.com')
}

/** Identifies model IDs that expose chain-of-thought / reasoning style output. */
export function isThinkingModel(modelId: string): boolean {
  const normalized = modelId.replace(/^models\//, '').toLowerCase()
  return [ /reasoner/, /thinking/, /deepseek-r1/, /r1-distill/ ].some(pattern => pattern.test(normalized))
}

/** Generates a simple base36 unique ID for new providers */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

/**
 * Hydrates provider state from browser storage.
 * Falls back to DEFAULT_PROVIDERS if nothing is found locally.
 */
function loadProviders(): LLMProvider[] {
  if (import.meta.server) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed    = JSON.parse(raw)
      const sanitized = Array.isArray(parsed)
          ? parsed.map((provider: LLMProvider) => {
            if (provider.id==='google-default') {
              return {
                ...provider,
                id:     'gemini-default',
                name:   'Gemini',
                apiKey: ''
              }
            }

            return DEFAULT_PROVIDER_IDS.has(provider.id)
                ? { ...provider, apiKey: '' }
                : provider
          })
          : []
      return sanitized.length > 0 ? sanitized: DEFAULT_PROVIDERS
    }
    return DEFAULT_PROVIDERS
  } catch {
    return DEFAULT_PROVIDERS
  }
}

/** Perists the current set of providers to browser localStorage */
function saveProviders(providers: LLMProvider[]) {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers))
}

/**
 * Utility to prettify technical model IDs for the UI.
 * Maps known IDs to friendly names or transforms kebab-case to title-case.
 */
export function formatModelName(modelId: string): string {
  if (!modelId) return ''
  const normalizedId                        = modelId.replace(/^models\//, '').replace(/\s*\(preview\)\s*/gi, '').trim()
  const customNames: Record<string, string> = {
    'deepseek-chat':                'DeepSeek Chat',
    'deepseek-reasoner':            'DeepSeek Reasoner',
    'llama-3.3-70b-versatile':      'Llama 3.3 70B',
    'llama-3.1-8b-instant':         'Llama 3.1 8B',
    'mixtral-8x7b-32768':           'Mixtral 8x7B',
    'gemma2-9b-it':                 'Gemma 2 9B',
    'gemma-4-26b-a4b-it':           'Gemma 4 26B A4B',
    'deepseek-r1-distill-llama-70b': 'DeepSeek R1 Llama 70B',
    'deepseek-r1-distill-qwen-32b': 'DeepSeek R1 Qwen 32B'
  }
  if (customNames[modelId]) return customNames[modelId]!
  if (customNames[normalizedId]) return customNames[normalizedId]!

  // Generic transformation for unknown models
  return normalizedId
  .split('-')
  .filter(word => ![ 'versatile', 'distill', 'distilled', 'it', 'instant', 'latest', 'preview' ].includes(word.toLowerCase()))
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')
}

/**
 * Main composable for managing AI service providers.
 * Handles model discovery, provider lifecycle, and shared model availability state.
 */
export function useProviders() {
  const providers = useState<LLMProvider[]>('providers', () => [])
  const isLoaded = useState('providers-loaded', () => false)

  // Initialize state on client-side mount
  if (import.meta.client && !isLoaded.value) {
    const loaded = loadProviders()
    // Migration: ensure Groq is present even for legacy users who might have lost it
    if (!loaded.find(p => p.id==='groq-default')) {
      loaded.push(DEFAULT_PROVIDERS[1]!)
    }
    // Migration: ensure Gemini is present for testing Gemini/Gemma models
    if (!loaded.find(p => p.id==='gemini-default')) {
      loaded.push(DEFAULT_PROVIDERS[2]!)
    }
    providers.value = loaded
    isLoaded.value = true
    saveProviders(loaded)

    for (const provider of loaded) {
      if (provider.isActive && (provider.models.length===0 || provider.id==='google-default' || isGoogleProvider(provider.baseUrl))) {
        fetchModels(provider.id)
      }
    }
  }

  /** Registers a new LLM provider with custom base URL and credentials */
  function addProvider(data: { name: string; baseUrl: string; apiKey: string }) {
    const provider: LLMProvider = {
      id:       generateId(),
      name:     data.name,
      baseUrl:  data.baseUrl.replace(/\/+$/, ''), // Clean trailing slashes
      apiKey:   data.apiKey,
      models:   [],
      isActive: true,
      createdAt: Date.now()
    }
    providers.value.push(provider)
    saveProviders(providers.value)
    return provider
  }

  /** Updates existing provider properties. Partial updates are supported. */
  function updateProvider(id: string, data: Partial<LLMProvider>) {
    const index = providers.value.findIndex(p => p.id===id)
    if (index!== -1 && providers.value[index]) {
      providers.value[index] = { ...providers.value[index] as LLMProvider, ...data }
      saveProviders(providers.value)
    }
  }

  /** Permanently deletes a provider and its associated model cache */
  function removeProvider(id: string) {
    providers.value = providers.value.filter(p => p.id!==id)
    saveProviders(providers.value)
  }

  /**
   * Asks the backend to query the provider's /models endpoint.
   * Updates the local cache of available models for the specified provider.
   */
  async function fetchModels(providerId: string): Promise<string[]> {
    const provider = providers.value.find(p => p.id===providerId)
    if (!provider) return []

    try {
      const response = await $fetch<{ models: string[] }>('/api/models', {
        method: 'POST',
        body: {
          baseUrl: provider.baseUrl,
          apiKey:     provider.apiKey,
          providerId: provider.id
        }
      })
      const models   = response.models || []
      const index    = providers.value.findIndex(p => p.id===providerId)
      if (index!== -1) {
        providers.value[index] = { ...providers.value[index]!, models }
        saveProviders(providers.value)
      }
      return models
    } catch (error) {
      console.error('Failed to fetch models from provider:', error)
      return provider.models || []
    }
  }

  /** Accesses only providers that currently have their isActive flag set to true */
  const activeProviders = computed(() => providers.value.filter(p => p.isActive))

  /**
   * Flattens models from all active providers into a single list for global selection.
   * Includes provider metadata for context in selection menus.
   */
  const allModels = computed(() => {
    const models: Array<{ providerId: string; providerName: string; model: string }> = []
    for (const provider of activeProviders.value) {
      for (const model of provider.models) {
        models.push({
          providerId: provider.id,
          providerName: provider.name,
          model
        })
      }
    }
    return models
  })

  /** Simple selector for finding a provider by ID */
  function getProvider(id: string): LLMProvider | undefined {
    return providers.value.find(p => p.id===id)
  }

  return {
    providers,
    activeProviders,
    allModels,
    addProvider,
    updateProvider,
    removeProvider,
    fetchModels,
    getProvider,
    formatModelName
  }
}
