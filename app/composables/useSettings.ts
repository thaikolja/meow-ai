const defaultSystemPrompt = "You are a helpful and friendly German language tutor. The user is a Thai native speaker studying German. Please use simple English to explain grammatical concepts, but feel free to draw comparisons to Thai if it's clear and helpful. Keep responses structured and encouraging."

export function useSettings() {
  const systemPrompt = useState('system-prompt', () => defaultSystemPrompt)
  const maxContextMessages = useState('max-context-messages', () => 10)
  const isLoaded = useState('settings-loaded', () => false)

  if (import.meta.client && !isLoaded.value) {
    const stored = localStorage.getItem('chat-yanawa-system-prompt')
    if (stored !== null) systemPrompt.value = stored
    const storedMax = localStorage.getItem('chat-yanawa-max-context')
    if (storedMax) maxContextMessages.value = parseInt(storedMax, 10)
    isLoaded.value = true
  }

  function saveSettings() {
    if (import.meta.client) {
      localStorage.setItem('chat-yanawa-system-prompt', systemPrompt.value)
      localStorage.setItem('chat-yanawa-max-context', maxContextMessages.value.toString())
    }
  }

  // Auto save on change
  watch(systemPrompt, () => {
    saveSettings()
  })

  return {
    systemPrompt,
    maxContextMessages,
    saveSettings
  }
}
