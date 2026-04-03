import type { LLMProvider } from '~/types'

const STORAGE_KEY = 'chat-yanawa-providers'

const DEFAULT_PROVIDERS: LLMProvider[] = [
  {
    id: 'deepseek-default',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    apiKey: 'REDACTED',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    isActive: true,
    createdAt: Date.now()
  },
  {
    id: 'groq-default',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai',
    apiKey: 'REDACTED',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'deepseek-r1-distill-llama-70b',
      'deepseek-r1-distill-qwen-32b'
    ],
    isActive: true,
    createdAt: Date.now()
  }
]

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function loadProviders(): LLMProvider[] {
  if (import.meta.server) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.length > 0 ? parsed : DEFAULT_PROVIDERS
    }
    return DEFAULT_PROVIDERS
  } catch {
    return DEFAULT_PROVIDERS
  }
}

function saveProviders(providers: LLMProvider[]) {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers))
}

export function useProviders() {
  const providers = useState<LLMProvider[]>('providers', () => [])
  const isLoaded = useState('providers-loaded', () => false)

  // Load from localStorage on client
  if (import.meta.client && !isLoaded.value) {
    const loaded = loadProviders()
    // Ensure Groq default is present for existing users
    if (!loaded.find(p => p.id === 'groq-default')) {
      loaded.push(DEFAULT_PROVIDERS[1]!)
    }
    providers.value = loaded
    isLoaded.value = true
  }

  function addProvider(data: { name: string; baseUrl: string; apiKey: string }) {
    const provider: LLMProvider = {
      id: generateId(),
      name: data.name,
      baseUrl: data.baseUrl.replace(/\/+$/, ''),
      apiKey: data.apiKey,
      models: [],
      isActive: true,
      createdAt: Date.now()
    }
    providers.value.push(provider)
    saveProviders(providers.value)
    return provider
  }

  function updateProvider(id: string, data: Partial<LLMProvider>) {
    const index = providers.value.findIndex(p => p.id === id)
    if (index !== -1 && providers.value[index]) {
      providers.value[index] = { ...providers.value[index] as LLMProvider, ...data }
      saveProviders(providers.value)
    }
  }

  function removeProvider(id: string) {
    providers.value = providers.value.filter(p => p.id !== id)
    saveProviders(providers.value)
  }

  async function fetchModels(providerId: string): Promise<string[]> {
    const provider = providers.value.find(p => p.id === providerId)
    if (!provider) return []

    try {
      const response = await $fetch<{ models: string[] }>('/api/models', {
        method: 'POST',
        body: {
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey
        }
      })
      const models = response.models || []
      const index = providers.value.findIndex(p => p.id === providerId)
      if (index !== -1) {
        providers.value[index] = { ...providers.value[index]!, models }
        saveProviders(providers.value)
      }
      return models
    } catch (error) {
      console.error('Failed to fetch models:', error)
      return provider.models || []
    }
  }

  const activeProviders = computed(() => providers.value.filter(p => p.isActive))

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

  function getProvider(id: string): LLMProvider | undefined {
    return providers.value.find(p => p.id === id)
  }

  return {
    providers,
    activeProviders,
    allModels,
    addProvider,
    updateProvider,
    removeProvider,
    fetchModels,
    getProvider
  }
}
