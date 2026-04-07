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

const appPassword = process.env['NUXT_APP_PASSWORD']?.trim() || ''
const sessionSecret = process.env['NUXT_SESSION_SECRET']?.trim() || appPassword

if (process.env['NODE_ENV'] === 'production' && !appPassword) {
  throw new Error('NUXT_APP_PASSWORD environment variable is required in production')
}

export default defineNuxtConfig({
  compatibilityDate: '2026-04-04',
  devtools: { enabled: false },

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxt/fonts'
  ],

  runtimeConfig: {
    appPassword,
    sessionSecret,
    allowPrivateProviderUrls: process.env['NUXT_ALLOW_PRIVATE_PROVIDER_URLS'] === 'true',
    deepseekApiKey: process.env['NUXT_DEEPSEEK_API_KEY']?.trim() || '',
    groqApiKey: process.env['NUXT_GROQ_API_KEY']?.trim() || '',
    googleApiKey: process.env['NUXT_GOOGLE_API_KEY']?.trim() || '',
    public: {
      defaultProvider: process.env['NUXT_PUBLIC_DEFAULT_PROVIDER']?.trim() || 'gemini-default',
      defaultModel: process.env['NUXT_PUBLIC_DEFAULT_MODEL']?.trim() || 'models/gemini-3.1-flash-lite-preview'
    }
  },

  css: [
    '~/assets/css/main.css',
    '~/assets/css/markdown.css'
  ],

  app: {
    head: {
      title: 'Meow 🐾',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content: 'Learn German with a playful AI tutor built for fast, focused conversation practice.'
        },
        { name: 'robots', content: 'nofollow,noindex' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg', sizes: 'any' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://meow.yanawa.io' }
      ]
    }
  },

  colorMode: {
    preference: 'dark'
  },

  icon: {
    serverBundle: 'local'
  },

  nitro: {
    compressPublicAssets: true,
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
        }
      }
    }
  },

  vite: {
    optimizeDeps: {
      include: [
        'marked',
        'sanitize-html',
        'highlight.js/lib/core'
      ]
    }
  }
})
