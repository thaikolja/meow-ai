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
 * Model picked inside one open chat. New chats do not read this.
 */
export function useSessionModel() {
  const picked = useState<Record<string, string>>('chat-session-models', () => ({}))

  /**
   * Remembers the model picked for one open chat.
   *
   * @param chatId - Internal chat id.
   * @param modelId - Model id. Blank values are ignored.
   */
  function rememberSessionModel(chatId: string, modelId: string) {
    const nextModel = modelId.trim()
    if (!chatId || !nextModel) return
    picked.value = { ...picked.value, [chatId]: nextModel }
  }

  /**
   * Returns the model last picked for this chat, or an empty string.
   *
   * @param chatId - Internal chat id.
   */
  function recallSessionModel(chatId: string): string {
    return picked.value[chatId] || ''
  }

  return { rememberSessionModel, recallSessionModel }
}
