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
 * Loads the signed-in username's settings and chats from the server.
 * A server record wins over this browser. An empty server record can take a cache
 * that already belongs to that username, or an untagged cache from before accounts existed.
 */

import type { AccountRecord }           from '#shared/utils/accountRecord'
import { DEFAULT_MAX_CONTEXT_MESSAGES } from '#shared/utils/settingsDraft'
import {
  ACCOUNT_OWNER_KEY,
  accountMutationEpoch,
  accountWritesOpen,
  resetAccountMutation,
  setAccountWritesOpen,
  shouldApplyFetchedAccount
}                                       from '~/utils/accountSyncGate'

/**
 * True when the server copy has anything the user saved.
 *
 * @param record - Account returned by `GET /api/account`.
 * @returns `true` when the check passes.
 */
function serverHasSavedData(record: AccountRecord): boolean {
  return record.chats.length > 0
      || Boolean(record.settings.systemPrompt)
      || Boolean(record.settings.modelId)
      || record.settings.maxContext !== DEFAULT_MAX_CONTEXT_MESSAGES
}

/**
 * Pulls the account after login and clears in-memory copies on logout.
 * Call it once from the root shell.
 */
export function useAccountSync() {
  const { authState } = useAuthSession()
  const syncedFor     = useState<string | null>('account-synced-for', () => null)
  const {
          applyRemoteChats,
          readCachedChats,
          clearMemory
        }             = useChats()
  const {
          applyRemoteSettings,
          readCachedSettings,
          settingsSnapshot,
          clearSettingsMemory
        }             = useSettings()

  /**
   * Replaces local state with the server record, or uploads a matching browser cache when the server is empty.
   *
   * @param username - Username from the verified session.
   */
  function finishHydrate(username: string) {
    setAccountWritesOpen(true)
    syncedFor.value = username
  }

  /**
   * Loads the signed-in account, then opens writes when that load still applies.
   *
   * @param username - Username from the verified session.
   */
  async function hydrate(username: string) {
    if (syncedFor.value === username) return

    const writesWereOpen = accountWritesOpen()
    const epochAtStart   = accountMutationEpoch()
    setAccountWritesOpen(false)

    let remote: AccountRecord | null = null

    try {
      remote = await $fetch<AccountRecord>('/api/account')
    } catch {
      remote = null
    }

    if (!authState.value.authenticated || authState.value.username !== username) return
    if (!shouldApplyFetchedAccount(epochAtStart, writesWereOpen)) {
      finishHydrate(username)
      return
    }

    const owner          = localStorage.getItem(ACCOUNT_OWNER_KEY)
    const cachedChats    = readCachedChats()
    const cachedSettings = readCachedSettings()
    const cacheMatches   = owner === null || owner === username
    const cacheHasData   = cachedChats.length > 0
        || Boolean(cachedSettings.systemPrompt)
        || Boolean(cachedSettings.modelId)
        || cachedSettings.maxContext !== DEFAULT_MAX_CONTEXT_MESSAGES

    if (!remote) {
      if (cacheMatches && cacheHasData) {
        applyRemoteSettings(cachedSettings)
        applyRemoteChats(cachedChats)
      }
      finishHydrate(username)
      return
    }

    if (remote.stored || serverHasSavedData(remote)) {
      applyRemoteSettings(remote.settings)
      applyRemoteChats(remote.chats)
      localStorage.setItem(ACCOUNT_OWNER_KEY, username)
      finishHydrate(username)
      return
    }

    if (remote && cacheMatches && cacheHasData) {
      applyRemoteSettings(cachedSettings)
      applyRemoteChats(cachedChats)
      localStorage.setItem(ACCOUNT_OWNER_KEY, username)
      await $fetch('/api/account', {
        method: 'PUT',
        body:   {
          settings: settingsSnapshot(),
          chats:    cachedChats
        }
      }).catch(() => undefined)
      finishHydrate(username)
      return
    }

    if (remote) {
      applyRemoteSettings(remote.settings)
      applyRemoteChats(remote.chats)
    }

    localStorage.setItem(ACCOUNT_OWNER_KEY, username)
    finishHydrate(username)
  }

  watch(
      () => [ authState.value.authenticated, authState.value.username ] as const,
      ([ authenticated, username ]) => {
        if (!import.meta.client) return

        if (!authenticated || !username) {
          syncedFor.value = null
          setAccountWritesOpen(false)
          resetAccountMutation()
          clearMemory()
          clearSettingsMemory()
          return
        }

        void hydrate(username)
      },
      { immediate: true }
  )
}
