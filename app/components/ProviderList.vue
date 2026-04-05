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
  - @email     kolja.nolte@gmail.com
  - @license   MIT
  - @date      2026
  - @website   https://meow.yanawa.io
  -->

<template>
  <div class="space-y-2">
    <!-- List empty state -->
    <div v-if="providers.length === 0" class="text-center py-6 text-neutral-500 text-sm">
      No providers configured yet. Add one to get started.
    </div>

    <!-- Iterate through configured providers -->
    <div
        v-for="provider in providers" :key="provider.id" class="group flex items-center gap-3 p-3 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors">
      <!-- Activity Status Indicator (Emerald = Active, Neutral = Disabled) -->
      <div
          :class="[
          'w-2.5 h-2.5 rounded-full shrink-0',
          provider.isActive ? 'bg-emerald-500' : 'bg-neutral-600'
        ]" />

      <!-- Provider Metadata Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-neutral-200">{{ provider.name }}</span>
          <span class="text-xs bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-400">
            {{ provider.models.length }} models
          </span>
        </div>
        <p class="text-xs text-neutral-500 truncate font-mono mt-0.5">{{ provider.baseUrl }}</p>
      </div>

      <!-- Provider Management Actions (Visible on Hover) -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <!-- Fetch latest model list from the provider endpoint -->
        <button
            class="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-primary-400 transition-colors" title="Refresh models" @click="handleRefreshModels(provider.id)">
          <Icon :class="['w-4 h-4', refreshingId === provider.id && 'animate-spin']" :name="refreshingId === provider.id ? 'lucide:loader-2' : 'lucide:refresh-cw'" />
        </button>
        <!-- Opens the edit form for this provider -->
        <button
            class="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors" title="Edit provider" @click="startEdit(provider)">
          <Icon class="w-4 h-4" name="lucide:pencil" />
        </button>
        <!-- Toggle provider availability in the app -->
        <button
            :title="provider.isActive ? 'Disable' : 'Enable'" class="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors" @click="toggleProvider(provider)">
          <Icon :name="provider.isActive ? 'lucide:eye' : 'lucide:eye-off'" class="w-4 h-4" />
        </button>
        <!-- Immediate deletion from local storage -->
        <button
            class="p-1.5 rounded-lg hover:bg-red-900/30 text-neutral-500 hover:text-red-400 transition-colors" title="Delete provider" @click="handleDelete(provider.id)">
          <Icon class="w-4 h-4" name="lucide:trash-2" />
        </button>
      </div>
    </div>

    <!-- Inline editing form, rendered only when a provider is selected for modification -->
    <ProviderForm
        v-if="editingProvider" :provider="editingProvider" @cancel="editingProvider = undefined" @save="handleUpdate" />
  </div>
</template>

<script lang="ts" setup>
  /**
   * UI Component for managing the list of configured LLM providers.
   * Supports enabling/disabling, editing, deleting, and refreshing model lists from the remote API.
   */

  import type { LLMProvider } from '~/types'

  const { providers, removeProvider, updateProvider, fetchModels } = useProviders()

  // Internal UI management states
  const editingProvider = ref<LLMProvider>()
  const refreshingId    = ref<string>()

  /** Opens the edit dialog with a shallow copy of the provider data */
  function startEdit(provider: LLMProvider) {
    editingProvider.value = { ...provider }
  }

  /**
   * Submits the updated provider data back to the central store.
   * Clears the editing state upon completion.
   */
  function handleUpdate(data: { name: string; baseUrl: string; apiKey: string }) {
    if (editingProvider.value) {
      updateProvider(editingProvider.value.id, data)
      editingProvider.value = undefined
    }
  }

  /**
   * Prompts for confirmation before permanently removing a provider.
   */
  function handleDelete(id: string) {
    if (confirm('Delete this provider? This cannot be undone.')) {
      removeProvider(id)
    }
  }

  /** Flips the isActive flag to hide/show the provider in selection menus */
  function toggleProvider(provider: LLMProvider) {
    updateProvider(provider.id, { isActive: !provider.isActive })
  }

  /**
   * Dispatches an async request to fetch current models from the provider endpoint.
   * Tracks loading state via refreshingId for UI feedback (spinner).
   */
  async function handleRefreshModels(id: string) {
    refreshingId.value = id
    try {
      await fetchModels(id)
    } finally {
      refreshingId.value = undefined
    }
  }
</script>
