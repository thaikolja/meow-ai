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
  <div class="bg-transparent pb-4 pt-8">
    <div class="max-w-6xl mx-auto px-4">
      <div class="relative glass-input border-2 rounded-2xl border-zinc-700 bg-zinc-800/80 focus-within:border-primary-500/50 transition-colors shadow-lg flex items-end">
        <textarea
            ref="textareaRef" v-model="message" :disabled="isStreaming" :placeholder="isStreaming ? 'Meow is sharpening claws... 🐾' : 'Chat with Meow... 🐾'" class="w-full bg-transparent text-zinc-100 placeholder-zinc-500 px-4 pt-4 pb-4 pr-16 resize-none outline-none text-sm leading-relaxed max-h-48 overflow-y-auto" rows="1" @input="autoResize" @keydown="handleKeydown" />
        <div class="absolute bottom-2 right-2 flex items-center gap-2">
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

  // Initial focus purely for user convenience
  onMounted(() => {
    textareaRef.value?.focus()
  })
</script>
