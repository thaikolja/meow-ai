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
 * Shared authentication constants.
 * Names and max age of the cookies set after a successful login.
 */

/**
 * Cookie name for the signed session token.
 */
export const AUTH_SESSION_COOKIE_NAME: string  = 'chat_session'

/**
 * Cookie name for the readable display name.
 */
export const AUTH_USERNAME_COOKIE_NAME: string = 'chat_username'

/**
 * Cookie lifetime in seconds (seven days).
 */
export const AUTH_SESSION_MAX_AGE: number      = 60 * 60 * 24 * 7

