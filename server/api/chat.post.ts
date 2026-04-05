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
 * Server-side proxy for executing AI chat completions.
 * Receives the conversation history and provider credentials, then forwards
 * the request to the external LLM endpoint using Server-Sent Events (SSE).
 */
export default defineEventHandler(async (event) => {
  // Extract configuration and dialogue history from the incoming request body
  const body = await readBody(event)
  const { messages, baseUrl, apiKey, model } = body

  /**
   * Strict Validation Guard: Prevent invalid requests to the downstream provider.
   */
  if (!baseUrl || !apiKey || !model || !messages) {
    throw createError({ statusCode: 400, message: 'Missing required fields: baseUrl, apiKey, model, messages' })
  }

  // Construct the target endpoint (standard OpenAI chat URI)
  const apiUrl = `${baseUrl}/v1/chat/completions`

  /**
   * Relay the request to the third-party LLM provider.
   * Explicitly request 'stream: true' for low-latency chunks.
   */
  const response = await fetch(apiUrl, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body:    JSON.stringify({
      model,
      messages,
      stream: true // Essential for real-time text appearance in the UI
    })
  })

  // Propagate downstream failures back to the client
  if (!response.ok) {
    const errorText = await response.text()
    throw createError({ statusCode: response.status, message: errorText || `LLM API error: ${response.status}` })
  }

  /**
   * Set mandatory SSE response headers to keep the connection open for streaming.
   * Disables caching and forces 'keep-alive'.
   */
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':   'keep-alive'
  })

  // Open a reader from the downstream body stream
  const reader = response.body?.getReader()
  if (!reader) {
    throw createError({ statusCode: 500, message: 'No response body received from the downstream LLM' })
  }

  /**
   * Internal ReadableStream construction to facilitate standard Nuxt stream handling.
   * Iterates through the reader and enqueues raw byte chunks.
   */
  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            break
          }
          // Pushes the exact chunk received from provider through to our frontend
          controller.enqueue(value)
        }
      } catch (error) {
        // Propagate unexpected stream failures to the controller
        controller.error(error)
      }
    }
  })

  // Offload the final stream object back to the client-side fetcher
  return sendStream(event, stream)
})
