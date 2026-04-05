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
 * Default system instruction for our AI persona (Meow).
 * Configured as a friendly German language tutor for Thai native speakers.
 */
const defaultSystemPrompt = 'You are a helpful and friendly German language tutor. The user is a Thai native speaker studying German. Please use simple English to explain grammatical concepts, but feel free to draw comparisons to Thai if it\'s clear and helpful. Keep responses structured and encouraging.'

/**
 * Composable for managing user-defined application settings.
 * Handles persistence of system prompts and token limitation logic.
 */
export function useSettings() {
  /** The instruction that guides the AI's behavior in all conversations */
  const systemPrompt = useState('system-prompt', () => defaultSystemPrompt)
  /** Maximum number of previous messages sent in the AI request context */
  const maxContextMessages = useState('max-context-messages', () => 10)
  /** Tracks if settings have been successfully re-hydrated from browser storage */
  const isLoaded     = useState('settings-loaded', () => false)

  // Initialize and load persistent configurations on the client-side
  if (import.meta.client && !isLoaded.value) {
    const stored = localStorage.getItem('chat-yanawa-system-prompt')
    if (stored!==null) systemPrompt.value = stored

    // Convert stored string value back to a number for calculation
    const storedMax = localStorage.getItem('chat-yanawa-max-context')
    if (storedMax) maxContextMessages.value = parseInt(storedMax, 10)

    isLoaded.value = true
  }

  /** Persists current settings to browser localStorage */
  function saveSettings() {
    if (import.meta.client) {
      localStorage.setItem('chat-yanawa-system-prompt', systemPrompt.value)
      localStorage.setItem('chat-yanawa-max-context', maxContextMessages.value.toString())
    }
  }

  /**
   * Automatic observer that triggers a save whenever configuration state changes.
   * Ensures settings are always synced without manual 'Save' button.
   */
  watch(systemPrompt, () => {
    saveSettings()
  })

  return {
    systemPrompt,
    maxContextMessages,
    saveSettings
  }
}
