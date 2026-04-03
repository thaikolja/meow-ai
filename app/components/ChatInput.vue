<template>
  <div class="border-t border-neutral-800 bg-neutral-950">
    <div class="max-w-3xl mx-auto px-4 py-4">
      <div class="glass-input rounded-2xl border border-neutral-700 focus-within:border-primary-500/50 transition-colors">
        <textarea
          ref="textareaRef"
          v-model="message"
          :placeholder="isStreaming ? 'Waiting for response...' : 'Message...'"
          :disabled="isStreaming"
          rows="1"
          class="w-full bg-transparent text-neutral-200 placeholder-neutral-500 px-4 pt-4 pb-2 resize-none outline-none text-sm leading-relaxed max-h-48 overflow-y-auto"
          @keydown="handleKeydown"
          @input="autoResize"
        />
        <div class="flex items-center justify-between px-3 pb-3">
          <div class="flex items-center gap-2">
            <!-- Could add attachment buttons here -->
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="isStreaming"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors text-sm"
              @click="$emit('stop')"
            >
              <Icon name="lucide:square" class="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
            <button
              v-else
              :disabled="!message.trim()"
              :class="[
                'p-2 rounded-xl transition-all duration-200',
                message.trim()
                  ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-600/20'
                  : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
              ]"
              @click="sendMessage"
            >
              <Icon name="lucide:arrow-up" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <p class="text-center text-xs text-neutral-600 mt-2">
        AI can make mistakes. Verify important information.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  send: [content: string]
  stop: []
}>()

defineProps<{
  isStreaming: boolean
}>()

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

function sendMessage() {
  const content = message.value.trim()
  if (!content) return
  emit('send', content)
  message.value = ''
  nextTick(autoResize)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 192) + 'px'
}

onMounted(() => {
  textareaRef.value?.focus()
})
</script>
