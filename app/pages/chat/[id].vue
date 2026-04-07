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
  <div class="flex flex-col h-full">
    <ClientOnly>
      <!-- Messages Area: Scrollable feed of previous and current interactions -->
      <ChatMessages
          :is-streaming="isStreaming" :is-thinking="isThinking" :messages="currentMessages" :streaming-content="streamingContent" @regenerate="handleRegenerate" @quick-prompt="handleSend" />

      <!-- Input Area: Sticky footer for user text entry and stream control -->
      <ChatInput
          :is-streaming="isStreaming" sticky @send="handleSend" @stop="stopStreaming" />

      <!-- Loading skeleton while Nuxt hydrates client-side state -->
      <template #fallback>
        <CatLoadingState
            label="Uncurling the tail..." subtitle="Meow is arranging the cushions and loading your chat thread." title="Warming up this chat..." />
      </template>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Dynamic chat page that displays a specific conversation thread by ID.
   * Coordinates between UI components and multiple composables for state, settings, and streaming.
   */

  const route  = useRoute()
  const router = useRouter()

  // Composable integrations for chat logic and global configurations
  const { getChat, addMessage, updateMessage, persist, removeLastMessage }             = useChats()
  const { getProvider }                                                                = useProviders()
  const { isThinkingModel }                                                            = useModels()
  const { effectiveSystemPrompt, maxContextMessages, ensureDefaultSystemPromptLoaded } = useSettings()
  const { isStreaming, streamingContent, streamMessage, stopStreaming }                = useChatStream()
  const defaultProvider                                                                = useDefaultProvider()
  const defaultModel                                                                   = useDefaultModel()
  let streamingUpdateFrame: number | null                                              = null

  function scheduleStreamingUpdate(chatId: string, messageId: string) {
    if (streamingUpdateFrame!==null || import.meta.server) {
      return
    }

    streamingUpdateFrame = window.requestAnimationFrame(() => {
      updateMessage(chatId, messageId, streamingContent.value)
      streamingUpdateFrame = null
    })
  }

  function flushStreamingUpdate(chatId: string, messageId: string, content: string, isError?: boolean) {
    if (import.meta.client && streamingUpdateFrame!==null) {
      window.cancelAnimationFrame(streamingUpdateFrame)
      streamingUpdateFrame = null
    }

    updateMessage(chatId, messageId, content, isError)
  }


  // Global model selection state (shared with ModelSelector component)
  const selectedModel    = useState<string>('selected-model', () => defaultModel.value)
  const selectedProvider = useState<string>('selected-provider', () => defaultProvider.value)
  const isThinking       = computed(() => isThinkingModel(selectedModel.value))

  /**
   * Extracts the unique chat ID from the route parameters.
   */
  const chatId = computed(() => route.params.id as string)

  /**
   * Derived list of messages belonging to the current chat thread.
   * Returns an empty array if the chat object cannot be resolved.
   */
  const currentMessages = computed(() => {
    const chat = getChat(chatId.value)
    return chat?.messages || []
  })

  /**
   * Navigation and state lifecycle hooks.
   * Redirects invalid chat IDs and handles intra-page stream handoffs.
   */
  onMounted(() => {
    void ensureDefaultSystemPromptLoaded()

    if (chatId.value && !getChat(chatId.value)) {
      router.push('/')
      return
    }

    // Detect and trigger pending streams (e.g., from index page redirection)
    if (sessionStorage.getItem('pending-stream')===chatId.value) {
      sessionStorage.removeItem('pending-stream')
      triggerCompletion()
    }
  })

  onUnmounted(() => {
    if (import.meta.client && streamingUpdateFrame!==null) {
      window.cancelAnimationFrame(streamingUpdateFrame)
      streamingUpdateFrame = null
    }
  })

  /** Dynamically updates the browser tab title to reflect conversation topic */
  useHead({
    title: computed(() => {
      const chat = getChat(chatId.value)
      return chat ? `${chat.title} — meow.yanawa.io`: 'meow.yanawa.io'
    })
  })

  /**
   * High-level handler for new user inputs.
   * Persists the user message locally before requesting an AI response.
   */
  async function handleSend(content: string) {
    const currentChatId = chatId.value

    addMessage(currentChatId, {
      role:       'user',
      content,
      model:      selectedModel.value,
      providerId: selectedProvider.value
    })

    await triggerCompletion()
  }

  /**
   * Prepares the conversation context and executes the AI request.
   * Handles system prompt insertion, context window capping, and result streaming.
   * API keys are retrieved server-side from encrypted storage.
   */
  async function triggerCompletion() {
    const currentChatId = chatId.value
    await ensureDefaultSystemPromptLoaded()

    // Ensure a valid provider is currently selected
    const provider = getProvider(selectedProvider.value)
    if (!provider) {
      addMessage(currentChatId, {
        role:    'assistant',
        content: '⚠️ No provider configured. Please go to Settings and add an LLM provider.'
      })
      return
    }

    // Filter messages for industry-standard API format (no UI-only fields)
    const chat      = getChat(currentChatId)
    let apiMessages = (chat?.messages || [])
    .filter(m => m.role==='user' || m.role==='assistant')
    .map(m => ({ role: m.role, content: m.content }))

    // Optimization: Only send the last N messages to respect context window limits and save tokens
    if (maxContextMessages.value > 0) {
      apiMessages = apiMessages.slice(-maxContextMessages.value)
    }

    // Inject the character/identity instruction at the start of the context
    const systemPrompt = effectiveSystemPrompt.value.trim()
    if (systemPrompt) {
      apiMessages.unshift({ role: 'system', content: systemPrompt })
    }

    // Create an empty shell for the upcoming AI response
    const assistantMsg = addMessage(currentChatId, {
      role:       'assistant',
      content:    '',
      model:      selectedModel.value,
      providerId: selectedProvider.value
    })

    // Start the actual streaming fetch (API key retrieved server-side)
    await streamMessage(
        apiMessages,
        {
          providerId: provider.id,
          model: selectedModel.value
        },
        // Progress callback (runs per chunk)
        (_chunk: string) => {
          scheduleStreamingUpdate(currentChatId, assistantMsg.id)
        },
        // Finalization callback (runs when stream finishes successfully)
        (fullContent: string) => {
          flushStreamingUpdate(currentChatId, assistantMsg.id, fullContent)
          persist()
        },
        // Error callback (runs on network/API failure)
        (error: string) => {
          const friendly = getFriendlyError(error)
          flushStreamingUpdate(currentChatId, assistantMsg.id, friendly, true)
          persist()
        }
    )
  }

  /**
   * Translates raw technical API errors into human-readable (and cat-themed) feedback.
   * Proactively masks sensitive internal identifiers or long trace logs.
   */
  function getFriendlyError(raw: string): string {
    let msg = raw

    // Attempt to extract structured messages from various common API response formats
    try {
      const parsed = JSON.parse(raw)
      if (parsed.message) msg = parsed.message
      else if (parsed.error?.message) msg = parsed.error.message
      else if (typeof parsed.data==='string') msg = parsed.data
    } catch {
      // Not valid JSON, proceeding with raw string content
    }

    const lowMsg = msg.toLowerCase()

    // Standard status code mapping back to cat-based UI messages
    if (lowMsg.includes('401') || lowMsg.includes('unauthorized') || lowMsg.includes('api key') || lowMsg.includes('apikey')) {
      return 'Meow\'s keys are missing! 🗝️ Please check your API meow-key in Paw-ferences.'
    }
    if (lowMsg.includes('429') || lowMsg.includes('rate limit')) {
      return 'Meow is out of breath! 😿 Too many meows at once. Please wait a moment.'
    }
    if (lowMsg.includes('404') || lowMsg.includes('model_not_found') || lowMsg.includes('not found')) {
      return 'Meow can\'t find that meow-del! 🐾 It might have wandered off or isn\'t available for your key.'
    }
    if (lowMsg.includes('500') || lowMsg.includes('502') || lowMsg.includes('503') || lowMsg.includes('server error') || lowMsg.includes('overloaded')) {
      return 'Meow\'s brain is temporarily scrambled! 😿 The LLM server is having a nap.'
    }
    if (lowMsg.includes('timeout') || lowMsg.includes('fetch') || lowMsg.includes('failed') || lowMsg.includes('network') || lowMsg.includes('abort')) {
      return 'Meow\'s connection was interrupted by a naughty mouse! 🐭 Please check your internet or try again.'
    }

    // Safety mask for unhandled large payloads or raw JSON leaks
    if (msg.includes('{') || msg.includes('[') || msg.length > 200) {
      return 'Hiss! 😿 Something went wrong with the meow-del. The cats are tangled in the yarn! Please try again later! 🐾'
    }

    // Wrapper for short, non-generic messages to keep them within the UI brand
    if (msg && msg.length < 150) {
      return `Meow says: "${msg}" 🐾`
    }

    return 'Hiss! 😿 Something went wrong with the meow-del. The cats are tangled in the yarn! Please try again later! 🐾'
  }

  /**
   * Retries the last AI response.
   * Completely removes the current (likely errored or unsatisfactory) last message before re-triggering completion.
   */
  async function handleRegenerate() {
    if (isStreaming.value) return // Block simultaneous streams in one thread
    const currentChatId = chatId.value
    const chat          = getChat(currentChatId)
    if (!chat || chat.messages.length===0) return

    const lastMsg = chat.messages[chat.messages.length - 1]
    // Only remove if the last message was a bot response
    if (lastMsg && lastMsg.role==='assistant') {
      removeLastMessage(currentChatId)
    }

    await triggerCompletion()
  }
</script>
