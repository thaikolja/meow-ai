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
        class="fixed inset-0 z-[100] bg-zinc-900"
    >
      <CatLoadingState
          v-if="!authState.checked"
          full-screen
          subtitle="Meow is checking the cushions, polishing the cat flap, and waking up your session."
          title="Waking up the cat lounge..."
      />

      <AuthGate v-else />
    </div>

    <ConfettiRain :burst-id="celebrationSequence" />
  </UApp>
</template>

<script lang="ts" setup>
  const { authState, verifySession } = useAuthSession()
  const { celebrationSequence }      = useCelebration()
  const appReady = computed(() => authState.value.checked && authState.value.authenticated)

  if (import.meta.server && !authState.value.checked) {
    await verifySession(true)
  }

  if (import.meta.client && !authState.value.checked) {
    void verifySession(true)
  }
</script>
