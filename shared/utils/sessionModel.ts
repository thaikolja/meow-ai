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
 * A chat thread is one session. Picking a model there must not rewrite the
 * default used for new chats.
 */
export function isChatSessionPath(path: string): boolean {
  return chatSessionKey(path) !== ''
}

/** Chat id or slug from `/chat/<key>`, ignoring the query string. */
export function chatSessionKey(path: string): string {
  const match = path.split('?')[0]?.match(/^\/chat\/([^/]+)\/?$/)
  if (!match?.[1]) return ''
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export function displayedModelId(input: {
  path: string
  chatModel?: string | null
  globalModel: string
}): string {
  if (isChatSessionPath(input.path)) {
    const sessionModel = input.chatModel?.trim()
    if (sessionModel) return sessionModel
  }

  return input.globalModel
}

/**
 * On a chat path, the pick stays on that chat. Elsewhere it becomes the
 * default for new chats.
 */
export function applyModelPick(input: {
  path: string
  pickedModel: string
  globalModel: string
}): { sessionModel: string | null; globalModel: string } {
  const picked = input.pickedModel.trim()

  if (isChatSessionPath(input.path)) {
    return {
      sessionModel: picked || null,
      globalModel:  input.globalModel
    }
  }

  return {
    sessionModel: null,
    globalModel:  picked || input.globalModel
  }
}
