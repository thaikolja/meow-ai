<template>
  <div class="flex flex-col h-full">
    <ClientOnly>
      <!-- Messages Area -->
      <ChatMessages
        :messages="currentMessages"
        :is-streaming="isStreaming"
        :streaming-content="streamingContent"
        @regenerate="handleRegenerate"
        @quick-prompt="handleSend"
      />

      <!-- Input Area -->
      <ChatInput
        :is-streaming="isStreaming"
        @send="handleSend"
        @stop="stopStreaming"
      />

      <template #fallback>
        <div class="flex-1 flex items-center justify-center">
          <div class="text-neutral-500 text-sm">Loading chat...</div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { getChat, addMessage, updateMessage, createChat, persist, removeLastMessage } = useChats()
const { getProvider } = useProviders()
const { systemPrompt, maxContextMessages } = useSettings()
const { isStreaming, streamingContent, streamMessage, stopStreaming } = useChatStream()

const selectedModel = useState<string>('selected-model', () => 'llama-3.3-70b-versatile')
const selectedProvider = useState<string>('selected-provider', () => 'groq-default')

const chatId = computed(() => route.params.id as string)

const currentMessages = computed(() => {
  const chat = getChat(chatId.value)
  return chat?.messages || []
})

// Redirect if chat doesn't exist (client-only)
onMounted(() => {
  if (chatId.value && !getChat(chatId.value)) {
    router.push('/')
    return
  }

  // Check for pending stream from index.vue
  if (sessionStorage.getItem('pending-stream') === chatId.value) {
    sessionStorage.removeItem('pending-stream')
    triggerCompletion()
  }
})

useHead({
  title: computed(() => {
    const chat = getChat(chatId.value)
    return chat ? `${chat.title} — chat.yanawa.io` : 'chat.yanawa.io'
  })
})

async function handleSend(content: string) {
  const currentChatId = chatId.value

  // Add user message
  addMessage(currentChatId, {
    role: 'user',
    content,
    model: selectedModel.value,
    providerId: selectedProvider.value
  })

  await triggerCompletion()
}

async function triggerCompletion() {
  const currentChatId = chatId.value

  // Get provider config
  const provider = getProvider(selectedProvider.value)
  if (!provider) {
    addMessage(currentChatId, {
      role: 'assistant',
      content: '⚠️ No provider configured. Please go to Settings and add an LLM provider.'
    })
    return
  }

  // Prepare messages for API (only user + assistant messages)
  const chat = getChat(currentChatId)
  let apiMessages = (chat?.messages || [])
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

  // Limit tokens sent to API
  if (maxContextMessages.value > 0) {
    apiMessages = apiMessages.slice(-maxContextMessages.value)
  }

  if (systemPrompt.value) {
    apiMessages.unshift({ role: 'system', content: systemPrompt.value })
  }

  // Add placeholder assistant message
  const assistantMsg = addMessage(currentChatId, {
    role: 'assistant',
    content: '',
    model: selectedModel.value,
    providerId: selectedProvider.value
  })

  // Stream the response
  await streamMessage(
    apiMessages,
    {
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      model: selectedModel.value
    },
    // onChunk
    (_chunk: string) => {
      updateMessage(currentChatId, assistantMsg.id, streamingContent.value)
    },
    // onDone
    (fullContent: string) => {
      updateMessage(currentChatId, assistantMsg.id, fullContent)
      persist()
    },
    (error: string) => {
      const friendly = getFriendlyError(error)
      updateMessage(currentChatId, assistantMsg.id, friendly, true)
      persist()
    }
  )
}

function getFriendlyError(raw: string): string {
  let msg = raw

  // Try to parse JSON and extract message if it's a raw API response
  try {
    const parsed = JSON.parse(raw)
    if (parsed.message) msg = parsed.message
    else if (parsed.error?.message) msg = parsed.error.message
    else if (typeof parsed.data === 'string') msg = parsed.data
  } catch {
    // Not JSON, use as is
  }

  const lowMsg = msg.toLowerCase()

  // Human-friendly translations
  if (lowMsg.includes('401') || lowMsg.includes('unauthorized') || lowMsg.includes('api key') || lowMsg.includes('apikey')) {
    return "Einstein's keys are missing! 🗝️ Please check your API meow-key in Paw-ferences."
  }
  if (lowMsg.includes('429') || lowMsg.includes('rate limit')) {
    return "Einstein is out of breath! 😿 Too many meows at once. Please wait a moment."
  }
  if (lowMsg.includes('404') || lowMsg.includes('model_not_found') || lowMsg.includes('not found')) {
    return "Einstein can't find that meow-del! 🐾 It might have wandered off or isn't available for your key."
  }
  if (lowMsg.includes('500') || lowMsg.includes('502') || lowMsg.includes('503') || lowMsg.includes('server error') || lowMsg.includes('overloaded')) {
    return "Einstein's brain is temporarily scrambled! 😿 The LLM server is having a nap."
  }
  if (lowMsg.includes('timeout') || lowMsg.includes('fetch') || lowMsg.includes('failed') || lowMsg.includes('network') || lowMsg.includes('abort')) {
    return "Einstein's connection was interrupted by a naughty mouse! 🐭 Please check your internet or try again."
  }

  // Final check: if it still contains braces or looks like raw code, hide it
  if (msg.includes('{') || msg.includes('[') || msg.length > 200) {
    return "Hiss! 😿 Something went wrong with the meow-del. The cats are tangled in the yarn! Please try again later! 🐾"
  }

  // If we extracted a somewhat readable message but it didn't match patterns
  if (msg && msg.length < 150) {
    // If it's a short technical message, wrap it nicely
    return `Einstein says: "${msg}" 🐾`
  }

  return "Hiss! 😿 Something went wrong with the meow-del. The cats are tangled in the yarn! Please try again later! 🐾"
}

async function handleRegenerate() {
  if (isStreaming.value) return
  const currentChatId = chatId.value
  const chat = getChat(currentChatId)
  if (!chat || chat.messages.length === 0) return

  const lastMsg = chat.messages[chat.messages.length - 1]
  if (lastMsg && lastMsg.role === 'assistant') {
    removeLastMessage(currentChatId)
  }

  await triggerCompletion()
}
</script>
