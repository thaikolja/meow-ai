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
 * In-memory login challenges and HMAC-SHA256 proof checks for the house secret.
 * Each challenge is single-use, bound to one IP address, and expires after five minutes.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { buildLoginProofMessage, normalizeAuthUsername } from '#shared/utils/authProof'

type LoginChallengeEntry = {
  challenge: string
  expiresAt: number
  ipAddress: string
}

/**
 * Lifetime of a newly issued login challenge, in milliseconds (five minutes).
 */
export const LOGIN_CHALLENGE_MAX_AGE_MS = 5 * 60 * 1000

const loginChallenges = new Map<string, LoginChallengeEntry>()

function safeEqual(left: string, right: string): boolean {
  const leftBuffer  = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length!==rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

/**
 * Drops challenges whose expiry is at or before `now`.
 *
 * @param now - Current time in milliseconds. Defaults to `Date.now()`.
 */
function cleanupExpiredChallenges(now = Date.now()) {
  for (const [ challengeId, challenge ] of loginChallenges) {
    if (challenge.expiresAt <= now) {
      loginChallenges.delete(challengeId)
    }
  }
}

/**
 * Stores a new challenge for `ipAddress` after dropping expired ones.
 * The id is 18 random bytes and the challenge is 32 random bytes, both base64url.
 *
 * @param ipAddress - Caller address stored with the challenge and compared exactly later.
 * @returns `{ challengeId, challenge, expiresAt }`.
 */
export function issueLoginChallenge(ipAddress: string) {
  cleanupExpiredChallenges()

  const challengeId = randomBytes(18).toString('base64url')
  const challenge   = randomBytes(32).toString('base64url')
  const expiresAt   = Date.now() + LOGIN_CHALLENGE_MAX_AGE_MS

  loginChallenges.set(challengeId, {
    challenge,
    expiresAt,
    ipAddress
  })

  return {
    challengeId,
    challenge,
    expiresAt
  }
}

/**
 * Deletes the challenge and returns it only when it is unexpired and was issued for `ipAddress`.
 * An unknown id returns null. A known entry is always removed, including when it is expired or bound to another IP.
 *
 * @param challengeId - Id returned when the challenge was issued.
 * @param ipAddress - Must equal the address stored at issue time.
 * @returns `{ challenge, expiresAt }`, or `null` when the id is unknown, expired, or bound to another IP.
 */
export function consumeLoginChallenge(challengeId: string, ipAddress: string): { challenge: string; expiresAt: number } | null {
  cleanupExpiredChallenges()

  const entry = loginChallenges.get(challengeId)
  if (!entry) {
    return null
  }

  loginChallenges.delete(challengeId)

  if (entry.expiresAt <= Date.now()) {
    return null
  }

  if (entry.ipAddress!==ipAddress) {
    return null
  }

  return {
    challenge: entry.challenge,
    expiresAt: entry.expiresAt
  }
}

/**
 * HMAC-SHA256 of the shared login-proof message, using the house secret as the key.
 * The username is normalized before signing.
 *
 * @param secret - HMAC key. This is the house secret.
 * @param challengeId - Challenge id included in the signed message.
 * @param challenge - Challenge value included in the signed message.
 * @param username - Cat name, normalized before signing.
 * @returns Base64url digest.
 */
export function createLoginProof(secret: string, challengeId: string, challenge: string, username: string): string {
  return createHmac('sha256', secret)
  .update(buildLoginProofMessage(challengeId, challenge, normalizeAuthUsername(username)))
  .digest('base64url')
}

/**
 * Returns whether `params.proof` matches the HMAC from `createLoginProof`.
 * An empty secret or proof is rejected before that compare.
 *
 * @param params - House secret, challenge id, challenge, username, and the client proof.
 * @returns `true` only when the proof matches.
 */
export function verifyLoginProof(params: {
  secret: string
  challengeId: string
  challenge: string
  username: string
  proof: string
}): boolean {
  if (!params.secret || !params.proof) {
    return false
  }

  const expectedProof = createLoginProof(
      params.secret,
      params.challengeId,
      params.challenge,
      params.username
  )

  return safeEqual(params.proof, expectedProof)
}
