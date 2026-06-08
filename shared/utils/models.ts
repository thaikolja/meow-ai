/*
 * Copyright (C) 2026 Kolja Nolte
 * https://meow.yanawa.io
 * info@meow.yanawa.io
 *
 * This work is licensed under the MIT License. You are free to use, modify,
 * and distribute this work, provided that you include the copyright notice
 * and this permission notice in all copies and substantial portions of the work.
 * For more information, visit: https://opensource.org/licenses/MIT
 *
 * @author    Kolja Nolte
 * @email     kolja.nolte@gmail.com
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

/**
 * Regex patterns that identify model IDs that produce chain-of-thought /
 * reasoning style output. Patterns are matched against the lowercased model ID
 * with any leading "models/" prefix stripped.
 *
 * Keep patterns anchored on provider-specific prefixes (e.g. "deepseek-r1") or
 * model-name roots (e.g. "minimax", "mimo") to avoid false positives on
 * substrings inside unrelated identifiers.
 */
export const THINKING_MODEL_PATTERNS: RegExp[] = [
  /(^|[^a-z])reasoner/,
  /(^|[^a-z])thinking/,
  /deepseek-r1/,
  /r1-distill/,
  /(^|[^a-z])minimax/,
  /(^|[^a-z])mimo/
]

/**
 * Strip inline <think>...</think> blocks (and any attributes) from streamed
 * reasoning content. Used by the chat UI to hide the model's chain of thought
 * from end users while the model is still thinking.
 */
const THINK_BLOCK_PATTERN = /<think\b[^>]*>[\s\S]*?<\/think>/g

export function stripThinkBlocks(content: string): string {
  return content.replace(THINK_BLOCK_PATTERN, '').trim()
}
