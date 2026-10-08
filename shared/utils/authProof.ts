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
 * Display-name limits and the text both sides sign for a login proof.
 * The browser and the server build the same message before the HMAC.
 */

/**
 * Shortest display name, in characters, after whitespace is collapsed.
 */
export const AUTH_DISPLAY_NAME_MIN_LENGTH = 2

/**
 * Longest display name, in characters, after whitespace is collapsed.
 */
export const AUTH_DISPLAY_NAME_MAX_LENGTH = 32

/**
 * First line of a login proof message. Identifies this proof format.
 */
export const AUTH_PROOF_VERSION           = 'meow-auth-v1'

/**
 * Collapses repeated whitespace and trims a display name.
 * @param value - Raw username from the login form.
 * @returns The normalized display name.
 */
export function normalizeAuthUsername(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Whether a display name is an allowed length and has no ASCII control characters.
 * @param value - Raw or already normalized username.
 * @returns `true` when the normalized name is within the length limits and has no control characters.
 */
export function isValidAuthUsername(value: string): boolean {
  const normalized = normalizeAuthUsername(value)
  return normalized.length >= AUTH_DISPLAY_NAME_MIN_LENGTH
      && normalized.length <= AUTH_DISPLAY_NAME_MAX_LENGTH
      && !/[\u0000-\u001F\u007F]/.test(normalized)
}

/**
 * Builds the canonical text that the login HMAC is computed over.
 * @param challengeId - Id of the issued challenge.
 * @param challenge - Challenge nonce.
 * @param username - Display name. It is normalized before it is included.
 * @returns Version, challenge id, challenge, and username, one per line.
 */
export function buildLoginProofMessage(challengeId: string, challenge: string, username: string): string {
  return [
    AUTH_PROOF_VERSION,
    challengeId.trim(),
    challenge.trim(),
    normalizeAuthUsername(username)
  ].join('\n')
}
