<template>
  <div class="space-y-2">
    <div v-if="providers.length === 0" class="text-center py-6 text-neutral-500 text-sm">
      No providers configured yet. Add one to get started.
    </div>

    <div
      v-for="provider in providers"
      :key="provider.id"
      class="group flex items-center gap-3 p-3 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
    >
      <!-- Status -->
      <div
        :class="[
          'w-2.5 h-2.5 rounded-full shrink-0',
          provider.isActive ? 'bg-emerald-500' : 'bg-neutral-600'
        ]"
      />

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-neutral-200">{{ provider.name }}</span>
          <span class="text-xs bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-400">
            {{ provider.models.length }} models
          </span>
        </div>
        <p class="text-xs text-neutral-500 truncate font-mono mt-0.5">{{ provider.baseUrl }}</p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          class="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-primary-400 transition-colors"
          title="Refresh models"
          @click="handleRefreshModels(provider.id)"
        >
          <Icon :name="refreshingId === provider.id ? 'lucide:loader-2' : 'lucide:refresh-cw'" :class="['w-4 h-4', refreshingId === provider.id && 'animate-spin']" />
        </button>
        <button
          class="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
          title="Edit provider"
          @click="startEdit(provider)"
        >
          <Icon name="lucide:pencil" class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
          :title="provider.isActive ? 'Disable' : 'Enable'"
          @click="toggleProvider(provider)"
        >
          <Icon :name="provider.isActive ? 'lucide:eye' : 'lucide:eye-off'" class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 rounded-lg hover:bg-red-900/30 text-neutral-500 hover:text-red-400 transition-colors"
          title="Delete provider"
          @click="handleDelete(provider.id)"
        >
          <Icon name="lucide:trash-2" class="w-4 h-4" />
        </button>
      </div>

      <!-- Edit Form (inline) -->
    </div>

    <!-- Inline edit -->
    <ProviderForm
      v-if="editingProvider"
      :provider="editingProvider"
      @save="handleUpdate"
      @cancel="editingProvider = undefined"
    />
  </div>
</template>

<script setup lang="ts">
import type { LLMProvider } from '~/types'

const { providers, removeProvider, updateProvider, fetchModels } = useProviders()

const editingProvider = ref<LLMProvider>()
const refreshingId = ref<string>()

function startEdit(provider: LLMProvider) {
  editingProvider.value = { ...provider }
}

function handleUpdate(data: { name: string; baseUrl: string; apiKey: string }) {
  if (editingProvider.value) {
    updateProvider(editingProvider.value.id, data)
    editingProvider.value = undefined
  }
}

function handleDelete(id: string) {
  if (confirm('Delete this provider? This cannot be undone.')) {
    removeProvider(id)
  }
}

function toggleProvider(provider: LLMProvider) {
  updateProvider(provider.id, { isActive: !provider.isActive })
}

async function handleRefreshModels(id: string) {
  refreshingId.value = id
  try {
    await fetchModels(id)
  } finally {
    refreshingId.value = undefined
  }
}
</script>
