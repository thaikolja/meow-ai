<template>
  <div class="bg-transparent pb-4 pt-8">
    <div class="max-w-6xl mx-auto px-4">
      <div class="relative glass-input border-2 rounded-2xl border-zinc-700 bg-zinc-800/80 focus-within:border-primary-500/50 transition-colors shadow-lg flex items-end">
        <textarea
          ref="textareaRef"
          v-model="message"
          :placeholder="isStreaming ? 'Einstein is sharpening claws... 🐾' : 'Meow at Einstein... 🐾'"
          :disabled="isStreaming"
          rows="1"
          class="w-full bg-transparent text-zinc-100 placeholder-zinc-500 px-4 pt-4 pb-4 pr-16 resize-none outline-none text-sm leading-relaxed max-h-48 overflow-y-auto"
          @keydown="handleKeydown"
          @input="autoResize"
        />
        <div class="absolute bottom-2 right-2 flex items-center gap-2">
            <button
              v-if="isStreaming"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors text-sm"
              @click="$emit('stop')"
            >
              <Icon name="lucide:square" class="w-3.5 h-3.5" />
              <span class="sr-only">Stop</span>
            </button>
            <button
              v-else
              :disabled="!message.trim()"
              :class="[
                'p-2 rounded-xl transition-all duration-200 shadow-md',
                message.trim()
                  ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-primary-600/20'
                  : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed border border-zinc-700/50 shadow-none'
              ]"
              @click="sendMessage"
            >
              <Icon name="mdi:paw" class="w-5 h-5 text-white" />
            </button>
        </div>
      </div>
      <p class="text-center text-[10px] uppercase tracking-[0.2em] font-medium text-zinc-600 mt-2">
        Einstein can make meow-stakes. Please verify with a human cat. 🐾
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
