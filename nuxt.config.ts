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
 * Runtime configuration entrypoint for Nuxt.
 *
 * This file centralizes runtime defaults and environment variable wiring
 * used by both server and client code (public keys only).
 *
 * Every top-level declaration is documented with JSDoc and an inline comment
 * to make the intended behavior explicit for future contributors and agents.
 */

/**
 * Read the application password from the environment.
 *
 * This password is required for production login. Trim whitespace and provide
 * an empty-string fallback for local/dev scenarios where the variable may be missing.
 *
 * @type {string}
 */
    // Read NUXT_APP_PASSWORD, trim and default to empty string when missing.
const appPassword: string = process.env['NUXT_APP_PASSWORD']?.trim() || ''

/**
 * Session secret used to sign session cookies.
 *
 * Falls back to the application password when a dedicated session secret is
 * not provided. Trimming normalizes the env var similar to the password.
 *
 * @type {string}
 */
      // Use explicit session secret if provided; default to appPassword for backward compatibility.
const sessionSecret: string = process.env['NUXT_SESSION_SECRET']?.trim() || appPassword

//noinspection JSUnusedGlobalSymbols
/**
 * Nuxt configuration export.
 *
 * The configuration object below declares compatibility, modules, runtimeConfig,
 * asset handling, security headers, and Vite optimization hints.
 *
 * Each property is annotated with JSDoc and inline comments to explain intent.
 */
