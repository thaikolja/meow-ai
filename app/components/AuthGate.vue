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
  <div class="relative min-h-screen overflow-hidden bg-zinc-900 px-4 py-8 text-zinc-100">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-40 left-0 h-96 w-96 rounded-full bg-primary-600/10 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"></div>
    </div>

    <div class="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center">
      <div class="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <section class="rounded-[2rem] border border-zinc-800/80 bg-zinc-950/60 p-8 shadow-2xl shadow-primary-900/10 backdrop-blur-xl sm:p-10">
          <div class="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-300">
            <Icon class="h-4 w-4" name="mdi:paw" />
            Cat Flap Access
          </div>

          <div class="mt-8 flex items-start gap-4">
            <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 shadow-inner">
              <Icon class="h-10 w-10 text-primary-400" name="mdi:cat" />
            </div>

            <div>
              <h1 class="text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">
                Meow 🐾
              </h1>
              <p class="mt-3 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                The cats moved the old login door. Whisper the house secret here and step straight into the learning lounge.
              </p>
            </div>
          </div>

          <div class="mt-8 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div class="mb-2 flex items-center gap-2 text-primary-300">
                <Icon class="h-4 w-4" name="lucide:shield-check" />
                <span class="text-sm font-semibold">Safer paw-print proof</span>
              </div>
              <p class="text-sm leading-relaxed text-zinc-400">
                The shared secret stays in the browser. The server sees only a one-time paw-print proof tied to a short-lived challenge.
              </p>
            </div>

            <div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div class="mb-2 flex items-center gap-2 text-blue-300">
                <Icon class="h-4 w-4" name="lucide:sparkles" />
                <span class="text-sm font-semibold">No more `/login` routine</span>
              </div>
              <p class="text-sm leading-relaxed text-zinc-400">
                Access now lives inside the app itself, so the experience feels like a cozy cat lounge instead of a generic sign-in page.
              </p>
            </div>
          </div>
        </section>

        <section class="rounded-[2rem] border border-zinc-800/80 bg-zinc-950/80 p-8 shadow-2xl shadow-primary-900/10 backdrop-blur-xl sm:p-9">
          <div class="mb-6 flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <Icon class="h-6 w-6 text-primary-400" name="mdi:paw" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-zinc-100">
                Open the cat flap
              </h2>
              <p class="text-sm text-zinc-500">
                Choose your cat name and whisper the shared house secret.
              </p>
            </div>
          </div>

          <form class="space-y-4" @submit.prevent="handleUnlock">
            <div>
              <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Cat Name</label>
              <div class="relative">
                <Icon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" name="lucide:user-round" />
                <input
                    v-model="username"
                    autocomplete="nickname"
                    class="w-full rounded-2xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-primary-500"
                    maxlength="32"
                    placeholder="e.g. Captain Whiskers"
                    required
                    type="text" />
              </div>
            </div>

            <div>
              <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">House Secret</label>
              <div class="relative">
                <Icon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" name="lucide:key-round" />
                <input
                    v-model="password"
                    autocomplete="current-password"
                    class="w-full rounded-2xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm font-mono text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-primary-500"
                    placeholder="••••••••"
                    required
                    type="password" />
              </div>
            </div>

            <div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-xs leading-relaxed text-zinc-500">
              <div class="flex items-center gap-2 text-zinc-300">
                <Icon class="h-4 w-4 text-primary-400" name="lucide:lock" />
                <span class="font-semibold">Fresh paw-print ready</span>
              </div>
              <p class="mt-1">
                {{ challengeStatus }}
              </p>
            </div>

            <div v-if="errorMsg" class="rounded-2xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {{ errorMsg }}
            </div>

            <button
                :disabled="loading || challengeLoading"
                class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit">
              <Icon v-if="loading || challengeLoading" class="h-4 w-4 animate-spin" name="lucide:loader-circle" />
              <Icon v-else class="h-4 w-4" name="mdi:paw" />
              <span>{{ loading ? 'Sniffing your paw-print...' : 'Open the cat flap' }}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { buildLoginProofMessage, normalizeAuthUsername } from '#shared/utils/authProof'

  type LoginChallengeResponse = {
    challengeId: string
    challenge: string
    expiresAt: number
  }

  const LAST_USERNAME_STORAGE_KEY = 'chat-yanawa-display-name'

  const route = useRoute()
  const { setAuthenticated } = useAuthSession()
  const { triggerCelebration } = useCelebration()

  const username         = ref('')
  const password         = ref('')
  const loading          = ref(false)
  const challengeLoading = ref(false)
  const errorMsg         = ref('')
  const challengeState   = reactive<LoginChallengeResponse>({
    challengeId: '',
    challenge:   '',
    expiresAt:   0
  })

  const challengeStatus = computed(() => {
    if (challengeLoading.value) {
      return 'Meow is drawing a fresh paw-print challenge for you...'
    }

    if (!challengeState.challengeId || !challengeState.challenge) {
      return 'No paw-print is ready yet. The button will wake a new one.'
    }

    return 'This one-time paw-print expires quickly and is tied to this browser session.'
  })

  async function loadChallenge() {
    challengeLoading.value = true

    try {
      const response = await $fetch<LoginChallengeResponse>('/api/auth/challenge')
      challengeState.challengeId = response.challengeId
      challengeState.challenge   = response.challenge
      challengeState.expiresAt   = response.expiresAt
    } catch (error: any) {
      challengeState.challengeId = ''
      challengeState.challenge   = ''
      challengeState.expiresAt   = 0
      errorMsg.value             = error?.data?.message || 'Meow could not fetch a fresh paw-print. Please try again.'
    } finally {
      challengeLoading.value = false
    }
  }

  function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = ''

    for (const value of bytes) {
      binary += String.fromCharCode(value)
    }

    return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
  }

  async function createProof(secret: string, challengeId: string, challenge: string, currentUsername: string): Promise<string> {
    if (!globalThis.crypto?.subtle) {
      throw new Error('This browser cannot create a secure paw-print proof.')
    }

    const encoder = new TextEncoder()
    const key     = await globalThis.crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        [ 'sign' ]
    )

    const signature = await globalThis.crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(buildLoginProofMessage(challengeId, challenge, currentUsername))
    )

    return bytesToBase64Url(new Uint8Array(signature))
  }

  async function handleUnlock() {
    const normalizedUsername = normalizeAuthUsername(username.value)
    if (!normalizedUsername || !password.value) {
      errorMsg.value = 'Please choose a cat name and enter the house secret.'
      return
    }

    if (!challengeState.challengeId || !challengeState.challenge) {
      await loadChallenge()
      if (!challengeState.challengeId || !challengeState.challenge) {
        return
      }
    }

    loading.value  = true
    errorMsg.value = ''

    try {
      const proof = await createProof(
          password.value,
          challengeState.challengeId,
          challengeState.challenge,
          normalizedUsername
      )

      const response = await $fetch<{ success: true; username: string }>('/api/auth/login', {
        method: 'POST',
        body:   {
          username: normalizedUsername,
          challengeId: challengeState.challengeId,
          proof
        }
      })

      if (import.meta.client) {
        localStorage.setItem(LAST_USERNAME_STORAGE_KEY, response.username)
      }

      password.value = ''
      triggerCelebration()
      setAuthenticated(response.username)

      if (route.path==='/login') {
        await navigateTo('/', { replace: true })
      }
    } catch (error: any) {
      password.value = ''
      errorMsg.value = error?.data?.message || error?.message || 'The cat flap stayed shut. Please try again.'
      await loadChallenge()
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    const savedUsername = localStorage.getItem(LAST_USERNAME_STORAGE_KEY)
    if (savedUsername) {
      username.value = normalizeAuthUsername(savedUsername)
    }

    void loadChallenge()
  })
</script>
