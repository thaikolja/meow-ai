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

const SYSTEM_PROMPT_OVERRIDE_STORAGE_KEY = 'chat-yanawa-system-prompt-override'
const LEGACY_SYSTEM_PROMPT_STORAGE_KEY = 'chat-yanawa-system-prompt'
const MAX_CONTEXT_STORAGE_KEY          = 'chat-yanawa-max-context'

const DEFAULT_SYSTEM_PROMPT_FALLBACK = `You are Meow, a helpful and friendly German language tutor.

The user is a Thai native speaker who is studying German.

Follow these rules:
- Explain grammar in simple, encouraging English.
- Use clear structure, short paragraphs, and concrete examples.
- When it is genuinely helpful, compare German concepts with Thai.
- Correct mistakes gently and explain why the correction is better.
- Prioritize practical language learning, pronunciation hints, and natural usage.
- Stay concise unless the user asks for more depth.
- Keep the tone warm, supportive, and easy to follow.`

let defaultPromptLoadPromise: Promise<string> | null = null

/**
 * Composable for managing user-defined application settings.
 * Handles persistence of system prompts and token limitation logic.
 */
export function useSettings() {
  /** Immutable prompt shipped with the app and loaded from /public/system-prompt.md */
  const defaultSystemPrompt = useState('default-system-prompt', () => DEFAULT_SYSTEM_PROMPT_FALLBACK)
  /** User-specific override for the shipped system prompt */
  const systemPromptOverride = useState<string | null>('system-prompt-override', () => null)
  /** Maximum number of previous messages sent in the AI request context */
  const maxContextMessages  = useState('max-context-messages', () => 25)
  /** Tracks if settings have been successfully re-hydrated from browser storage */
  const isLoaded            = useState('settings-loaded', () => false)
  /** Prevent duplicate persistence watchers across multiple composable consumers */
  const persistenceBound    = useState('settings-persistence-bound', () => false)

  const effectiveSystemPrompt = computed(() => {
    const override = systemPromptOverride.value?.trim()
    return override || defaultSystemPrompt.value
  })

  const isUsingCustomSystemPrompt = computed(() => Boolean(systemPromptOverride.value?.trim()))

  async function ensureDefaultSystemPromptLoaded() {
    if (import.meta.server || defaultSystemPrompt.value!==DEFAULT_SYSTEM_PROMPT_FALLBACK) {
      return defaultSystemPrompt.value
    }

    if (defaultPromptLoadPromise) {
      return defaultPromptLoadPromise
    }

    defaultPromptLoadPromise = $fetch<string>('/system-prompt.md', { responseType: 'text' })
    .then((prompt) => {
      const normalized = prompt.trim()

      if (normalized) {
        defaultSystemPrompt.value = normalized
      }

      return defaultSystemPrompt.value
    })
    .catch(() => defaultSystemPrompt.value)
    .finally(() => {
      defaultPromptLoadPromise = null
    })

    return defaultPromptLoadPromise as Promise<string>
  }

  function normalizeOverride(value: string | null | undefined): string | null {
    const normalized = value?.trim() || ''
    if (!normalized || normalized===defaultSystemPrompt.value.trim()) {
      return null
    }

    return normalized
  }

  function setSystemPromptOverride(value: string | null | undefined) {
    systemPromptOverride.value = normalizeOverride(value)
  }

  function resetSystemPromptOverride() {
    systemPromptOverride.value = null
  }

  // Initialize and load persistent configurations on the client-side
  if (import.meta.client && !isLoaded.value) {
    const storedOverride = localStorage.getItem(SYSTEM_PROMPT_OVERRIDE_STORAGE_KEY)
    const legacyPrompt = localStorage.getItem(LEGACY_SYSTEM_PROMPT_STORAGE_KEY)

    if (storedOverride!==null) {
      setSystemPromptOverride(storedOverride)
    } else if (legacyPrompt!==null) {
      setSystemPromptOverride(legacyPrompt)
      localStorage.removeItem(LEGACY_SYSTEM_PROMPT_STORAGE_KEY)
    }

    // Convert stored string value back to a number for calculation
    const storedMax = localStorage.getItem(MAX_CONTEXT_STORAGE_KEY)
    if (storedMax) {
      const parsedMax = parseInt(storedMax, 10)
      if (Number.isFinite(parsedMax) && parsedMax >= 0) {
        maxContextMessages.value = parsedMax
      }
    }

    isLoaded.value = true
    void ensureDefaultSystemPromptLoaded().then(() => {
      systemPromptOverride.value = normalizeOverride(systemPromptOverride.value)
    })
  }

  /** Persists current settings to browser localStorage */
  function saveSettings() {
    if (import.meta.client) {
      if (systemPromptOverride.value) {
        localStorage.setItem(SYSTEM_PROMPT_OVERRIDE_STORAGE_KEY, systemPromptOverride.value)
      } else {
        localStorage.removeItem(SYSTEM_PROMPT_OVERRIDE_STORAGE_KEY)
      }

      localStorage.removeItem(LEGACY_SYSTEM_PROMPT_STORAGE_KEY)
      localStorage.setItem(MAX_CONTEXT_STORAGE_KEY, Math.max(0, maxContextMessages.value).toString())
    }
  }

  /**
   * Automatic observer that triggers a save whenever configuration state changes.
   * Ensures settings are always synced without manual 'Save' button.
   */
  if (!persistenceBound.value) {
    watch([ systemPromptOverride, maxContextMessages ], () => {
      saveSettings()
    })

    persistenceBound.value = true
  }

  return {
    defaultSystemPrompt,
    systemPromptOverride,
    effectiveSystemPrompt,
    isUsingCustomSystemPrompt,
    maxContextMessages,
    ensureDefaultSystemPromptLoaded,
    setSystemPromptOverride,
    resetSystemPromptOverride,
    saveSettings
  }
}
