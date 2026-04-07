<!--
  - Copyright (C) 2026 Kolja Nolte
  - https://meow.yanawa.io
  - info@meow.yanawa.io
  -
  - This work is licensed under the MIT License. You are free to use, modify,
  - and distribute this work, provided that you include the copyright notice
  - and this permission notice in all copies or substantial portions of the work.
  - For more information, visit: https://opensource.org/licenses/MIT
  -
  - @author    Kolja Nolte
  - @email     kolja.nolte@gmail.com
  - @license   MIT
  - @date      2026
  - @website   https://meow.yanawa.io
  -->

<template>
  <div class="flex items-center justify-center min-h-screen bg-zinc-900 overflow-hidden relative">

    <!-- Background Accents: Decorative blurs for premium aesthetic -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Login Card: Floating container for the credentials form -->
    <div class="w-full max-w-sm mx-4 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 relative z-10 shadow-2xl shadow-primary-900/10">

      <!-- Card Header: Branding and Instructions -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 shadow-inner relative">
          <Icon class="w-10 h-10 text-primary-500" name="mdi:cat" />
          <Icon class="w-5 h-5 text-zinc-600 absolute -bottom-2 -right-1 rotate-12" name="mdi:paw" />
        </div>
        <h1 class="text-2xl font-bold text-zinc-100 tracking-tight">Meow 🐾</h1>
        <p class="text-sm text-zinc-500 mt-1">Please log in to continue learning</p>
      </div>

      <!-- Login Form: Local password-based authentication -->
      <form class="space-y-4" @submit.prevent="handleLogin">

        <!-- Identity Field -->
        <div>
          <label class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Your Name</label>
          <div class="relative">
            <Icon class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" name="lucide:user" />
            <input
                v-model="username" class="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-zinc-200 placeholder-zinc-500 outline-none focus:border-primary-500 transition-colors text-sm" placeholder="e.g. Kolja" required type="text" />
          </div>
        </div>

        <!-- Protection Field -->
        <div>
          <label class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Secret Password</label>
          <div class="relative">
            <Icon class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" name="lucide:key" />
            <input
                v-model="password" class="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-zinc-200 placeholder-zinc-500 outline-none focus:border-primary-500 transition-colors text-sm font-mono" placeholder="••••••••" required type="password" />
          </div>
        </div>

        <!-- Failure Feedback Area -->
        <div v-if="errorMsg" class="text-xs text-red-400 pt-1 text-center font-medium bg-red-950/30 p-2 rounded-lg border border-red-900/50">
          {{ errorMsg }}
        </div>

        <!-- Submission Trigger -->
        <button
            :disabled="loading" class="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-all mt-6 shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" type="submit">
          <Icon v-if="loading" class="w-4 h-4 animate-spin" name="lucide:loader-2" />
          <Icon v-else class="w-4 h-4" name="mdi:paw" />
          <span>{{ loading ? 'Unlocking...': 'Let me in!' }}</span>
        </button>
      </form>

    </div>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Simple authentication page for the Meow chat application.
   * Manages user credentials and interfaces with the backend login API.
   */

// Local reactive state for the login flow
  const username = ref('')
  const password = ref('')
  const loading  = ref(false)
  const errorMsg = ref('')

  /**
   * Dispatches a login request to the server-side auth handler.
   * Upon success, forces a hard redirect to the home page to re-initialize the app with new cookies.
   */
  async function handleLogin() {
    if (!username.value.trim() || !password.value.trim()) return

    loading.value  = true
    errorMsg.value = ''

    try {
      const res = await $fetch('/api/auth/login', {
        method: 'POST',
        body:   {
          username: username.value.trim(),
          password: password.value.trim()
        }
      })

      // Cookie is set server-side by the /api/auth/login endpoint
      // Using hard redirect to ensure all global state (useState) is purged and re-hydrated correctly
      window.location.href = '/'
    } catch (e: any) {
      // Surface user-friendly error messages from the API response
      errorMsg.value = e.data?.message || 'Login failed! Please check your password.'
    } finally {
      loading.value = false
    }
  }

  /** Set page metadata for SEO and browser tabs */
  useHead({
    title: 'Login - Meow 🐾'
  })
</script>
