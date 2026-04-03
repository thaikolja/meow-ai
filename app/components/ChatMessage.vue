<template>
  <div :class="['flex gap-4 message-enter', message.role === 'user' ? '' : '']">
    <!-- Avatar -->
    <div
      :class="[
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        message.role === 'user'
          ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
      ]"
    >
      <Icon
        :name="message.role === 'user' ? 'lucide:user' : 'lucide:sparkles'"
        class="w-4 h-4 text-white"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 space-y-2">
      <!-- Role label -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-neutral-200">
          {{ message.role === 'user' ? 'You' : 'Assistant' }}
        </span>
        <span v-if="message.model" class="text-xs text-neutral-500">
          {{ message.model }}
        </span>
      </div>

      <!-- Message body -->
      <div class="text-neutral-300 leading-relaxed">
        <div v-if="displayContent" class="chat-prose">
          <MarkdownRenderer :content="displayContent" />
        </div>
        <div v-else-if="isStreaming" class="flex items-center gap-1.5">
          <span class="typing-dot w-2 h-2 rounded-full bg-neutral-400"></span>
          <span class="typing-dot w-2 h-2 rounded-full bg-neutral-400"></span>
          <span class="typing-dot w-2 h-2 rounded-full bg-neutral-400"></span>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="!isStreaming && displayContent" class="flex flex-wrap items-center gap-1.5 pt-2 opacity-0 hover:opacity-100 transition-opacity">
        <!-- Tutor Actions -->
        <template v-if="message.role === 'assistant'">
          <button
            class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium border border-zinc-700/50"
            @click="speakGerman"
            title="Read out loud in German"
          >
            <Icon name="lucide:volume-2" class="w-3.5 h-3.5" />
            <span>Listen</span>
          </button>
          
          <button
            class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium border border-zinc-700/50"
            @click="$emit('quick-prompt', 'Please translate the main vocabulary from the text above into Thai.')"
            title="Translate Vocabulary to Thai"
          >
            <Icon name="lucide:languages" class="w-3.5 h-3.5" />
            <span>Vocab Thai</span>
          </button>
          
          <button
            class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium border border-zinc-700/50"
            @click="$emit('quick-prompt', 'Can you explain the German grammar in the text above? Break it down clearly and use English/Thai references for a Thai native speaker.')"
            title="Explain Grammar"
          >
            <Icon name="lucide:book-open" class="w-3.5 h-3.5" />
            <span>Grammar</span>
          </button>
          
          <button
            class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium border border-zinc-700/50"
            @click="$emit('quick-prompt', 'Give me 3 more simple example sentences using the main vocabulary or grammar structure shown here.')"
            title="Give 3 examples"
          >
            <Icon name="lucide:list" class="w-3.5 h-3.5" />
            <span>Examples</span>
          </button>
        </template>

        <div class="h-4 w-px bg-zinc-700 mx-1"></div>

        <button
          class="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Copy message"
          @click="copyContent"
        >
          <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-4 h-4" />
        </button>
        <button
          v-if="isLast && message.role === 'assistant'"
          class="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Regenerate response"
          @click="$emit('regenerate')"
        >
          <Icon name="lucide:refresh-cw" class="w-4 h-4" />
        </button>
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

function speakGerman() {
  if (import.meta.client) {
    // Only speak the text content, ignore Markdown markers if possible. For simplicity, we fallback to displayContent
    const utterance = new SpeechSynthesisUtterance(displayContent.value)
    utterance.lang = 'de-DE'
    utterance.rate = 0.9 // slightly slower for learners
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
</script>
