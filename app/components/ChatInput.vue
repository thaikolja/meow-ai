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
      <div
          v-if="previewUrl"
          class="mb-2 flex justify-start"
      >
        <div class="relative">
          <img
              :src="previewUrl"
              alt="Attached page"
              class="h-20 w-20 rounded-xl border border-zinc-700 object-cover"
          />
          <button
              type="button"
              class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-zinc-200"
              aria-label="Remove image"
              :disabled="imageBusy"
              @click="clearAttachment"
          >
            <Icon
                class="h-3.5 w-3.5"
                name="lucide:x"
            />
          </button>
        </div>
      </div>
      <div class="relative flex w-full min-w-0 items-end overflow-hidden rounded-2xl border-2 border-zinc-700 bg-zinc-800/80 shadow-lg transition-colors focus-within:border-primary-500/50 glass-input">
        <textarea
            ref="textareaRef"
            v-model="message"
            :placeholder="isStreaming ? 'Meow is sharpening claws... 🐾' : 'Chat with Meow... 🐾'"
            class="min-w-0 w-full max-w-full bg-transparent pl-14 pr-18 pt-4 pb-4 text-base sm:text-sm leading-6 text-zinc-100 placeholder-zinc-500 resize-none outline-none max-h-48 overflow-y-auto [overflow-wrap:anywhere]"
            rows="1"
            @focus="handleFocus"
            @input="autoResize"
            @keydown="handleKeydown"
        />
        <div class="absolute bottom-2 left-2 flex shrink-0 items-center">
          <button
              type="button"
              :aria-describedby="visionEnabled ? undefined : 'vision-note'"
              :aria-label="visionEnabled ? 'Attach a photo' : 'This model can\'t read images.'"
              :class="[
                'p-2 rounded-xl transition-colors',
                attachDisabled
                  ? 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
                  : 'text-zinc-300 hover:bg-zinc-700/80 hover:text-white'
              ]"
              :disabled="attachDisabled"
              :title="visionEnabled ? 'Attach a photo' : 'This model can\'t read images.'"
              @click="openPicker"
          >
            <Icon
                class="w-5 h-5"
                name="lucide:image-plus"
            />
          </button>
          <input
              ref="fileRef"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
              class="hidden"
              type="file"
              @change="onFile"
          />
        </div>
        <div class="absolute bottom-2 right-2 flex shrink-0 items-center gap-2">
          <button
              v-if="isStreaming" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors text-sm" @click="$emit('stop')">
            <Icon class="w-3.5 h-3.5" name="lucide:circle-stop" />
            <span class="sr-only">Stop</span>
          </button>
          <button
              v-else :class="[
                'p-2 rounded-xl transition-all duration-200 shadow-md',
                canSend
                  ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-primary-600/20'
                  : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed border border-zinc-700/50 shadow-none'
              ]"
              :disabled="!canSend"
              @click="sendMessage"
          >
            <Icon class="w-5 h-5 text-white" name="mdi:paw" />
          </button>
        </div>
      </div>
      <p
          v-if="imageError"
          class="mt-1 text-center text-xs text-red-400"
      >{{ imageError }}
      </p>
      <p
          v-else-if="imageBusy"
          class="mt-1 text-center text-xs text-zinc-500"
      >Shrinking the photo…
      </p>
      <p
          v-if="!visionEnabled"
          id="vision-note"
          class="mt-1 text-center text-xs text-zinc-500"
      >
        This model can't read images.
      </p>
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

  import { createChatImageId, deleteChatImage, putChatImage } from '~/utils/chatImageStore'
  import { prepareChatImage }                                 from '~/utils/prepareChatImage'

  const emit = defineEmits<{
    /** Triggered when a message is submitted. imageId points at a browser-stored JPEG. */
    send: [ content: string, imageId?: string ]
    /** Triggered when the user wants to stop the active stream */
    stop: []
  }>()

  const props = defineProps<{
    /** Indicates if a response is currently being streamed back from the model */
    isStreaming: boolean
    /** Pins the input to the bottom edge for chat screens */
    sticky?: boolean
    /** False greys out the photo button. Unknown models stay closed. */
    supportsVision?: boolean
  }>()

  // Current local input state
  const message     = ref('')
  const textareaRef = ref<HTMLTextAreaElement>()
  const fileRef = ref<HTMLInputElement>()
  const imageId = ref<string | null>(null)
  const previewUrl = ref<string | null>(null)
  const imageError = ref('')
  const imageBusy = ref(false)

  const visionEnabled  = computed(() => props.supportsVision === true)
  const attachDisabled = computed(() => !visionEnabled.value || props.isStreaming || imageBusy.value)
  const canSend        = computed(() => !props.isStreaming && !imageBusy.value && (message.value.trim().length > 0 || Boolean(imageId.value)))

  /**
   * Submits the current message content to the parent component.
   * Clears the input and resets the textarea height upon success.
   * A photo can go with the text, or on its own.
   */
  function sendMessage() {
    if (!canSend.value) return
    const content = message.value.trim()
    const attached = visionEnabled.value ? imageId.value || undefined : undefined
    if (!content && !attached) return
    imageId.value = null
    releasePreview()
    emit('send', content, attached)
    message.value = ''
    nextTick(() => {
      autoResize()
      textareaRef.value?.focus({ preventScroll: true })
    })
  }

  function openPicker() {
    if (attachDisabled.value) return
    imageError.value = ''
    fileRef.value?.click()
  }

  async function onFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file  = input.files?.[0]
    input.value = ''
    if (!file || !visionEnabled.value) return

    imageError.value = ''
    imageBusy.value  = true
    try {
      if (imageId.value) await deleteChatImage(imageId.value)
      releasePreview()
      const blob = await prepareChatImage(file)
      const id   = createChatImageId()
      await putChatImage({
        id,
        chatId:    null,
        messageId: null,
        blob,
        createdAt: Date.now()
      })
      imageId.value    = id
      previewUrl.value = URL.createObjectURL(blob)
    } catch (error) {
      imageError.value = error instanceof Error ? error.message : 'This photo format isn\'t supported. Try a JPEG.'
    } finally {
      imageBusy.value = false
    }
  }

  async function clearAttachment() {
    const id         = imageId.value
    imageId.value    = null
    imageError.value = ''
    releasePreview()
    if (id) await deleteChatImage(id)
  }

  function releasePreview() {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  watch(visionEnabled, (enabled) => {
    if (!enabled && imageId.value) void clearAttachment()
  })

  onUnmounted(() => {
    const id = imageId.value
    releasePreview()
    if (id) void deleteChatImage(id)
  })

  /**
   * Handles keyboard events within the textarea.
   * Prevents default Enter behavior and triggers sendMessage unless Shift is pressed.
   */
  function handleKeydown(e: KeyboardEvent) {
    if (props.isStreaming) {
      return
    }

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
