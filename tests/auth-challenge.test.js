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

import { createHmac } from 'node:crypto'

import { describe, expect, test } from 'bun:test'

import { consumeLoginChallenge, issueLoginChallenge, verifyLoginProof } from '../server/utils/authChallenge'
import { buildLoginProofMessage, isValidAuthUsername, normalizeAuthUsername } from '../shared/utils/authProof'

describe('authChallenge', () => {
  test('normalizes and validates cat names', () => {
    expect(normalizeAuthUsername('  Captain   Whiskers  ')).toBe('Captain Whiskers')
    expect(isValidAuthUsername('Captain Whiskers')).toBe(true)
    expect(isValidAuthUsername('x')).toBe(false)
    expect(isValidAuthUsername('Bad\u0000Cat')).toBe(false)
  })

  test('consumes login challenges only once and binds them to the issuing ip', () => {
    const wrongIpChallenge = issueLoginChallenge('203.0.113.5')
    expect(consumeLoginChallenge(wrongIpChallenge.challengeId, '198.51.100.8')).toBeNull()

    const issued = issueLoginChallenge('203.0.113.5')
    const consumed = consumeLoginChallenge(issued.challengeId, '203.0.113.5')

    expect(consumed).toEqual({
      challenge: issued.challenge,
      expiresAt: issued.expiresAt
    })
    expect(consumeLoginChallenge(issued.challengeId, '203.0.113.5')).toBeNull()
  })

  test('verifies one-time paw-print proofs against the shared secret', () => {
    const issued   = issueLoginChallenge('203.0.113.5')
    const username = 'Captain Whiskers'
    const secret   = 'shared-house-secret'
    const proof    = createHmac('sha256', secret)
    .update(buildLoginProofMessage(issued.challengeId, issued.challenge, username))
    .digest('base64url')

    expect(verifyLoginProof({
      secret,
      challengeId: issued.challengeId,
      challenge: issued.challenge,
      username,
      proof
    })).toBe(true)

    expect(verifyLoginProof({
      secret,
      challengeId: issued.challengeId,
      challenge: issued.challenge,
      username,
      proof: 'not-the-right-paw-print'
    })).toBe(false)
  })
})
