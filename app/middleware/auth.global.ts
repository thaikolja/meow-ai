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
 * Global authentication middleware for the Meow application.
 * Keeps session state warm and retires the old /login route.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip internal Nuxt paths (build assets, image proxy, etc.)
  if (to.path.startsWith('/_') || to.path.startsWith('/__')) {
    return
  }

  if (to.path==='/login') {
    return navigateTo('/', { replace: true })
  }

  const { verifySession } = useAuthSession()
  await verifySession(import.meta.server)
})
