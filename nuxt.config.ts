export default defineNuxtConfig({
  compatibilityDate: '2026-04-04',

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/icon'
  ],

  css: [
    '~/assets/css/main.css',
    '~/assets/css/markdown.css'
  ],

  app: {
    head: {
      title: 'chat.yanawa.io',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI Chat Interface for Remote LLMs — Connect your own API endpoints and models' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  colorMode: {
    preference: 'dark'
  },

  icon: {
    serverBundle: 'local'
  }
})
