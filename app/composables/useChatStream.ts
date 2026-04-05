/*
 * Copyright (C) 2026 Kolja Nolte
 * https://meow.yanawa.io
 * info@meow.yanawa.io
 *
 * This work is licensed under the MIT License. You are free to use, modify,
 * and distribute this work, provided that you include the copyright notice
 * and this permission notice in all copies or substantial portions of the work.
 * For more information, visit: https://opensource.org/licenses/MIT
 *
 * @author    Kolja Nolte
 * @email     kolja.nolte@gmail.com
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

/**
 * Composable for handling Server-Sent Events (SSE) streaming from the AI backend.
 * Provides granular control over the stream including lifecycle hooks for chunks, completion, and errors.
 */
export function useChatStream() {
  /**
   * Global state indicating if an active stream is currently pulling data.
   * Shared across components via Nuxt's useState.
   */
  const isStreaming = useState('is-streaming', () => false)

  /**
   * Tracks the cumulative content received in the current stream session.
   * Used for real-time UI rendering in message components.
   */
  const streamingContent = useState('streaming-content', () => '')

  /** Reference to the current fetch signal, allowing for manual interruption of the stream */
  let abortController: AbortController | null = null

  /**
   * Initiates a POST request to the chat API and begins processing the SSE stream.
   * Parses incoming JSON chunks and facilitates callback triggers.
   *
   * @param messages - Ordered history of dialogue sent as context
   * @param config - Provider connection details (Base URL, key, and specific model)
   * @param onChunk - Callback executed every time a new text fragment arrives
   * @param onDone - Callback executed when the stream completes successfully
   * @param onError - Callback for handling network or API failures
   */
  async function streamMessage(
      messages: Array<{ role: string; content: string }>,
      config: { baseUrl: string; apiKey: string; model: string },
      onChunk: (chunk: string) => void,
      onDone: (fullContent: string) => void,
      onError: (error: string) => void
  ) {
    // Reset state for new stream
    isStreaming.value = true
    streamingContent.value = ''
    abortController   = new AbortController()

    try {
      // Connect to the local API proxy which forwards to the provider
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({
          messages,
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          model:  config.model
        }),
        signal: abortController.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body available for reading')

      const decoder = new TextDecoder()
      let fullContent = ''

      /**
       * Infinite loop to read the stream reader until completion.
       * Decodes bytes into text and parses the SSE 'data:' format.
       */
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        // Multiple SSE lines may arrive in one chunk
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()

          // OpenAI standard protocol for stream termination
          if (data==='[DONE]') {
            isStreaming.value = false
            onDone(fullContent)
            return
          }

          try {
            const parsed = JSON.parse(data)
            // Extract the actual text content from the delta object
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullContent += content
              streamingContent.value = fullContent
              onChunk(content)
            }
          } catch {
            // Silently ignore individual malformed JSON chunks to maintain stream flow
          }
        }
      }

      isStreaming.value = false
      onDone(fullContent)
    } catch (error: any) {
      isStreaming.value = false
      // Treat user-driven aborts as successful completions of current content
      if (error.name==='AbortError') {
        onDone(streamingContent.value)
      } else {
        onError(error.message || 'An unknown meow-function occurred')
      }
    }
  }

  /**
   * Manually terminates the active fetch request and resets the streaming state.
   */
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
