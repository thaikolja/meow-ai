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
 * Draft edits for the settings modal.
 * Restore and reset change the draft only. Save is what commits it.
 */

/** Context window used when the modal resets every field. */
export const DEFAULT_MAX_CONTEXT_MESSAGES = 25

/**
 * Unsaved copy of the three modal fields.
 */
export type SettingsDraft = {
  systemPrompt: string
  modelId: string
  maxContext: number
}

/**
 * Puts the shipped prompt back into the draft and leaves the model and context window alone.
 *
 * @param draft - Current unsaved fields.
 * @param defaultPrompt - Text of `public/system-prompt.md`, or the bundled fallback.
 * @returns A new draft. The input is not changed.
 */
export function restoreSystemPromptDraft(draft: SettingsDraft, defaultPrompt: string): SettingsDraft {
  return {
    systemPrompt: defaultPrompt,
    modelId:      draft.modelId,
    maxContext:   draft.maxContext
  }
}

/**
 * Picks a model id the dropdown can show.
 * A configured default that is not in the catalog would blank the select.
 *
 * @param currentModelId - Id currently chosen in the draft.
 * @param catalogIds - Active catalog ids.
 * @param configuredDefault - Runtime default model id.
 */
export function visibleModelId(currentModelId: string, catalogIds: string[], configuredDefault: string): string {
  if (catalogIds.includes(currentModelId)) return currentModelId
  if (catalogIds.includes(configuredDefault)) return configuredDefault
  return catalogIds[0] || currentModelId || configuredDefault
}

/**
 * Puts every modal field back to its default. Does not touch chat history.
 *
 * @param defaultPrompt - Text of `public/system-prompt.md`, or the bundled fallback.
 * @param defaultModelId - Model id to keep in the draft.
 * @returns A draft with the shipped prompt, that model id, and 25 context messages.
 */
export function resetSettingsDraft(defaultPrompt: string, defaultModelId: string): SettingsDraft {
  return {
    systemPrompt: defaultPrompt,
    modelId:      defaultModelId,
    maxContext:   DEFAULT_MAX_CONTEXT_MESSAGES
  }
}

/**
 * Copies the saved fields into the draft once they arrive from the account.
 * An edit the user already made in the open modal stays as they left it.
 *
 * @param draftEdited - True after the user types in the open modal.
 * @param current - Draft on screen.
 * @param committed - Fields last stored for this username.
 * @param defaultPrompt - Shipped prompt, used when the stored prompt is null.
 */
export function refillSettingsDraft(
    draftEdited: boolean,
    current: SettingsDraft,
    committed: { systemPrompt: string | null, modelId: string, maxContext: number },
    defaultPrompt: string
): SettingsDraft {
  if (draftEdited) return current

  return {
    systemPrompt: committed.systemPrompt ?? defaultPrompt,
    modelId:      committed.modelId,
    maxContext:   committed.maxContext
  }
}

/**
 * Turns a blank prompt, or one that matches the shipped prompt, into `null`.
 *
 * @param draftPrompt - Prompt text from the modal.
 * @param defaultPrompt - Shipped prompt.
 * @returns The trimmed custom prompt, or `null` when the default should be stored.
 */
export function committedSystemPrompt(draftPrompt: string, defaultPrompt: string): string | null {
  const value = draftPrompt.trim()
  if (!value || value === defaultPrompt.trim()) {
    return null
  }

  return value
}
