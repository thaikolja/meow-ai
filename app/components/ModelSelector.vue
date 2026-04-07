<!--
  - Copyright (C) 2026 Kolja Nolte
  - https://meow.yanawa.io
  - info@meow.yanawa.io
  -
  - This work is licensed under the MIT License. You are free to use, modify,
  - and distribute this work, provided that you include the copyright notice
  - and this permission notice in all copies or substantial portions of the work.
  - For more information, visit https://opensource.org/licenses/MIT
  -
  - @author    Kolja Nolte
  - @email     kolja.nolte@gmail.com
  - @license   MIT
  - @date      2026
  - @website   https://meow.yanawa.io
  -->

<template>
  <div ref="dropdownContainer" class="relative z-50 min-w-0 max-w-full">
    <!-- Trigger Button -->
    <button
        class="relative z-50 flex min-w-0 max-w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800" type="button" @click.stop="isOpen = !isOpen">
      <Icon class="w-4 h-4 text-primary-400" name="mdi:cat" />
      <span class="max-w-[11rem] truncate sm:max-w-50">{{ displayLabel || 'Pick a Meow-del' }}</span>
      <Icon :class="['w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180']" name="lucide:chevron-down" />
    </button>

    <!-- Dropdown Menu -->
    <div
        v-if="isOpen" class="absolute top-full left-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-60 overflow-hidden">
      <!-- Model Search -->
      <div class="p-2 border-b border-zinc-800">
        <input
            v-model="search" class="w-full bg-zinc-800 rounded-lg px-3 py-2 text-base sm:text-sm text-zinc-200 placeholder-zinc-500 outline-none ring-1 ring-zinc-700 focus:ring-primary-500 transition-colors" placeholder="Sniff for meow-dels... 🐾" @click.stop />
      </div>

      <!-- Scrollable List of Models grouped by Provider -->
      <div class="max-h-64 overflow-y-auto p-1">
        <div v-if="filteredModels.length === 0" class="px-3 py-4 text-center text-zinc-500 text-sm">
          <template v-if="activeModels.length === 0">
            No models configured.
            <button class="text-primary-400 hover:underline cursor-pointer" type="button" @click="openSettings">Add one
              🐾
            </button>
          </template>
          <template v-else>No meow-dels match your sniff 🐾</template>
        </div>

        <div v-for="providerGroup in groupedModels" :key="providerGroup.providerId">
          <div class="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {{ providerGroup.providerName }}
          </div>
          <button
              v-for="model in providerGroup.models" :key="model.id" :class="[
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
              isSelected(model.providerId, model.id)
                ? 'bg-primary-600/20 text-primary-300'
                : 'text-zinc-300 hover:bg-zinc-800'
            ]" type="button" @click.stop="selectModel(model.providerId, model.id)">
            <Icon
                :name="isSelected(model.providerId, model.id) ? 'lucide:check-circle-2' : 'lucide:circle'" class="w-4 h-4 shrink-0" />
            <span class="truncate">{{ model.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Component for selecting the active AI model from configured providers.
   * Includes search functionality and groups models under their respective providers.
   */

  import { onMounted, onUnmounted, ref, computed, watchEffect } from 'vue'

  const { activeProviders, getProvider, loadProviders } = useProviders()
  const { activeModels, getModel, loadModels }          = useModels()
  const defaultProvider            = useDefaultProvider()
  const defaultModel               = useDefaultModel()
  const dropdownContainer          = ref<HTMLElement | null>(null)

  // Shared state for the currently active model and provider
  const selectedModel = useState<string>('selected-model', () => defaultModel.value)
  const selectedProvider = useState<string>('selected-provider', () => defaultProvider.value)
  const settingsOpen  = useState('settings-open', () => false)

  // Local UI state
  const isOpen = ref(false)
  const search = ref('')

  /**
   * Event listener to close the dropdown when clicking outside its bounds.
   */
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownContainer.value && !event.composedPath().includes(dropdownContainer.value)) {
      isOpen.value = false
    }
  }

  onMounted(() => {
    void Promise.all([
      loadProviders(),
      loadModels()
    ])
    window.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside)
  })

  watchEffect(() => {
    if (!selectedProvider.value) {
      selectedProvider.value = defaultProvider.value
    }

    const provider = getProvider(selectedProvider.value) || activeProviders.value[0]
    if (!provider) return

    if (provider.id!==selectedProvider.value) {
      selectedProvider.value = provider.id
    }

    const providerModels = activeModels.value.filter(m => m.providerId===provider.id)
    if (providerModels.length===0) return

    const modelIds = providerModels.map(m => m.id)
    if (!modelIds.includes(selectedModel.value)) {
      const defaultExists = modelIds.includes(defaultModel.value)
      selectedModel.value = defaultExists ? defaultModel.value: providerModels[0]!.id
    }
  })

  /** Human-readable label for the trigger button reflecting the choice */
  const displayLabel = computed(() => {
    if (!selectedModel.value) return 'Pick a Meow-del 🐾'
    const model = getModel(selectedModel.value)
    return model?.name || selectedModel.value
  })

  /**
   * Computes the models list filtered by the user's search string.
   * Checks both model names and provider names for hits.
   */
  const filteredModels = computed(() => {
    const q = search.value.toLowerCase()
    if (!q) return activeModels.value
    return activeModels.value.filter(m => {
      const modelName = m.name.toLowerCase()
      const provider  = getProvider(m.providerId)
      const providerName = provider?.name.toLowerCase() || ''
      return modelName.includes(q) || providerName.includes(q) || m.id.toLowerCase().includes(q)
    })
  })

  /**
   * Organizes filtered models into nested arrays based on provider.
   * Facilitates hierarchical rendering in the UI.
   */
  const groupedModels = computed(() => {
    const groups: Record<string, { providerId: string; providerName: string; models: typeof activeModels.value }> = {}
    for (const m of filteredModels.value) {
      if (!groups[m.providerId]) {
        const provider       = getProvider(m.providerId)
        groups[m.providerId] = {
          providerId:   m.providerId,
          providerName: provider?.name || m.providerId,
          models:       []
        }
      }
      groups[m.providerId]!.models.push(m)
    }
    return Object.values(groups)
  })

  /** Helper function to determine if a specific model row is currently active */
  function isSelected(providerId: string, modelId: string) {
    return selectedProvider.value===providerId && selectedModel.value===modelId
  }

  /**
   * Persists user choice to shared state and closes the menu.
   */
  function selectModel(providerId: string, modelId: string) {
    selectedProvider.value = providerId
    selectedModel.value = modelId
    isOpen.value        = false
  }

  /**
   * Redirects the user to the settings modal for provider configuration.
   */
  function openSettings() {
    isOpen.value = false
    settingsOpen.value = true
  }
</script>
