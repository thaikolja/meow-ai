<template>
  <div class="relative z-50" ref="dropdownContainer">
    <button
      type="button"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-sm text-zinc-300 relative z-50"
      @click.stop="isOpen = !isOpen"
    >
      <Icon name="mdi:cat" class="w-4 h-4 text-primary-400" />
      <span class="max-w-[200px] truncate">{{ displayLabel || 'Pick a Meow-del' }}</span>
      <Icon name="lucide:chevron-down" :class="['w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180']" />
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-60 overflow-hidden"
    >
      <div class="p-2 border-b border-zinc-800">
        <input
          v-model="search"
          class="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none ring-1 ring-zinc-700 focus:ring-primary-500 transition-colors"
          placeholder="Sniff for meow-dels... 🐾"
          @click.stop
        />
      </div>

      <div class="max-h-64 overflow-y-auto p-1">
        <div v-if="filteredModels.length === 0" class="px-3 py-4 text-center text-zinc-500 text-sm">
          <template v-if="allModels.length === 0">
            No cat-providers configured.
            <button type="button" class="text-primary-400 hover:underline cursor-pointer" @click="openSettings">Add one 🐾</button>
          </template>
          <template v-else>No meow-dels match your sniff 🐾</template>
        </div>

        <div v-for="providerGroup in groupedModels" :key="providerGroup.providerId">
          <div class="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {{ providerGroup.providerName }}
          </div>
          <button
            type="button"
            v-for="model in providerGroup.models"
            :key="model"
            :class="[
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
              isSelected(providerGroup.providerId, model)
                ? 'bg-primary-600/20 text-primary-300'
                : 'text-zinc-300 hover:bg-zinc-800'
            ]"
            @click.stop="selectModel(providerGroup.providerId, model)"
          >
            <Icon
              :name="isSelected(providerGroup.providerId, model) ? 'lucide:check-circle-2' : 'lucide:circle'"
              class="w-4 h-4 shrink-0"
            />
            <span class="truncate">{{ formatModelName(model) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'

const { allModels, formatModelName } = useProviders()
const dropdownContainer = ref<HTMLElement | null>(null)

const selectedModel = useState<string>('selected-model', () => 'llama-3.3-70b-versatile')
const selectedProvider = useState<string>('selected-provider', () => 'groq-default')
const settingsOpen = useState('settings-open', () => false)

const isOpen = ref(false)
const search = ref('')

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

const displayLabel = computed(() => {
  if (!selectedModel.value) return 'Pick a Meow-del 🐾'
  return formatModelName(selectedModel.value)
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
    groups[m.providerId]!.models.push(m.model)
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
