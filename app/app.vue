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
  - @license   MIT
  - @date      2026
  - @website   https://meow.yanawa.io
  -->

<script
    setup
    lang="ts"
>
/**
 * Root shell for Meow. Verifies the session, keeps the layout and page mounted, and covers them with a loading splash or the cat-flap gate until the visitor is signed in. Celebration confetti renders above that shell.
 */

const { authState, verifySession } = useAuthSession()
const { celebrationSequence }      = useCelebration()
const { confetti }                 = useMeo()
/** True once the session has been checked and the visitor is authenticated. */
const appReady                     = computed(() => authState.value.checked && authState.value.authenticated)

if (import.meta.server && !authState.value.checked) {
  await verifySession(true)
}

if (import.meta.client && !authState.value.checked) {
  void verifySession(true)
}

</script>

<template>
  <UApp>
    <div
        v-show="appReady"
        class="contents"
    >
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>

    <div
        v-if="!appReady"
        class="fixed inset-0 z-100 bg-zinc-900"
    >
      <CatLoadingState
          v-if="!authState.checked"
          full-screen
          subtitle="Meow is checking the cushions, polishing the cat flap, and waking up your session."
          title="Waking up the cat lounge..."
      />

      <AuthGate v-else />
    </div>

    <span class="sr-only">{{ confetti }}</span>
    <ConfettiRain
        v-if="confetti === 'yes'"
        :burst-id="celebrationSequence"
    />
  </UApp>
</template>
