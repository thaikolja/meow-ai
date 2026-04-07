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
  <div class="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-4">
    <!-- Context-aware Header -->
    <h4 class="text-sm font-medium text-neutral-200">
      {{ isEditing ? 'Edit Provider': 'Add New Provider' }}
    </h4>

    <div class="space-y-3">
      <!-- Human-readable name for the provider -->
      <div>
        <label class="block text-xs font-medium text-neutral-400 mb-1.5">Provider Name</label> <input
          v-model="form.name" class="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-primary-500 transition-colors" placeholder="e.g. OpenAI, Ollama, DeepSeek" type="text" />
      </div>

      <!-- Connection endpoint for OpenAI-compatible or Google-native services -->
      <div>
        <label class="block text-xs font-medium text-neutral-400 mb-1.5">Base URL</label> <input
          v-model="form.baseUrl" class="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-primary-500 transition-colors font-mono" placeholder="e.g. https://api.openai.com or https://generativelanguage.googleapis.com" type="url" />
        <p class="text-xs text-neutral-500 mt-1">Supports OpenAI-compatible endpoints and Google Generative Language API
          roots.
        </p>
      </div>

      <!-- Authentication secret -->
      <div>
        <label class="block text-xs font-medium text-neutral-400 mb-1.5">
          API Key
          <span v-if="isEditing" class="text-neutral-600">(leave blank to keep existing)</span>
        </label>
        <input
          v-model="form.apiKey" class="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-primary-500 transition-colors font-mono" :placeholder="isEditing ? 'Leave blank to keep current key' : 'sk-...'" type="password" />
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex items-center gap-2 pt-1">
      <button
          :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          isValid
            ? 'bg-primary-600 text-white hover:bg-primary-500'
            : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
        ]" :disabled="!isValid" @click="handleSave">
        <Icon class="w-4 h-4" name="lucide:check" />
        <span>{{ isEditing ? 'Update': 'Add' }} Provider</span>
      </button>
      <button
          class="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors" @click="$emit('cancel')">
        Cancel
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Interactive form for adding or editing an LLM provider connection.
   * Collects name, base URL, and API key with basic validation and formatting.
   * API keys are stored encrypted server-side.
   */

  import type { LLMProvider } from '~/types'

  const props = defineProps<{
    /** Optional provider object to populate the form during an 'Edit' operation */
    provider?: LLMProvider
  }>()

  const emit = defineEmits<{
    /** Triggered when the user submits a valid form configuration */
    save: [ data: { name: string; baseUrl: string; apiKey: string } ]
    /** Triggered when the user cancels the form without saving */
    cancel: []
  }>()

  /** Utility to determine if the form is in 'Edit' or 'Create' mode */
  const isEditing = computed(() => !!props.provider)

  /** Internal reactive state for the form fields */
  const form = reactive({
    name:    props.provider?.name || '',
    baseUrl: props.provider?.baseUrl || '',
    apiKey:  '' // Always empty on load - user must re-enter if changing
  })

  /**
   * Validation: name and baseUrl always required.
   * For new providers, apiKey is required.
   * For editing, apiKey is optional (keep existing if not provided).
   */
  const isValid = computed(() => {
    const hasName = form.name.trim().length > 0
    const hasBaseUrl = form.baseUrl.trim().length > 0
    // When creating new provider, API key is required
    // When editing, API key is optional (user can leave blank to keep existing)
    const hasApiKey = isEditing.value ? true : form.apiKey.trim().length > 0
    return hasName && hasBaseUrl && hasApiKey
  })

  /**
   * Handles final form submission.
   * Trims input whitespace and removes trailing slashes from the Base URL for downstream consistency.
   */
  function handleSave() {
    if (!isValid.value) return
    emit('save', {
      name:    form.name.trim(),
      baseUrl: form.baseUrl.trim().replace(/\/+$/, ''), // Strip trailing slashes to prevent double-concatenation
      apiKey:  form.apiKey.trim()
    })
  }
</script>