export default defineNuxtConfig({
  /**
   * Compatibility date for Nuxt features.
   *
   * Locking this helps avoid surprising framework upgrades changing behavior.
   */
  compatibilityDate: '2026-04-04', // Nuxt compat date to stabilize behavior

  /**
   * Devtools configuration.
   *
   * Disabled by default in this repository to avoid exposing internals in production-like runs.
   */
  devtools: { enabled: false }, // Toggle Nuxt devtools globally

  /**
   * Nuxt modules used by the app.
   *
   * - @nuxt/ui: UI primitives and tokens
   * - @nuxt/image: optimized image handling
   * - @nuxt/icon: icon generation and bundling
   * - @nuxt/fonts: automatic font loading
   */
  modules: [
    '@nuxt/ui', // UI library and design tokens
    '@nuxt/image', // Image optimization
    '@nuxt/icon', // Icon bundling
    '@nuxt/fonts' // Font loader
  ],

  /**
   * runtimeConfig exposes server-only and public runtime variables.
   *
   * server-side values are available via useRuntimeConfig() on the server.
   * public values are exposed to the client under runtimeConfig.public.
   */
  runtimeConfig: {
    /** Server-only: application password (used only on server) */ appPassword,
    /** Server-only: session cookie signing secret */ sessionSecret,
    /**
     * Allow provider base URLs that resolve to private/internal hosts.
     *
     * Controlled via NUXT_ALLOW_PRIVATE_PROVIDER_URLS environment variable.
     */
    allowPrivateProviderUrls:                                                     process.env['NUXT_ALLOW_PRIVATE_PROVIDER_URLS']==='true', // boolean flag
    /** Server-only: absolute path to the persistent data directory */ dataDir:   process.env['NUXT_DATA_DIR']?.trim() || join(process.cwd(), '.data'),
    /** Server-only: DeepSeek API key (trimmed, default empty) */ deepseekApiKey: process.env['NUXT_DEEPSEEK_API_KEY']?.trim() || '',
    /** Server-only: Google API key (trimmed, default empty) */ googleApiKey:     process.env['NUXT_GOOGLE_API_KEY']?.trim() || '',
    /** Server-only: OpenCode API key (trimmed, default empty) */ opencodeApiKey: process.env['NUXT_OPENCODE_API_KEY']?.trim() || '',
    /** Server-only: OpenRouter API key (trimmed, default empty) */ openrouterApiKey: process.env['NUXT_OPENROUTER_API_KEY']?.trim() || '',
    /**
     * Public runtime config accessible by the client.
     *
     * Contains default provider/model selection used by composables and the UI.
     */
    public: {
      /** Public default provider ID used when no selection exists */ defaultProvider:      process.env['NUXT_PUBLIC_DEFAULT_PROVIDER']?.trim() || 'openrouter-default',
      /** Public default model ID used for new chats and initial selection */ defaultModel: process.env['NUXT_PUBLIC_DEFAULT_MODEL']?.trim() || 'google/gemini-3-flash-preview'
    }
  },


  /**
   * Global CSS files included in every page.
   *
   * - main.css: global app styles
   * - markdown.css: styling for rendered markdown messages and prompts
   */
  css: [
    '~/assets/css/main.css', // primary app stylesheet
    '~/assets/css/markdown.css' // markdown rendering styles
  ],

  /**
   * Application-level HTML head defaults.
   *
   * Controls document title, language attributes, meta tags and link tags.
   */
  app: {
    head: {
      /** Default document title shown in browser tabs */ title:                   'Meow 🐾',
      /** HTML attributes such as language for accessibility and SEO */ htmlAttrs: { lang: 'en' },
      /**
       * Meta tags:
       * - charset: required encoding declaration
       * - viewport: responsive layout + safe-area handling
       * - description: short app description for search engines and previews
       * - robots: disallow indexing during development by default
       */
      meta: [
        { charset: 'utf-8' }, // document encoding
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }, // responsive viewport
        {
          name:    'description',
          content: 'Learn German with a playful AI tutor built for fast, focused conversation practice.' // SEO description
        },
        { name: 'robots', content: 'nofollow,noindex' } // prevent crawlers (default)
      ],
      /**
       * Link tags:
       * - favicon SVG for modern browsers
       * - favicon ICO fallback
       * - canonical to assert the primary URL for the site
       */
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg', sizes: 'any' }, // SVG favicon
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }, // ICO fallback
        { rel: 'canonical', href: 'https://meow.yanawa.io' } // canonical URL
      ]
    }
  },

  /**
   * Color mode default preferences for the UI library.
   *
   * Preference is set to dark to match the app's visual design by default.
   */
  colorMode: {
    preference: 'dark' // default to dark color mode
  },

  /**
   * Icon module configuration.
   *
   * serverBundle: 'local' ensures icon generation happens locally rather than remote.
   */
  icon: {
    serverBundle: 'local' // bundle icons locally on server builds
  },

  /**
   * Nitro server configuration for asset handling, minification and route rules.
   *
   * Provides caching and strict security headers on server responses.
   */
  nitro: {
    minify:               true, // enable Nitro minification for server output
    compressPublicAssets: true, // gzip/brotli public assets when possible
    /**
     * routeRules define per-path headers used by the server.
     *
     * - long cache for _nuxt assets (immutable)
     * - shorter cache for favicons with stale-while-revalidate
     * - security headers for all other routes
     */
    routeRules: {
      '/_nuxt/**':    {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable' // long lived cache for build assets
        }
      },
      '/favicon.svg': {
        headers: {
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' // weekly cache with revalidation window
        }
      },
      '/favicon.ico': {
        headers: {
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' // weekly cache with revalidation window
        }
      }
    }
  },

  /**
   * Vite configuration used during development and build.
   *
   * optimizeDeps.include lists modules to pre-bundle to avoid transformation issues.
   */
  vite: {
    server: {
      allowedHosts: [ 'analyze-sun-humanity-nail.trycloudflare.com', 'meow.yanawa.io', 'yanawa.io' ] // allow Cloudflare
      // Tunnel
      // host during
      // development
    },
    optimizeDeps: {
      include: [
        'marked', // markdown parser used by chat rendering
        'sanitize-html', // sanitization library for HTML output
        'highlight.js/lib/core', // syntax highlighting core to reduce bundle size
        'highlight.js/lib/languages/javascript',
        'highlight.js/lib/languages/typescript',
        'highlight.js/lib/languages/python',
        'highlight.js/lib/languages/bash',
        'highlight.js/lib/languages/json',
        'highlight.js/lib/languages/css',
        'highlight.js/lib/languages/xml',
        'highlight.js/lib/languages/sql',
        'highlight.js/lib/languages/markdown',
        'highlight.js/lib/languages/yaml',
        'highlight.js/lib/languages/go',
        'highlight.js/lib/languages/rust',
        'highlight.js/lib/languages/java',
        'highlight.js/lib/languages/php',
        'highlight.js/lib/languages/csharp'
      ]
    }
  }
})

import { join } from 'node:path'
