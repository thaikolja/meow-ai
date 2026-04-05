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

/**
 * Nuxt configuration file.
 * Configures modules, runtime config, global CSS, and app-level metadata.
 */
export default defineNuxtConfig({
  // Ensures compatibility with current development date
  compatibilityDate: '2026-04-04',

  devtools: { enabled: false },

  modules: [
    '@nuxt/ui',    // UI component library
    '@nuxt/image', // Image optimization
    '@nuxt/icon'   // Icon management
  ],

  runtimeConfig: {
    // Secret key for login (populated from environment variables)
    appPassword:    '',
    deepseekApiKey: '',
    groqApiKey:     '',
    googleApiKey:   ''
  },

  css: [
    '~/assets/css/main.css',     // Core application styles
    '~/assets/css/markdown.css' // Specialized styles for chat message content
  ],

  app: {
    head: {
      title: 'Meow 🐾',
      htmlAttrs: { lang: 'en' },
      meta:  [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Learn German with cats' }
      ],
      link:  [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'canonical', href: 'https://meow.yanawa.io' }
      ]
    }
  },

  // Forces dark mode by default for high-premium aesthetic
  colorMode: {
    preference: 'dark'
  },

  icon: {
    // Uses local icon sets to avoid bundling delays and external dependencies
    serverBundle: 'local'
  }
})
