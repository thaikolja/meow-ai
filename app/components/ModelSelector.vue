<template>
  <div class="relative" ref="dropdownContainer">
    <button
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-sm text-neutral-300"
      @click="isOpen = !isOpen"
    >
      <Icon name="lucide:bot" class="w-4 h-4 text-primary-400" />
      <span class="max-w-[200px] truncate">{{ displayLabel }}</span>
      <Icon name="lucide:chevron-down" :class="['w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180']" />
    </button>

    <!-- Dropdown -->
    <Transition name="sidebar">
      <div
        v-if="isOpen"
        class="absolute top-full left-0 mt-1 w-72 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden"
      >
        <div class="p-2 border-b border-neutral-800">
          <input
            v-model="search"
            class="w-full bg-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none ring-1 ring-neutral-700 focus:ring-primary-500 transition-colors"
            placeholder="Search models..."
            @click.stop
          />
        </div>

        <div class="max-h-64 overflow-y-auto p-1">
          <div v-if="filteredModels.length === 0" class="px-3 py-4 text-center text-neutral-500 text-sm">
            <template v-if="allModels.length === 0">
              No providers configured.
              <button class="text-primary-400 hover:underline" @click="openSettings">Add one</button>
            </template>
            <template v-else>No models match your search</template>
          </div>

          <template v-for="provider in groupedModels" :key="provider.providerId">
            <div class="px-3 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {{ provider.providerName }}
            </div>
            <button
              v-for="model in provider.models"
              :key="model"
              :class="[
                'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                isSelected(provider.providerId, model)
                  ? 'bg-primary-600/20 text-primary-300'
                  : 'text-neutral-300 hover:bg-neutral-800'
              ]"
              @click="selectModel(provider.providerId, model)"
            >
              <Icon
                :name="isSelected(provider.providerId, model) ? 'lucide:check-circle-2' : 'lucide:circle'"
                class="w-4 h-4 shrink-0"
              />
              <span class="truncate">{{ model }}</span>
            </button>
          </template>
        </div>
      </div>
    </Transition>

    <!-- Click outside -->
    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const { allModels, activeProviders } = useProviders()

const selectedModel = useState<string>('selected-model', () => 'deepseek-chat')
const selectedProvider = useState<string>('selected-provider', () => 'deepseek-default')
const settingsOpen = useState('settings-open', () => false)

const isOpen = ref(false)
const search = ref('')

const displayLabel = computed(() => {
  if (!selectedModel.value) return 'Select Model'
  return selectedModel.value
})

const filteredModels = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return allModels.value
  return allModels.value.filter(
    m => m.model.toLowerCase().includes(q) || m.providerName.toLowerCase().includes(q)
  )
})

const groupedModels = computed(() => {
  const groups: Record<string, { providerId: string; providerName: string; models: string[] }> = {}
  for (const m of filteredModels.value) {
    if (!groups[m.providerId]) {
      groups[m.providerId] = { providerId: m.providerId, providerName: m.providerName, models: [] }
    }
    groups[m.providerId].models.push(m.model)
  }
  return Object.values(groups)
})

function isSelected(providerId: string, model: string) {
  return selectedProvider.value === providerId && selectedModel.value === model
}

function selectModel(providerId: string, model: string) {
  selectedProvider.value = providerId
  selectedModel.value = model
  isOpen.value = false
}

function openSettings() {
  isOpen.value = false
  settingsOpen.value = true
}
</script>
