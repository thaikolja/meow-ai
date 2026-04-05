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
 * Server-side endpoint to query available models from an OpenAI-compatible provider.
 * This endpoint is consumed by the ProviderList component for model list discovery and synchronization.
 */
export default defineEventHandler(async (event) => {
  // Extract provider connection details from the request body
  const body = await readBody(event)
  const { baseUrl, apiKey } = body

  /**
   * Validation Guard: Ensure required connection credentials are provided.
   * Responses with 400 Bad Request if mandatory parameters are missing.
   */
  if (!baseUrl || !apiKey) {
    throw createError({ statusCode: 400, message: 'Missing required fields: baseUrl, apiKey' })
  }

  // Construct target standard OpenAI models listing endpoint
  const apiUrl = `${baseUrl}/v1/models`

  try {
    /**
     * Perform the downstream GET request to the provider.
     * Uses Bearer Token authentication to authorize the model listing request.
     */
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    // Handle provider rejection or connectivity issues
    if (!response.ok) {
      const errorText = await response.text()
      throw createError({ statusCode: response.status, message: errorText || `Models API error: ${response.status}` })
    }

    // Parse successfully received model list JSON
    const data = await response.json()

    /**
     * Extract model identifiers from the standard OpenAI response format.
     * Alphabetically sorts the list for UI consistency.
     */
    const models = (data.data || []).map((m: any) => m.id).sort()

    return { models }
  } catch (error: any) {
    /**
     * Re-throw known validation errors.
     * Wrap generic network fetch failures as 500 Internal Server Error.
     */
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || 'System-level failure fetching provider models' })
  }
})
