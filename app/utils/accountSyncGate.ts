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
 * Keeps account hydration from echoing a save back to the server,
 * and notices when the user edits before that hydration finishes.
 */

/** localStorage key for the username that owns the browser cache. */
export const ACCOUNT_OWNER_KEY = 'chat-yanawa-account-owner'

let suppressCount = 0
let mutationEpoch = 0
/** False until the signed-in username's server copy has been applied. */
let writesOpen    = false

/**
 * True while hydration is applying a server record. Saves must not PUT.
 * @returns `true` when the check passes.
 */
export function isAccountPushSuppressed(): boolean {
  return suppressCount > 0
}

/**
 * Runs `fn` without writing the account back to the server.
 *
 * @param fn - State update that should stay local.
 * @returns The result (T).
 */
export function withoutAccountPush<T>(fn: () => T): T {
  suppressCount += 1
  try {
    return fn()
  } finally {
    suppressCount -= 1
  }
}

/**
 * True after this username's account load has been applied.
 * Earlier saves must not PUT, or they replace the server copy with an empty list.
 * @returns `true` when the check passes.
 */
export function accountWritesOpen(): boolean {
  return writesOpen
}

/**
 * Opens or closes account PUTs. Closed while a load is in flight and after logout.
 *
 * @param open - Whether a signed-in edit may write the account.
 */
export function setAccountWritesOpen(open: boolean): void {
  writesOpen = open
}

/**
 * True when a local edit should PUT to the account.
 * A closed write window and a hydration apply both stay local.
 *
 * @param authenticated - Whether the session is signed in.
 * @param suppressed - Whether hydration is applying a record.
 * @returns `true` when the check passes.
 */
export function canPushAccountWrite(authenticated: boolean, suppressed: boolean): boolean {
  return authenticated && writesOpen && !suppressed
}

/**
 * Records a user edit that happened after the account load.
 * Edits before that load do not count, so the load still applies the server copy.
 */
export function noteAccountMutation(): void {
  if (!writesOpen) return
  mutationEpoch += 1
}

/**
 * Whether a finished account fetch should replace local state.
 * The first load always applies. A later load applies when nothing was saved during the fetch.
 *
 * @param epochAtStart - `accountMutationEpoch()` from before the fetch.
 * @param writesWereOpen - Whether PUTs were already allowed before this fetch.
 * @returns `true` when the check passes.
 */
export function shouldApplyFetchedAccount(epochAtStart: number, writesWereOpen: boolean): boolean {
  if (!writesWereOpen) return true
  return accountMutationEpoch() === epochAtStart
}

/**
 * Current edit generation. Compare it before and after a fetch.
 * @returns The number this function produces.
 */
export function accountMutationEpoch(): number {
  return mutationEpoch
}

/**
 * Forgets edits after logout so the next username can hydrate cleanly.
 */
export function resetAccountMutation(): void {
  mutationEpoch = 0
}
