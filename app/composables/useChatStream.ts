export function useChatStream() {
  const isStreaming = useState('is-streaming', () => false)
  const streamingContent = useState('streaming-content', () => '')
  let abortController: AbortController | null = null

  async function streamMessage(
    messages: Array<{ role: string; content: string }>,
    config: { baseUrl: string; apiKey: string; model: string },
    onChunk: (chunk: string) => void,
    onDone: (fullContent: string) => void,
    onError: (error: string) => void
  ) {
    isStreaming.value = true
    streamingContent.value = ''
    abortController = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          model: config.model
        }),
        signal: abortController.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            isStreaming.value = false
            onDone(fullContent)
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullContent += content
              streamingContent.value = fullContent
              onChunk(content)
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      isStreaming.value = false
      onDone(fullContent)
    } catch (error: any) {
      isStreaming.value = false
      if (error.name === 'AbortError') {
        onDone(streamingContent.value)
      } else {
        const catError = `Hiss! 😿 Something went wrong with the meow-del: ${error.message || 'The cats are tangled in the yarn'}. Please try again later! 🐾`
        onError(catError)
      }
    }
  }

  function stopStreaming() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isStreaming.value = false
  }

  return {
    isStreaming,
    streamingContent,
    streamMessage,
    stopStreaming
  }
}
