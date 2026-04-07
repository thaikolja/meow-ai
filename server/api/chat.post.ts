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

import type { RuntimeConfig }                                                                      from 'nuxt/schema'
/**
 * Server-side proxy for executing AI chat completions.
 * Receives the conversation history and provider ID, retrieves encrypted API key server-side,
 * then forwards the request to the external LLM endpoint using Server-Sent Events (SSE).
 */
import { requireAuthenticatedSession }                                                             from '../utils/authSession'
import { getAuthSecret }                                                                           from '../utils/authSession'
import { getProviderWithKey }                                                                      from '../utils/providersStorage'
import { assertProviderBaseUrl, buildChatRequest, extractGoogleStreamText, resolveProviderApiKey } from '../utils/providerApi'
import { validateCsrf }                                                                            from '../utils/csrf'

export default defineEventHandler(async (event) => {
  // CSRF protection
  validateCsrf(event)

  requireAuthenticatedSession(event)

  // Extract configuration and dialogue history from the incoming request body
  const body                                   = await readBody(event)
  const { messages, baseUrl, model, providerId } = body
  const runtimeConfig: RuntimeConfig = useRuntimeConfig(event)
  const secret = getAuthSecret(event)

  /**
   * Strict Validation Guard: Prevent invalid requests to the downstream provider.
   */
  if (!providerId || typeof providerId !== 'string' || !providerId.trim()) {
    throw createError({ statusCode: 400, message: 'Missing required field: providerId' })
  }

  if (!model || !Array.isArray(messages)) {
    throw createError({ statusCode: 400, message: 'Missing required fields: model, messages' })
  }

  if (typeof model!=='string' || !model.trim()) {
    throw createError({ statusCode: 400, message: 'Invalid model value' })
  }

  // Retrieve provider with decrypted API key from server-side storage
  const provider = getProviderWithKey(providerId, secret)
  if (!provider) {
    throw createError({ statusCode: 400, message: 'Provider not found' })
  }

  const validatedBaseUrl = assertProviderBaseUrl(provider.baseUrl, {
    allowPrivate:           runtimeConfig.allowPrivateProviderUrls,
    allowInsecureLocalhost: import.meta.dev
  })

  const sanitizedMessages = messages
  .filter((message): message is { role: string; content: string } => (
      Boolean(message)
      && typeof message.role==='string'
      && typeof message.content==='string'
  ))
  .map((message) => ({
    role:    message.role,
    content: message.content.trim()
  }))
  .filter((message) => message.content.length > 0)

  if (sanitizedMessages.length===0) {
    throw createError({ statusCode: 400, message: 'At least one valid message is required' })
  }

  if (sanitizedMessages.length > 100) {
    throw createError({ statusCode: 400, message: 'Too many messages supplied in a single request' })
  }

  // Resolve API key: prefer server-stored key, fall back to env secrets for default providers
  const resolvedApiKey = resolveProviderApiKey({
    providerId,
    baseUrl: validatedBaseUrl,
    clientApiKey: provider.apiKey,
    secrets:      {
      deepseekApiKey: runtimeConfig.deepseekApiKey,
      groqApiKey:     runtimeConfig.groqApiKey,
      googleApiKey:   runtimeConfig.googleApiKey
    }
  })

  if (!resolvedApiKey) {
    throw createError({ statusCode: 400, message: 'Missing API key for provider' })
  }

  const request = buildChatRequest(validatedBaseUrl, resolvedApiKey, model.trim(), sanitizedMessages)

  /**
   * Relay the request to the third-party LLM provider.
   * Explicitly request 'stream: true' for low-latency chunks.
   */
  let response: Response

  try {
    response = await fetch(request.apiUrl, {
      method:  'POST',
      headers: request.headers,
      body:    JSON.stringify(request.body),
      signal:  AbortSignal.timeout(45_000)
    })
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message:    error?.name==='TimeoutError'
                      ? 'Timed out while connecting to the upstream model provider'
                      : 'Unable to reach the upstream model provider'
    })
  }

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
    'Content-Type':      'text/event-stream',
    'Cache-Control':     'no-store, no-transform',
    'Connection':        'keep-alive',
    'X-Accel-Buffering': 'no'
  })

  // Open a reader from the downstream body stream
  const reader = response.body?.getReader()
  if (!reader) {
    throw createError({ statusCode: 500, message: 'No response body received from the downstream LLM' })
  }

  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  /**
   * Internal ReadableStream construction to facilitate standard Nuxt stream handling.
   * Iterates through the reader and enqueues raw byte chunks.
   */
  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (request.kind==='google') {
          let buffer       = ''
          let lastFullText = ''

          const flushGoogleEvent = (eventChunk: string) => {
            for (const line of eventChunk.split('\n')) {
              if (!line.startsWith('data: ')) continue

              const data = line.slice(6).trim()
              if (!data) continue

              const parsed      = JSON.parse(data)
              const currentText = extractGoogleStreamText(parsed)
              if (!currentText) continue

              const delta = currentText.startsWith(lastFullText)
                  ? currentText.slice(lastFullText.length)
                  : currentText

              if (!delta) continue

              lastFullText = currentText
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [ { delta: { content: delta } } ] })}\n\n`))
            }
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const events = buffer.split('\n\n')
            buffer       = events.pop() || ''

            for (const eventChunk of events) {
              flushGoogleEvent(eventChunk)
            }
          }

          if (buffer.trim()) {
            flushGoogleEvent(buffer)
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        }

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
