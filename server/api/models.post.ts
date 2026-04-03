export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { baseUrl, apiKey } = body

  if (!baseUrl || !apiKey) {
    throw createError({ statusCode: 400, message: 'Missing required fields: baseUrl, apiKey' })
  }

  const apiUrl = `${baseUrl}/v1/models`

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw createError({ statusCode: response.status, message: errorText || `Models API error: ${response.status}` })
    }

    const data = await response.json()
    const models = (data.data || []).map((m: any) => m.id).sort()

    return { models }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || 'Failed to fetch models' })
  }
})
