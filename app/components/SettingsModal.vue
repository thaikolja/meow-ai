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
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-2xl' }">
    <!-- Modal Header with Cat-themed Title -->
    <template #header>
      <div class="flex items-center gap-3">
        <Icon class="w-5 h-5 text-primary-400" name="mdi:paw" />
        <h2 class="text-lg font-semibold text-neutral-100 italic">Paw-ferences 🐾</h2>
      </div>
    </template>

    <!-- Settings Main Body -->
    <template #body>
      <div class="space-y-8 p-1">
        <!-- AI Behavior Configurations (System Prompts) -->
        <div>
          <h3 class="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4 italic">Cat-figurations 🐾</h3>
          <div class="space-y-3">
            <div>
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400">Global System
                  Prompt</label>
                <div class="flex items-center gap-2">
                  <span
                      :class="isUsingCustomSystemPrompt
                          ? 'border-primary-500/40 bg-primary-500/10 text-primary-300'
                          : 'border-neutral-700 bg-neutral-800 text-neutral-400'" class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    {{ isUsingCustomSystemPrompt ? 'Custom override': 'Default prompt' }}
                  </span>
                  <button
                      v-if="isUsingCustomSystemPrompt" class="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors" type="button" @click="resetSystemPromptOverride">
                    Reset to default
                  </button>
                </div>
              </div>

              <textarea
                  v-model="systemPromptEditor" class="min-h-52 w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-primary-500 transition-colors resize-y" placeholder="e.g. You are a helpful assistant..." rows="6" />

              <p class="text-xs text-neutral-500 mt-1">
                The built-in default prompt is loaded from <code>/public/system-prompt.md</code>. Editing here stores
                only your local override.
              </p>
            </div>
          </div>
        </div>

        <!-- Token Handling & Context Limits -->
        <div>
          <h3 class="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4 italic">Paw-token Handling 🐾
          </h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Max Context
                Messages</label> <input
                v-model.number="maxContextMessages" class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 outline-none focus:border-primary-500 transition-colors" min="0" type="number" />
              <p class="text-xs text-neutral-500 mt-1">Controls how many previous messages are attached to outgoing
                requests. Set to 0 for unlimited context (may incur higher costs).
              </p>
            </div>
          </div>
        </div>

        <!-- LLM Provider Management -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-neutral-300 uppercase tracking-wider italic">Meow-del Feeders 🐾</h3>
            <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 transition-colors text-sm" @click="showAddForm = true">
              <Icon class="w-3.5 h-3.5" name="lucide:plus" />
              <span>Add Provider</span>
            </button>
          </div>

          <!-- Add Provider UI Logic Toggle -->
          <ProviderForm
              v-if="showAddForm" class="mb-4" @cancel="showAddForm = false" @save="handleAddProvider" />

          <!-- List of active providers and their respective settings -->
          <ProviderList />
        </div>

        <!-- Irreversible Actions Section -->
        <div class="border-t border-neutral-800 pt-4">
          <h3 class="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 italic">Danger Zone 🐾</h3>
          <button
              class="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-800/50 text-red-400 hover:bg-red-900/20 transition-colors text-sm" @click="handleClearChats">
            <Icon class="w-4 h-4" name="mdi:trash-can" />
            <span>Empty Litter Box 🐾</span>
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
  /**
   * Main settings modal providing access to global app configurations.
   * Handles system prompts, context management, provider lists, and state cleanup.
   */

// Modal visibility bound to parent state
  const open = defineModel<boolean>('open', { required: true })

  const { addProvider, fetchModels } = useProviders()
  const { clearAllChats }            = useChats()
  const {
          defaultSystemPrompt,
          systemPromptOverride,
          isUsingCustomSystemPrompt,
          maxContextMessages,
          setSystemPromptOverride,
          resetSystemPromptOverride
        }                            = useSettings()

  const systemPromptEditor = computed({
    get: () => systemPromptOverride.value ?? defaultSystemPrompt.value,
    set: (value: string) => {
      setSystemPromptOverride(value)
    }
  })

  // UI Toggle state for adding new providers
  const showAddForm = ref(false)

  /**
   * Handles the creation of a new provider entry.
   * Automatically attempts to fetch the model list immediately after insertion.
   */
  async function handleAddProvider(data: { name: string; baseUrl: string; apiKey: string }) {
    const provider    = addProvider(data)
    showAddForm.value = false
    // Proactively fetch models to ensure the UI is populated immediately
    await fetchModels(provider.id)
  }

  /**
   * Deletes all local chat history across all threads.
   * Includes a mandatory confirmation dialog to prevent accidental data loss.
   */
  function handleClearChats() {
    if (confirm('Are you sure you want to empty the litter box? All meows will be gone forever! 🐾')) {
      clearAllChats()
      navigateTo('/') // Redirect to home as current threads are now invalid
    }
  }
</script>
