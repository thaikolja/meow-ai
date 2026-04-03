export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { messages, baseUrl, apiKey, model } = body

  if (!baseUrl || !apiKey || !model || !messages) {
    throw createError({ statusCode: 400, message: 'Missing required fields: baseUrl, apiKey, model, messages' })
  }

  const apiUrl = `${baseUrl}/v1/chat/completions`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw createError({ statusCode: response.status, message: errorText || `LLM API error: ${response.status}` })
  }

  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  // Stream the response through
  const reader = response.body?.getReader()
  if (!reader) {
    throw createError({ statusCode: 500, message: 'No response body from LLM' })
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
