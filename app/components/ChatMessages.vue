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
  <div ref="container" class="flex-1 w-full overflow-y-auto overflow-x-hidden" @scroll="handleScroll">
    <div class="mx-auto w-full max-w-4xl min-w-0 px-3 py-4 sm:px-4 sm:py-6 space-y-5 sm:space-y-6">
      <ChatEmptyState v-if="messages.length === 0 && !isStreaming" @quick-prompt="handleQuickPrompt" />

      <template v-else>
        <!-- Render the current chat thread -->
        <ChatMessage
            v-for="(message, index) in messages" :key="message.id" :is-last="index === messages.length - 1" :is-streaming="isStreaming && index === messages.length - 1 && message.role === 'assistant'" :is-thinking="isThinking" :message="message" :streaming-content="isStreaming && index === messages.length - 1 ? streamingContent : undefined" @regenerate="$emit('regenerate')" @quick-prompt="handleQuickPrompt" />

        <!-- Streaming indicator (visible before assistant message exists in history) -->
        <div v-if="isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role === 'user')" class="flex gap-4 message-enter px-4">
          <div class="flex items-center gap-3 py-2">
            <ThinkingCat :compact="isThinking" />
          </div>
        </div>
      </template>

      <!-- Bottom Spacer Buffer ensure input area does not overlap content -->
      <div aria-hidden="true" class="h-28 sm:h-24 shrink-0 w-full"></div>
    </div>

    <!-- Floating Scroll-to-bottom button for easy navigation -->
    <Transition name="sidebar">
      <button
          v-if="showScrollButton" class="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] right-3 sm:right-6 p-2.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white shadow-lg transition-all z-10" @click="() => scrollToBottom(true)">
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
    /** Indicates whether the active stream is a thinking/reasoning model */
    isThinking: boolean
    /** Ongoing chunk content for the active stream */
    streamingContent: string
  }>()

  const emit = defineEmits<{
    regenerate: []
    'quick-prompt': [ prompt: string ]
  }>()

  function handleQuickPrompt(prompt: string) {
    emit('quick-prompt', prompt)
  }

  // UI and scroll management states
  const container        = ref<HTMLElement>()
  const showScrollButton = ref(false)
  const isAutoScrolling  = ref(true)
  // Tracks the last message id we saw so we can detect a freshly appended
  // message (new user prompt, new assistant response, or chat switch) and
  // force-scroll to it, even if the user had scrolled up to read history.
  let lastSeenMessageId: string | undefined

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
   *
   * Two cases:
   * 1. The last message id changed (a new message was appended, or the user
   *    switched chats) - force-scroll to the bottom regardless of where the
   *    user was reading. The user just asked for a response, or opened a
   *    chat; we always want to bring the latest content into view. This is
   *    the key fix for mobile, where a new assistant response can otherwise
   *    be created off-screen if the user was reading history.
   * 2. Streaming content updates within the same message - only auto-scroll
   *    if the user is already near the bottom (respect manual scroll-up).
   */
  watch(
      () => [ props.messages.length, props.streamingContent ] as const,
      () => {
        const currentLastId = props.messages[props.messages.length - 1]?.id

        if (currentLastId && currentLastId!==lastSeenMessageId) {
          lastSeenMessageId = currentLastId
          nextTick(() => scrollToBottom(false))
          return
        }

        if (isAutoScrolling.value) {
          nextTick(() => scrollToBottom(false))
        }
      },
      { deep: true }
  )

  // Initial scroll positioning on component mount
  onMounted(() => {
    nextTick(() => {
      lastSeenMessageId = props.messages[props.messages.length - 1]?.id
      scrollToBottom(false)
    })
  })
</script>
