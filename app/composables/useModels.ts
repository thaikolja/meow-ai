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

/**
 * Composable for managing available models from server-side storage.
 * Models are stored in .data/models.json with human-readable names.
 */

import { THINKING_MODEL_PATTERNS } from '#shared/utils/models'

export type Model = {
  id: string
  name: string
  providerId: string
  isActive: boolean
}

export function useModels() {
  const models = useState<Model[]>('models', () => [])
  const isLoaded = useState('models-loaded', () => false)

  // Hydrate state from server API on client-side mount
  if (import.meta.client && !isLoaded.value) {
    loadModels()
  }

  /** Fetches models from server-side storage */
  async function loadModels() {
    try {
      const response = await $fetch<{ models: Model[] }>('/api/models')
      models.value = response.models || []
      isLoaded.value = true
    } catch (error) {
      console.error('Failed to load models:', error)
      models.value = []
      isLoaded.value = true
    }
  }

  /** Get only active models */
  const activeModels = computed(() => models.value.filter(m => m.isActive))

  /** Get model by ID */
  function getModel(id: string): Model | undefined {
    return models.value.find(m => m.id===id)
  }

  /** Get models for a specific provider */
  function getModelsByProvider(providerId: string): Model[] {
    return activeModels.value.filter(m => m.providerId===providerId)
  }

  /** Get human-readable name for a model ID */
  function getModelName(modelId: string): string {
    const model = getModel(modelId)
    return model?.name || modelId
  }

  /** Check if a model is a "thinking" model (chain-of-thought) */
  function isThinkingModel(modelId: string): boolean {
    const normalized = modelId.replace(/^models\//, '').toLowerCase()
    return THINKING_MODEL_PATTERNS.some(pattern => pattern.test(normalized))
  }

  return {
    models,
    activeModels,
    loadModels,
    getModel,
    getModelsByProvider,
    getModelName,
    isThinkingModel
  }
}
