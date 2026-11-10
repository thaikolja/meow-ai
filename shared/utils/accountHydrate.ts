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
 * Decides when a chat address is really missing.
 * The in-memory list is empty until the signed-in username's account has loaded.
 */

/**
 * True when the address should leave the chat page.
 * A missing thread before the account load finishes stays put.
 *
 * @param accountSynced - Whether this username's server copy is now in memory.
 * @param chatKey - Route id or slug. Blank when the address has no chat.
 * @param chatFound - Whether `getChat` found that key.
 */
export function missingChatRedirect(accountSynced: boolean, chatKey: string, chatFound: boolean): boolean {
  return accountSynced && chatKey.trim().length > 0 && !chatFound
}
