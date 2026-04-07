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

export const AUTH_DISPLAY_NAME_MIN_LENGTH = 2
export const AUTH_DISPLAY_NAME_MAX_LENGTH = 32
export const AUTH_PROOF_VERSION           = 'meow-auth-v1'

export function normalizeAuthUsername(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function isValidAuthUsername(value: string): boolean {
  const normalized = normalizeAuthUsername(value)
  return normalized.length >= AUTH_DISPLAY_NAME_MIN_LENGTH
      && normalized.length <= AUTH_DISPLAY_NAME_MAX_LENGTH
      && !/[\u0000-\u001F\u007F]/.test(normalized)
}

export function buildLoginProofMessage(challengeId: string, challenge: string, username: string): string {
  return [
    AUTH_PROOF_VERSION,
    challengeId.trim(),
    challenge.trim(),
    normalizeAuthUsername(username)
  ].join('\n')
}
