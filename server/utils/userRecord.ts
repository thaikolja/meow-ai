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
 * Per-username settings and chats under `.data/accounts`.
 * The username always comes from `verifySessionToken`. A missing or invalid
 * session throws before any file is read or written. This store never touches `models.json`.
 */

import { createHash }                                                     from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join }                                                           from 'node:path'

import {
  emptyAccountRecord,
  normalizeAccountChats,
  normalizeAccountSettings,
  type AccountChat,
  type AccountRecord,
  type AccountSettings
}                             from '../../shared/utils/accountRecord'
import { verifySessionToken } from './authSession'
import { ensureDataDir }      from './dataDir'

/**
 * Thrown when the session cookie is missing, badly signed, or expired.
 * Callers map this to HTTP 401. No account file is touched.
 */
export class AccountAuthError extends Error {
  readonly statusCode = 401

  /**
   * @param message - Public failure text.
   */
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AccountAuthError'
  }
}

/**
 * Fields the client may replace. Omitted fields stay as they are on disk.
 */
export type AccountPatch = {
  settings?: unknown
  chats?: unknown
}

const writeChains = new Map<string, Promise<void>>()

/**
 * Resolves the data directory at call time so tests can point `NUXT_DATA_DIR` at a temp folder.
 *
 * @param configuredDataDir - Explicit directory. When omitted, `NUXT_DATA_DIR` is used.
 */
export function accountDataDir(configuredDataDir?: string): string {
  return ensureDataDir(configuredDataDir ?? process.env['NUXT_DATA_DIR'])
}

/**
 * Returns the verified username, or throws `AccountAuthError` before any account file is used.
 *
 * @param token - `chat_session` cookie value.
 * @param secret - Session signing secret.
 */
export function requireRecordUsername(token: string | null | undefined, secret: string): string {
  const session = verifySessionToken(token, secret)
  if (!session) {
    throw new AccountAuthError()
  }

  return session.username
}

/**
 * File name for a username. The hash avoids path tricks. The file itself stores the username.
 *
 * @param dataDir - Data directory, already created.
 * @param username - Verified session username.
 */
function accountFilePath(dataDir: string, username: string): string {
  const digest = createHash('sha256').update(username, 'utf8').digest('hex')
  return join(dataDir, 'accounts', `${digest}.json`)
}

/**
 * Reads one account file. A missing, corrupt, or mismatched file becomes an empty record.
 *
 * @param dataDir - Data directory.
 * @param username - Verified session username.
 */
export function loadUserRecord(dataDir: string, username: string): AccountRecord {
  const filePath = accountFilePath(dataDir, username)
  if (!existsSync(filePath)) {
    return emptyAccountRecord()
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as { username?: unknown, settings?: unknown, chats?: unknown }
    if (parsed.username !== username) {
      return emptyAccountRecord()
    }

    return {
      settings: normalizeAccountSettings(parsed.settings),
      chats:    normalizeAccountChats(parsed.chats),
      stored:   true
    }
  } catch {
    return emptyAccountRecord()
  }
}

/**
 * Writes one account file without touching any other file in the data directory.
 *
 * @param dataDir - Data directory.
 * @param username - Verified session username.
 * @param record - Settings and chats to store.
 */
function writeUserRecord(dataDir: string, username: string, record: AccountRecord): void {
  const accountsDir = join(dataDir, 'accounts')
  if (!existsSync(accountsDir)) {
    mkdirSync(accountsDir, { recursive: true })
  }

  const filePath  = accountFilePath(dataDir, username)
  const temporary = `${filePath}.tmp`
  writeFileSync(temporary, JSON.stringify({
    username,
    settings: record.settings,
    chats:    record.chats
  }, null, 2))
  renameSync(temporary, filePath)
}

/**
 * Merges a patch into the current record for a verified username.
 *
 * @param dataDir - Data directory.
 * @param username - Verified session username.
 * @param patch - Settings, chats, or both.
 */
export function saveUserRecord(dataDir: string, username: string, patch: AccountPatch): AccountRecord {
  const current             = loadUserRecord(dataDir, username)
  const next: AccountRecord = {
    settings: patch.settings === undefined ? current.settings : normalizeAccountSettings(patch.settings),
    chats:    patch.chats === undefined ? current.chats : normalizeAccountChats(patch.chats)
  }

  writeUserRecord(dataDir, username, next)
  return next
}

/**
 * Runs account writes for one username one after another.
 *
 * @param username - Verified session username.
 * @param write - Write to run after earlier writes for this username finish.
 */
function enqueueWrite(username: string, write: () => AccountRecord): Promise<AccountRecord> {
  const previous = writeChains.get(username) ?? Promise.resolve()
  const result   = previous.then(write, write)
  writeChains.set(username, result.then(() => undefined, () => undefined))
  return result
}

/**
 * Loads the account for the username inside a valid session token.
 * An invalid token throws and does not read a file.
 *
 * @param dataDir - Data directory.
 * @param token - `chat_session` cookie value.
 * @param secret - Session signing secret.
 */
export function loadAccountForSession(dataDir: string, token: string | null | undefined, secret: string): AccountRecord {
  const username = requireRecordUsername(token, secret)
  return loadUserRecord(dataDir, username)
}

/**
 * Saves settings and/or chats for the username inside a valid session token.
 * An invalid token throws and does not create or change a file.
 *
 * @param dataDir - Data directory.
 * @param token - `chat_session` cookie value.
 * @param secret - Session signing secret.
 * @param patch - Settings, chats, or both. A username in the patch is ignored.
 */
export function saveAccountForSession(dataDir: string, token: string | null | undefined, secret: string, patch: AccountPatch): Promise<AccountRecord> {
  const username = requireRecordUsername(token, secret)
  return enqueueWrite(username, () => saveUserRecord(dataDir, username, patch))
}

export type { AccountChat, AccountRecord, AccountSettings }
