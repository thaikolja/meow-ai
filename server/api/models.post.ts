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
 * Retrieves encrypted API key server-side and syncs models to provider storage.
 */
import { requireAuthenticatedSession }                                                       from '../utils/authSession'
import { getAuthSecret }                                                                     from '../utils/authSession'
import { getProviderWithKey, updateProvider }                                                from '../utils/providersStorage'
import { assertProviderBaseUrl, buildModelsRequest, extractModelIds, resolveProviderApiKey } from '../utils/providerApi'
import { validateCsrf }                                                                      from '../utils/csrf'

export default defineEventHandler(async (event) => {
  // CSRF protection
  validateCsrf(event)

  requireAuthenticatedSession(event)

  // Extract provider connection details from the request body
  const body           = await readBody(event)
  const { providerId } = body
  const runtimeConfig  = useRuntimeConfig(event)
  const secret         = getAuthSecret(event)

  /**
   * Validation Guard: Ensure provider ID is provided.
   */
  if (!providerId || typeof providerId!=='string' || !providerId.trim()) {
    throw createError({ statusCode: 400, message: 'Missing required field: providerId' })
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

  const resolvedApiKey = resolveProviderApiKey({
    providerId,
    baseUrl: validatedBaseUrl,
    clientApiKey: provider.apiKey,
    secrets:      {
      deepseekApiKey: runtimeConfig.deepseekApiKey,
      googleApiKey:   runtimeConfig.googleApiKey,
      opencodeApiKey: runtimeConfig.opencodeApiKey
    }
  })

  if (!resolvedApiKey) {
    throw createError({ statusCode: 400, message: 'Missing API key for provider' })
  }

  const { kind, apiUrl, headers } = buildModelsRequest(validatedBaseUrl, resolvedApiKey)

  let response: Response
  try {

    /**
     * Perform the downstream GET request to the provider.
     * Uses Bearer Token authentication to authorize the model listing request.
     */
    response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(20_000)
    })
  } catch (error: any) {
    /**
     * Wrap generic network fetch failures as 500 Internal Server Error.
     */
    throw createError({
      statusCode: 502,
      message:    error?.name==='TimeoutError'
                      ? 'Timed out while fetching models from the provider'
                      : (error.message || 'System-level failure fetching provider models')
    })
  }

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
  const models = extractModelIds(kind, data)

  // Update provider with fetched models
  updateProvider(providerId, { models }, secret)

  return { models }
})
