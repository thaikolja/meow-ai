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
  <div
      :class="[
    'w-full bg-transparent overflow-x-clip',
    sticky ? 'sticky bottom-0 z-20 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-4 backdrop-blur-sm' : 'pb-4 pt-6 sm:pt-8'
  ]">
    <div class="mx-auto w-full max-w-4xl min-w-0 px-3 sm:px-4">
      <div class="relative flex w-full min-w-0 items-end overflow-hidden rounded-2xl border-2 border-zinc-700 bg-zinc-800/80 shadow-lg transition-colors focus-within:border-primary-500/50 glass-input">
        <textarea
            ref="textareaRef" v-model="message" :disabled="isStreaming" :placeholder="isStreaming ? 'Meow is sharpening claws... 🐾' : 'Chat with Meow... 🐾'" class="min-w-0 w-full max-w-full bg-transparent px-4 pt-4 pb-4 pr-18 text-base sm:text-sm leading-6 text-zinc-100 placeholder-zinc-500 resize-none outline-none max-h-48 overflow-y-auto [overflow-wrap:anywhere]" rows="1" @focus="handleFocus" @input="autoResize" @keydown="handleKeydown" />
        <div class="absolute bottom-2 right-2 flex shrink-0 items-center gap-2">
          <button
              v-if="isStreaming" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors text-sm" @click="$emit('stop')">
            <Icon class="w-3.5 h-3.5" name="lucide:circle-stop" />
            <span class="sr-only">Stop</span>
          </button>
          <button
              v-else :class="[
                'p-2 rounded-xl transition-all duration-200 shadow-md',
                message.trim()
                  ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-primary-600/20'
                  : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed border border-zinc-700/50 shadow-none'
              ]" :disabled="!message.trim()" @click="sendMessage">
            <Icon class="w-5 h-5 text-white" name="mdi:paw" />
          </button>
        </div>
      </div>
      <p class="text-center text-[10px] uppercase tracking-[0.2em] font-medium text-zinc-600 mt-2">
        Meow can make meow-stakes. Please verify with a human cat. 🐾
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Interactive chat input component with auto-resizing textarea.
   * Supports sending messages via Enter key and provides a stopping mechanism during streaming.
   */

  const emit = defineEmits<{
    /** Triggered when a message is submitted */
    send: [ content: string ]
    /** Triggered when the user wants to stop the active stream */
    stop: []
  }>()

  const props = defineProps<{
    /** Indicates if a response is currently being streamed back from the model */
    isStreaming: boolean
    /** Pins the input to the bottom edge for chat screens */
    sticky?: boolean
  }>()

  // Current local input state
  const message     = ref('')
  const textareaRef = ref<HTMLTextAreaElement>()

  /**
   * Submits the current message content to the parent component.
   * Clears the input and resets the textarea height upon success.
   */
  function sendMessage() {
    const content = message.value.trim()
    if (!content) return
    emit('send', content)
    message.value = ''
    nextTick(autoResize)
  }

  /**
   * Handles keyboard events within the textarea.
   * Prevents default Enter behavior and triggers sendMessage unless Shift is pressed.
   */
  function handleKeydown(e: KeyboardEvent) {
    if (e.key==='Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  /**
   * Dynamically adjusts the textarea height based on its content.
   * Caps the maximum height at 192px (appx 12 lines).
   */
  function autoResize() {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 192) + 'px'
  }

  function handleFocus() {
    if (import.meta.server || window.innerWidth >= 768) {
      return
    }

    window.setTimeout(() => {
      textareaRef.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 150)
  }

  // Initial focus purely for user convenience
  onMounted(() => {
    autoResize()

    if (window.innerWidth >= 768 && window.matchMedia('(pointer:fine)').matches) {
      textareaRef.value?.focus()
    }
  })
</script>
