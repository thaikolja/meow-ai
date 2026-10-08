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
 * Recognizes the bare `/_nuxt` paths that must not be served as application routes.
 */

/**
 * Reports whether `pathname` is exactly `/_nuxt` or `/_nuxt/`.
 *
 * @param pathname - Request pathname, without a query string.
 * @returns `true` only for those two paths.
 */
export function isBareBuildAssetsPath(pathname: string): boolean {
  return pathname==='/_nuxt' || pathname==='/_nuxt/'
}
