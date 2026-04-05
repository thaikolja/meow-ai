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
  <div ref="container" class="flex-1 overflow-y-auto w-full" @scroll="handleScroll">
    <div class="max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
      <!-- Empty state placeholder -->
      <div v-if="messages.length === 0" class="flex items-center justify-center h-full min-h-[200px]">
        <p class="text-neutral-500 text-sm">Send a message to start the conversation</p>
      </div>

      <!-- Render the current chat thread -->
      <ChatMessage
          v-for="(message, index) in messages" :key="message.id" :is-last="index === messages.length - 1" :is-streaming="isStreaming && index === messages.length - 1 && message.role === 'assistant'" :message="message" :streaming-content="isStreaming && index === messages.length - 1 ? streamingContent : undefined" @regenerate="() => $emit('regenerate')" @quick-prompt="(p) => $emit('quick-prompt', p)" />

      <!-- Streaming indicator (visible before assistant message exists in history) -->
      <div v-if="isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role === 'user')" class="flex gap-4 message-enter px-4">
        <div class="flex items-center gap-3 py-2">
          <ThinkingCat />
        </div>
      </div>

      <!-- Bottom Spacer Buffer ensure input area does not overlap content -->
      <div aria-hidden="true" class="h-24 shrink-0 w-full"></div>
    </div>

    <!-- Floating Scroll-to-bottom button for easy navigation -->
    <Transition name="sidebar">
      <button
          v-if="showScrollButton" class="fixed bottom-28 right-8 p-2.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white shadow-lg transition-all z-10" @click="() => scrollToBottom(true)">
        <Icon class="w-4 h-4" name="lucide:arrow-down" />
      </button>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Container component for the chat message feed.
   * Manages list rendering, auto-scrolling behavior, and user scroll state.
   */

  import type { ChatMessage as ChatMessageType } from '~/types'

  const props = defineProps<{
    /** Complete list of messages to display in the feed */
    messages: ChatMessageType[]
    /** Indicates if a response is currently being received */
    isStreaming: boolean
    /** Ongoing chunk content for the active stream */
    streamingContent: string
  }>()

  const emit = defineEmits<{
    /** Passthrough event for regeneration requests from individual messages */
    regenerate: []
    /** Passthrough event for quick tutor prompts triggered by user */
    'quick-prompt': [ prompt: string ]
  }>()

  // UI and scroll management states
  const container        = ref<HTMLElement>()
  const showScrollButton = ref(false)
  const isAutoScrolling  = ref(true)

  /**
   * Scrolls the message container to the very bottom.
   * Uses smooth behavior for user triggers, instant for auto-scrolls.
   */
  function scrollToBottom(smooth = true) {
    if (!container.value) return
    container.value.scrollTo({
      top:      container.value.scrollHeight,
      behavior: smooth ? 'smooth': 'instant'
    })
    isAutoScrolling.value = true
  }

  /**
   * Updates UI state based on current scroll position.
   * Shows/hides the scroll button and determines if auto-scrolling should be active.
   */
  function handleScroll() {
    if (!container.value) return
    const { scrollTop, scrollHeight, clientHeight } = container.value
    const distanceFromBottom                        = scrollHeight - scrollTop - clientHeight

    // Show button if user scrolled up more than 100px
    showScrollButton.value = distanceFromBottom > 100
    // Re-enable auto-scroll if user is close to the bottom
    isAutoScrolling.value  = distanceFromBottom < 50
  }

  /**
   * Watcher for incoming chat history changes and stream updates.
   * Automatically scrolls to bottom if auto-scrolling is enabled.
   */
  watch(
      () => [ props.messages.length, props.streamingContent ],
      () => {
        if (isAutoScrolling.value) {
          nextTick(() => scrollToBottom(false))
        }
      },
      { deep: true }
  )

  // Initial scroll positioning on component mount
  onMounted(() => {
    nextTick(() => scrollToBottom(false))
  })
</script>
