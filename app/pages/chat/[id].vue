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

const selectedModel = useState<string>('selected-model', () => 'deepseek-chat')
const selectedProvider = useState<string>('selected-provider', () => 'deepseek-default')

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
    // onError
    (error: string) => {
      updateMessage(currentChatId, assistantMsg.id, `⚠️ Error: ${error}`)
      persist()
    }
  )
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
