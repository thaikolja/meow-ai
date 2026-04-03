<template>
  <div :class="[
    'flex w-full py-2 px-4 sm:px-6 transition-colors',
    message.role === 'assistant' ? 'justify-end' : 'justify-start'
  ]">
    <div :class="[
      'w-[90%] md:w-[85%] rounded-3xl px-6 py-5 relative group shadow-sm flex flex-col',
      message.role === 'assistant' 
        ? 'bg-zinc-800 text-zinc-300' 
        : 'bg-purple-900/30 text-purple-200/90'
    ]">
      
      <!-- Header -->
      <div class="flex items-center gap-2 mb-2">
        <Icon :name="message.role === 'assistant' ? 'lucide:bot' : 'lucide:user'" :class="[
          'w-4 h-4',
          message.role === 'assistant' ? 'text-zinc-400' : 'text-purple-400'
        ]" />
        <span class="text-xs font-semibold opacity-70 uppercase tracking-wider">
          {{ message.role === 'assistant' ? 'Einstein' : 'You' }}
        </span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="chat-prose prose-p:leading-relaxed prose-pre:my-0">
          <ClientOnly>
            <!-- Check if there is actual content, otherwise default slots handle streaming indicator -->
            <MarkdownRenderer v-if="displayContent" :content="displayContent" :class="message.role === 'user' ? 'text-purple-100!' : ''" />
            <div v-else-if="!isStreaming" class="text-zinc-500 italic text-sm">Empty message</div>
            <slot />
          </ClientOnly>
        </div>
      </div>

      <!-- Actions & Metadata -->
      <div v-if="!isStreaming && displayContent" class="flex flex-nowrap overflow-x-auto no-scrollbar items-center justify-between gap-4 pt-3 mt-3 transition-opacity w-full border-t border-zinc-700/30">
        <!-- Metadata on Left -->
        <div :class="[
          'flex items-center gap-3 text-[10.5px] font-medium tracking-wide opacity-50',
          message.role === 'assistant' ? 'text-zinc-400' : 'text-purple-300'
        ]">
          <div class="flex items-center gap-1.5" title="Model Used">
            <Icon name="lucide:cpu" class="w-3.5 h-3.5" />
            {{ message.role === 'assistant' ? (message.model || 'Einstein') : 'Client Input' }}
          </div>
          <div class="flex items-center gap-1.5" title="Estimated Tokens">
            <Icon name="lucide:calculator" class="w-3.5 h-3.5" />
            {{ tokenEstimate }} tokens
          </div>
        </div>

        <!-- Buttons on Right -->
        <div class="flex items-center gap-1.5 flex-nowrap shrink-0 justify-end">
          <!-- Tutor Actions -->
        <template v-if="message.role === 'assistant'">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
            @click="speakDetect"
            title="Read out loud in German"
          >
            <Icon name="lucide:volume-2" class="w-3.5 h-3.5" />
            <span>Listen</span>
          </button>
          
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
            @click="$emit('quick-prompt', 'Please translate the main vocabulary from the text above into Thai.')"
            title="Translate Vocabulary to Thai"
          >
            <Icon name="lucide:languages" class="w-3.5 h-3.5" />
            <span>Vocab Thai</span>
          </button>
          
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
            @click="$emit('quick-prompt', 'Can you explain the German grammar in the text above? Break it down clearly and use English/Thai references for a Thai native speaker.')"
            title="Explain Grammar"
          >
            <Icon name="lucide:book-open" class="w-3.5 h-3.5" />
            <span>Grammar</span>
          </button>
          
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
            @click="$emit('quick-prompt', 'Give me 3 more simple example sentences using the main vocabulary or grammar structure shown here.')"
            title="Give 3 examples"
          >
            <Icon name="lucide:list" class="w-3.5 h-3.5" />
            <span>Examples</span>
          </button>
        </template>

        <div v-if="message.role === 'assistant'" class="h-4 w-px bg-zinc-700 mx-1"></div>

        <button
          :class="[
            'p-1.5 rounded-xl transition-colors',
            message.role === 'assistant' ? 'hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200' : 'hover:bg-purple-800/50 text-purple-300 hover:text-purple-100'
          ]"
          title="Copy message"
          @click="copyContent"
        >
          <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-4 h-4" />
        </button>
        <button
          v-if="isLast && message.role === 'assistant'"
          class="p-1.5 rounded-xl hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Regenerate response"
          @click="$emit('regenerate')"
        >
          <Icon name="lucide:refresh-cw" class="w-4 h-4" />
        </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types'

const props = defineProps<{
  message: ChatMessage
  isLast: boolean
  isStreaming: boolean
  streamingContent?: string
}>()

const emit = defineEmits<{
  regenerate: []
  'quick-prompt': [prompt: string]
}>()

const copied = ref(false)

function speakDetect() {
  if (import.meta.client) {
    const text = displayContent.value
    let lang = 'de-DE' // Fallback to german
    
    // Quick heuristic auto-detection
    if (/[\u0E00-\u0E7F]/.test(text)) {
      lang = 'th-TH'
    } else {
      const deTerms = /\b(und|der|die|das|ich|du|er|sie|es|wir|ihr|ist|sind|nicht|ja|nein)\b/gi
      const enTerms = /\b(the|and|is|are|you|they|it|we|not|yes|no)\b/gi
      const deCount = (text.match(deTerms) || []).length
      const enCount = (text.match(enTerms) || []).length
      if (enCount > deCount) lang = 'en-US'
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9 // slightly slower for learners

    // Explicitly request the correct voice object matching the language
    const voices = window.speechSynthesis.getVoices()
    const matchingVoice = voices.find(v => v.lang.startsWith(lang.substring(0, 2)))
    if (matchingVoice) utterance.voice = matchingVoice

    window.speechSynthesis.speak(utterance)
  }
}

const displayContent = computed(() => {
  if (props.isStreaming && props.streamingContent !== undefined) {
    return props.streamingContent
  }
  return props.message.content
})

async function copyContent() {
  try {
    await navigator.clipboard.writeText(displayContent.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback
  }
}

const tokenEstimate = computed(() => {
  const text = displayContent.value
  if (!text) return 0
  return Math.ceil(text.length / 4)
})
</script>
