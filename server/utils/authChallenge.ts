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

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { buildLoginProofMessage, normalizeAuthUsername } from '#shared/utils/authProof'

type LoginChallengeEntry = {
  challenge: string
  expiresAt: number
  ipAddress: string
}

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

function cleanupExpiredChallenges(now = Date.now()) {
  for (const [ challengeId, challenge ] of loginChallenges) {
    if (challenge.expiresAt <= now) {
      loginChallenges.delete(challengeId)
    }
  }
}

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

export function createLoginProof(secret: string, challengeId: string, challenge: string, username: string): string {
  return createHmac('sha256', secret)
  .update(buildLoginProofMessage(challengeId, challenge, normalizeAuthUsername(username)))
  .digest('base64url')
}

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
