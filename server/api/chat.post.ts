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
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

/**
 * Server-side proxy for executing AI chat completions via OpenRouter.
 * Receives the conversation history and model ID, uses the OpenRouter API key
 * from runtime config, and streams the response back via SSE.
 */
import { MAX_CHAT_BODY_BYTES, sanitizeUpstreamMessages } from '#shared/utils/chatImage'
import { requireAuthenticatedSession }                                                    from '../utils/authSession'
import { assertProviderBaseUrl, buildChatRequest, buildDeepSeekRequest, isDeepSeekModel } from '../utils/providerApi'
import { validateCsrf }                                                                   from '../utils/csrf'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api'

export default defineEventHandler(async (event) => {
  validateCsrf(event)

  requireAuthenticatedSession(event)

  const contentLength = Number(getRequestHeader(event, 'content-length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_CHAT_BODY_BYTES) {
    throw createError({ statusCode: 413, message: 'That photo is too large.' })
  }

  const body             = await readBody(event)
  const { messages, model } = body
  const runtimeConfig    = useRuntimeConfig(event)
  const openrouterApiKey = runtimeConfig.openrouterApiKey?.trim() || ''
  const deepseekApiKey = runtimeConfig.deepseekApiKey?.trim() || ''
  const useDeepSeek    = isDeepSeekModel(model)

  if (!model || !Array.isArray(messages)) {
    throw createError({ statusCode: 400, message: 'Missing required fields: model, messages' })
  }

  if (typeof model!=='string' || !model.trim()) {
    throw createError({ statusCode: 400, message: 'Invalid model value' })
  }

  if (useDeepSeek && !deepseekApiKey) {
    throw createError({ statusCode: 500, message: 'DeepSeek API key is not configured' })
  }

  if (!useDeepSeek && !openrouterApiKey) {
    throw createError({ statusCode: 500, message: 'OpenRouter API key is not configured' })
  }

  const validatedBaseUrl = useDeepSeek
      ? ''
      : assertProviderBaseUrl(OPENROUTER_BASE_URL, {
        allowPrivate:           runtimeConfig.allowPrivateProviderUrls,
        allowInsecureLocalhost: import.meta.dev
      })

  let sanitizedMessages
  try {
    sanitizedMessages = sanitizeUpstreamMessages(messages, model.trim())
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message:    typeof error?.message === 'string' ? error.message : 'Invalid messages'
    })
  }

  const request = useDeepSeek
      ? buildDeepSeekRequest(deepseekApiKey, model.trim(), sanitizedMessages)
      : buildChatRequest(validatedBaseUrl, openrouterApiKey, model.trim(), sanitizedMessages)

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

  if (!response.ok) {
    const errorText = await response.text()
    throw createError({ statusCode: response.status, message: errorText || `LLM API error: ${response.status}` })
  }

  setResponseHeaders(event, {
    'Content-Type':      'text/event-stream',
    'Cache-Control':     'no-store, no-transform',
    'Connection':        'keep-alive',
    'X-Accel-Buffering': 'no'
  })

  const reader = response.body?.getReader()
  if (!reader) {
    throw createError({ statusCode: 500, message: 'No response body received from the downstream LLM' })
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            break
          }
          controller.enqueue(value)
        }
      } catch (error) {
        controller.error(error)
      }
    }
  })

  return sendStream(event, stream)
})
