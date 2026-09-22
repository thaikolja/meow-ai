<!--
  - Copyright (C) 2026 Kolja Nolte
  - https://meow.yanawa.io
  - info@meow.yanawa.io
  -
  - This work is licensed under the MIT License. You are free to use, modify,
  - and distribute this work, provided that you include the copyright notice
  - and this permission notice in all copies or substantial portions of the work.
  - For more information, visit: https://opensource.org/licenses/MIT
  -
  - @author    Kolja Nolte
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

      <!-- Scrollable List of Models -->
      <div class="max-h-64 overflow-y-auto p-1">
        <div v-if="activeModels.length === 0" class="px-3 py-4 text-center text-zinc-500 text-sm">
          No models configured.
        </div>

        <div v-else-if="filteredModels.length === 0" class="px-3 py-4 text-center text-zinc-500 text-sm">
          No meow-dels match your sniff 🐾
        </div>

        <button
            v-for="model in filteredModels" :key="model.id" :class="[
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
            isSelected(model.id)
              ? 'bg-primary-600/20 text-primary-300'
              : 'text-zinc-300 hover:bg-zinc-800'
          ]" type="button" @click.stop="selectModel(model.id)">
          <Icon
              :name="isSelected(model.id) ? 'lucide:check-circle-2' : 'lucide:circle'" class="w-4 h-4 shrink-0" />
          <span class="truncate">{{ model.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Searchable model picker. All models are routed through OpenRouter.
   * Inside a chat, the pick is stored on that chat only.
   * On the landing page it updates the default used for new chats.
   */

  import { onMounted, onUnmounted, ref, computed, watchEffect } from 'vue'
  import { chatSessionKey, displayedModelId } from '#shared/utils/sessionModel'

  const route                     = useRoute()
  const { getChat, setChatModel } = useChats()
  const { rememberSessionModel, recallSessionModel } = useSessionModel()
  const { activeModels, getModel, loadModels } = useModels()
  const { selectedModel: persistedModel, setSelectedModel } = useSettings()
  const defaultModel                           = useDefaultModel()
  const dropdownContainer                      = ref<HTMLElement | null>(null)

  // Global default for new chats. A chat session does not write this.
  const selectedModel = useState<string>('selected-model', () => persistedModel.value || defaultModel.value)

  const globalModel = computed(() => selectedModel.value || persistedModel.value || defaultModel.value)

  const openChat = computed(() => {
    const key = chatSessionKey(route.path)
    return key ? getChat(key) : undefined
  })

  const displayedModel = computed(() => displayedModelId({
    path:        route.path,
    chatModel: (openChat.value && recallSessionModel(openChat.value.id)) || openChat.value?.model,
    globalModel: globalModel.value
  }))

  // Local UI state
  const isOpen = ref(false)
  const search = ref('')

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownContainer.value && !event.composedPath().includes(dropdownContainer.value)) {
      isOpen.value = false
    }
  }

  onMounted(() => {
    void loadModels()
    window.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside)
  })

  // Ensure the selected model stays valid as the catalog and persisted settings load.
  // Priority: persisted preference (from localStorage) > env default > first available model.
  // This handles the SSR → client hydration race by re-running whenever either input changes.
  watchEffect(() => {
    if (activeModels.value.length===0) return

    const modelIds = activeModels.value.map(m => m.id)

    if (persistedModel.value && modelIds.includes(persistedModel.value)) {
      if (selectedModel.value!==persistedModel.value) {
        selectedModel.value = persistedModel.value
      }
      return
    }

    if (!modelIds.includes(selectedModel.value)) {
      const defaultExists = modelIds.includes(defaultModel.value)
      selectedModel.value = defaultExists ? defaultModel.value: modelIds[0]!
    }
  })

  const displayLabel = computed(() => {
    if (!displayedModel.value) return 'Pick a Meow-del 🐾'
    const model = getModel(displayedModel.value)
    return model?.name || displayedModel.value
  })

  const filteredModels = computed(() => {
    const q = search.value.toLowerCase()
    if (!q) return activeModels.value
    return activeModels.value.filter(m =>
        m.name.toLowerCase().includes(q)
        || m.id.toLowerCase().includes(q)
    )
  })

  function isSelected(modelId: string) {
    return displayedModel.value === modelId
  }

  function selectModel(modelId: string) {
    const chat = openChat.value
    if (chat) {
      setChatModel(chat.id, modelId)
      rememberSessionModel(chat.id, modelId)
    } else if (!chatSessionKey(route.path)) {
      selectedModel.value = modelId
      setSelectedModel(modelId)
    }

    isOpen.value = false
  }
</script>
