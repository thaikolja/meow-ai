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
  <UApp>
    <CatLoadingState
        v-if="!authState.checked" full-screen subtitle="Meow is checking the cushions, polishing the cat flap, and waking up your session." title="Waking up the cat lounge..." />

    <AuthGate v-else-if="!authState.authenticated" />

    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>

    <ConfettiRain :burst-id="celebrationSequence" />
  </UApp>
</template>

<script lang="ts" setup>
  const { authState, verifySession } = useAuthSession()
  const { celebrationSequence }      = useCelebration()

  if (import.meta.server && !authState.value.checked) {
    await verifySession(true)
  }

  if (import.meta.client && !authState.value.checked) {
    void verifySession(true)
  }
</script>
