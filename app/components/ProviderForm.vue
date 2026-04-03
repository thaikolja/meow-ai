<template>
  <div class="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-4">
    <h4 class="text-sm font-medium text-neutral-200">
      {{ isEditing ? 'Edit Provider' : 'Add New Provider' }}
    </h4>

    <div class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-neutral-400 mb-1.5">Provider Name</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="e.g. OpenAI, Ollama, DeepSeek"
          class="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-primary-500 transition-colors"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-neutral-400 mb-1.5">Base URL</label>
        <input
          v-model="form.baseUrl"
          type="url"
          placeholder="e.g. https://api.openai.com"
          class="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-primary-500 transition-colors font-mono"
        />
        <p class="text-xs text-neutral-500 mt-1">Must support OpenAI-compatible /v1/chat/completions</p>
      </div>

      <div>
        <label class="block text-xs font-medium text-neutral-400 mb-1.5">API Key</label>
        <input
          v-model="form.apiKey"
          type="password"
          placeholder="sk-..."
          class="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-primary-500 transition-colors font-mono"
        />
      </div>
    </div>

    <div class="flex items-center gap-2 pt-1">
      <button
        :disabled="!isValid"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          isValid
            ? 'bg-primary-600 text-white hover:bg-primary-500'
            : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
        ]"
        @click="handleSave"
      >
        <Icon name="lucide:check" class="w-4 h-4" />
        <span>{{ isEditing ? 'Update' : 'Add' }} Provider</span>
      </button>
      <button
        class="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LLMProvider } from '~/types'

const props = defineProps<{
  provider?: LLMProvider
}>()

const emit = defineEmits<{
  save: [data: { name: string; baseUrl: string; apiKey: string }]
  cancel: []
}>()

const isEditing = computed(() => !!props.provider)

const form = reactive({
  name: props.provider?.name || '',
  baseUrl: props.provider?.baseUrl || '',
  apiKey: props.provider?.apiKey || ''
})

const isValid = computed(() => {
  return form.name.trim() && form.baseUrl.trim() && form.apiKey.trim()
})

function handleSave() {
  if (!isValid.value) return
  emit('save', {
    name: form.name.trim(),
    baseUrl: form.baseUrl.trim().replace(/\/+$/, ''),
    apiKey: form.apiKey.trim()
  })
}
</script>
