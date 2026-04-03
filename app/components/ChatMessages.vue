<template>
  <div ref="container" class="flex-1 overflow-y-auto w-full" @scroll="handleScroll">
    <div class="max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
      <div v-if="messages.length === 0" class="flex items-center justify-center h-full min-h-[200px]">
        <p class="text-neutral-500 text-sm">Send a message to start the conversation</p>
      </div>

      <ChatMessage
        v-for="(message, index) in messages"
        :key="message.id"
        :message="message"
        :is-last="index === messages.length - 1"
        :is-streaming="isStreaming && index === messages.length - 1 && message.role === 'assistant'"
        :streaming-content="isStreaming && index === messages.length - 1 ? streamingContent : undefined"
        @regenerate="() => $emit('regenerate')"
        @quick-prompt="(p) => $emit('quick-prompt', p)"
      />

      <!-- Streaming indicator when assistant message hasn't been created yet -->
      <div v-if="isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role === 'user')" class="flex gap-4 message-enter px-4">
        <div class="flex items-center gap-3 py-2">
          <ThinkingCat />
        </div>
      </div>

      <!-- Bottom Spacer Buffer -->
      <div class="h-24 shrink-0 w-full" aria-hidden="true"></div>
    </div>

    <!-- Scroll to bottom button -->
    <Transition name="sidebar">
      <button
        v-if="showScrollButton"
        class="fixed bottom-28 right-8 p-2.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white shadow-lg transition-all z-10"
        @click="() => scrollToBottom(true)"
      >
        <Icon name="lucide:arrow-down" class="w-4 h-4" />
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage as ChatMessageType } from '~/types'

const props = defineProps<{
  messages: ChatMessageType[]
  isStreaming: boolean
  streamingContent: string
}>()

const emit = defineEmits<{
  regenerate: []
  'quick-prompt': [prompt: string]
}>()

const container = ref<HTMLElement>()
const showScrollButton = ref(false)
const isAutoScrolling = ref(true)

function scrollToBottom(smooth = true) {
  if (!container.value) return
  container.value.scrollTo({
    top: container.value.scrollHeight,
    behavior: smooth ? 'smooth' : 'instant'
  })
  isAutoScrolling.value = true
}

function handleScroll() {
  if (!container.value) return
  const { scrollTop, scrollHeight, clientHeight } = container.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  showScrollButton.value = distanceFromBottom > 100
  isAutoScrolling.value = distanceFromBottom < 50
}

// Auto-scroll when new content arrives
watch(
  () => [props.messages.length, props.streamingContent],
  () => {
    if (isAutoScrolling.value) {
      nextTick(() => scrollToBottom(false))
    }
  },
  { deep: true }
)

// Scroll on mount
onMounted(() => {
  nextTick(() => scrollToBottom(false))
})
</script>
