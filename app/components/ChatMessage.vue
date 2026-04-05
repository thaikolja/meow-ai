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
    'flex w-full py-2 px-4 sm:px-6 transition-all duration-500',
    message.isError ? 'justify-center py-8' : (message.role === 'assistant' ? 'justify-end' : 'justify-start')
  ]">
    <!-- Error Centered Card -->
    <div v-if="message.isError" class="max-w-lg w-full bg-red-950/10 border-2 border-dashed border-red-500/20 rounded-3xl p-8 text-center relative overflow-hidden backdrop-blur-md shadow-2xl group animate-in fade-in zoom-in duration-300">
      <div class="absolute -top-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

      <div class="relative z-10 space-y-4">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-2">
          <Icon class="w-8 h-8 text-red-400 animate-pulse" name="mdi:alert-decagram" />
        </div>

        <h3 class="text-lg font-bold text-red-200 tracking-tight">Meow-function! 😿</h3>

        <p class="text-sm text-red-100/70 leading-relaxed font-medium">
          {{ displayContent }}
        </p>

        <div class="pt-2">
          <button
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95" @click="$emit('regenerate')">
            <Icon class="w-4 h-4" name="lucide:refresh-cw" />
            <span>Repair Meow 🐾</span>
          </button>
        </div>
      </div>

      <!-- Subtle Paw Background -->
      <Icon class="absolute -bottom-8 -left-8 w-40 h-40 text-red-500 opacity-[0.03] rotate-12" name="mdi:paw" />
    </div>

    <!-- Normal Speech Bubble -->
    <div
        v-else :class="[
      'w-[90%] md:w-[85%] rounded-[2rem] px-6 pt-6 pb-5 relative group shadow-sm flex flex-col overflow-hidden transition-all duration-300',
      message.role === 'assistant' 
        ? 'bg-zinc-800 text-zinc-300 rounded-tr-xl' 
        : 'bg-purple-900/30 text-purple-200/90 rounded-tl-xl'
    ]">

      <!-- Cute Background Watermark -->
      <Icon
          :class="[
        'absolute -bottom-6 w-32 h-32 opacity-[0.03] pointer-events-none transition-transform',
        message.role === 'assistant' ? '-left-6 -rotate-12' : '-right-6 rotate-12'
      ]" name="mdi:paw" />

      <!-- Header -->
      <div class="flex items-center gap-2 mb-2 relative z-10">
        <Icon
            :class="[
          'w-4 h-4',
          message.role === 'assistant' ? 'text-primary-400' : 'text-purple-400'
        ]" :name="message.role === 'assistant' ? 'mdi:cat' : 'lucide:user'" />
        <span class="text-xs font-semibold opacity-70 uppercase tracking-wider">
          {{ message.role==='assistant' ? 'Meow 🐾': (usernameCookie || 'You') }}
        </span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="chat-prose prose-p:leading-relaxed prose-pre:my-0">
          <ClientOnly>
            <!-- Check if there is actual content, otherwise default slots handle streaming indicator -->
            <MarkdownRenderer v-if="displayContent" :class="message.role === 'user' ? 'text-purple-100!' : ''" :content="displayContent" />
            <div v-else-if="isStreaming" class="py-1">
              <ThinkingCat />
            </div>
            <div v-else class="text-zinc-500 italic text-sm">No purrs recorded yet... 🐾</div>
            <slot />
          </ClientOnly>
        </div>
      </div>

      <!-- Actions & Metadata Box -->
      <div v-if="!isStreaming && displayContent" class="flex flex-nowrap overflow-x-auto no-scrollbar items-center justify-between gap-4 pt-3 mt-1.5 transition-opacity w-full">
        <!-- Metadata on Left -->
        <div
            :class="[
          'flex items-center gap-3 text-[10px] font-medium tracking-wide opacity-40',
          message.role === 'assistant' ? 'text-zinc-500' : 'text-purple-300'
        ]">
          <div class="flex items-center gap-1.5" title="Model Used">
            <Icon class="w-3 h-3" name="mdi:cat" />
            {{
              message.role==='assistant' ? (formatModelName(message.model || 'Meow 🐾')): (usernameCookie || 'Client Input')
            }}
          </div>
          <div class="flex items-center gap-1.5" title="Estimated Tokens">
            <Icon class="w-3 h-3" name="mdi:calculator" />
            {{ tokenEstimate }} paw-tokens
          </div>
        </div>

        <!-- Buttons on Right -->
        <div class="flex items-center gap-1.5 flex-nowrap shrink-0 justify-end">
          <!-- Tutor Actions -->
          <template v-if="message.role === 'assistant'">
            <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium shrink-0" title="Translate Vocabulary to Thai" @click="$emit('quick-prompt', 'Please translate the main vocabulary from the text above into Thai.')">
              <Icon class="w-3.5 h-3.5" name="lucide:languages" />
              <span>Vocab Thai</span>
            </button>

            <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium shrink-0" title="Explain Grammar" @click="$emit('quick-prompt', 'Can you explain the German grammar in the text above? Break it down clearly and use English/Thai references for a Thai native speaker.')">
              <Icon class="w-3.5 h-3.5" name="lucide:book-open" />
              <span>Grammar</span>
            </button>

            <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium shrink-0" title="Give 3 examples" @click="$emit('quick-prompt', 'Give me 3 more simple example sentences using the main vocabulary or grammar structure shown here.')">
              <Icon class="w-3.5 h-3.5" name="lucide:list" />
              <span>Examples</span>
            </button>
          </template>

          <div v-if="message.role === 'assistant'" class="h-4 w-px bg-zinc-700 mx-1"></div>

          <button
              :class="[
              'p-1.5 rounded-xl transition-colors',
              message.role === 'assistant' ? 'hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200' : 'hover:bg-purple-800/50 text-purple-300 hover:text-purple-100'
            ]" title="Copy message" @click="copyContent">
            <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-4 h-4" />
          </button>
          <button
              v-if="isLast && message.role === 'assistant'" class="p-1.5 rounded-xl hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors" title="Regenerate response" @click="$emit('regenerate')">
            <Icon class="w-4 h-4" name="lucide:refresh-cw" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Component for displaying a single message in the chat thread.
   * Handles both user and assistant roles, error states, and specialized tutor actions.
   * Includes text-to-speech auto-detection and content copying.
   */

  import type { ChatMessage } from '~/types'

  const { formatModelName } = useProviders()
  const props               = defineProps<{
    /** The message object containing role, content, and metadata */
    message: ChatMessage
    /** Indicates if this message is the most recent one in the thread */
    isLast: boolean
    /** Indicates if a response is currently streaming into this message slot */
    isStreaming: boolean
    /** Real-time content being received from the stream */
    streamingContent?: string
  }>()

  const emit = defineEmits<{
    /** Triggered when the user wants to retry the AI response generation */
    regenerate: []
    /** Triggered for specialized learning prompts related to the current message */
    'quick-prompt': [ prompt: string ]
  }>()

  // UI Utility states
  const copied         = ref(false)
  const usernameCookie = useCookie('chat_username')

  /**
   * Automatically detects the language and reads the text aloud using browser TTS.
   * Heuristic rules for Thai, German, and English.
   */
  function speakDetect() {
    if (import.meta.client) {
      const text = displayContent.value
      let lang   = 'de-DE' // Fallback to german

      // Quick heuristic auto-detection for Thai characters
      if (/[\u0E00-\u0E7F]/.test(text)) {
        lang = 'th-TH'
      } else {
        // Comparison of common term sets between German and English
        const deTerms = /\b(und|der|die|das|ich|du|er|sie|es|wir|ihr|ist|sind|nicht|ja|nein)\b/gi
        const enTerms = /\b(the|and|is|are|you|they|it|we|not|yes|no)\b/gi
        const deCount = (text.match(deTerms) || []).length
        const enCount = (text.match(enTerms) || []).length
        if (enCount > deCount) lang = 'en-US'
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang  = lang
      utterance.rate  = 0.9 // slightly slower for better foreign language comprehension

      // Explicitly request the correct voice object matching the language
      const voices        = window.speechSynthesis.getVoices()
      const matchingVoice = voices.find(v => v.lang.startsWith(lang.substring(0, 2)))
      if (matchingVoice) utterance.voice = matchingVoice

      window.speechSynthesis.speak(utterance)
    }
  }

  /**
   * Resolves the final content to display.
   * Prioritizes active stream content over the persisted message content.
   */
  const displayContent = computed(() => {
    if (props.isStreaming && props.streamingContent!==undefined) {
      return props.streamingContent
    }
    return props.message.content
  })

  /** Copies the current message content to the system clipboard */
  async function copyContent() {
    try {
      await navigator.clipboard.writeText(displayContent.value)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      // Silent fail for Clipboard API restrictions or issues
    }
  }

  /**
   * Rough estimation of tokens used by this message.
   * Uses the industry standard '4 characters per token' heuristic for simple UI tracking.
   */
  const tokenEstimate = computed(() => {
    const text = displayContent.value
    if (!text) return 0
    return Math.ceil(text.length / 4)
  })
</script>
