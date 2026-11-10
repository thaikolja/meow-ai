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
 * Root shell for Meow. Verifies the session, keeps the layout and page mounted, and covers them with a loading splash or the cat-flap gate until the visitor is signed in. Confetti mounts only after a successful login.
 */

import { shouldShowConfetti } from '#shared/utils/celebration'

const { authState, verifySession } = useAuthSession()
useAccountSync()
const accountSyncedFor        = useState<string | null>('account-synced-for', () => null)
const { celebrationSequence } = useCelebration()
/** True once this username's settings and chats have replaced the empty in-memory copies. */
const appReady                = computed(() => {
  const username = authState.value.username
  return authState.value.checked
      && authState.value.authenticated
      && Boolean(username)
      && accountSyncedFor.value === username
})
/** True only after `triggerCelebration()` has run. Failed login does not raise the sequence. */
const showConfetti            = computed(() => shouldShowConfetti(celebrationSequence.value))

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

    <Transition name="nest-gate">
      <div
          v-if="!appReady"
          class="nest-gate fixed inset-0 z-100 bg-zinc-900"
      >
        <CatLoadingState
            v-if="!authState.checked || authState.authenticated"
            full-screen
            :subtitle="authState.authenticated
              ? 'Meow is carrying your nest over from the other cushion.'
              : 'Meow is checking the cushions, polishing the cat flap, and waking up your session.'"
            :title="authState.authenticated ? 'Opening your nest...' : 'Waking up the cat lounge...'"
        />

        <AuthGate v-else />
      </div>
    </Transition>

    <ConfettiRain
        v-if="showConfetti"
        :burst-id="celebrationSequence"
    />
  </UApp>
</template>

<style>
.nest-gate,
.nest-gate-enter-active {
  animation: nest-gate-in 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.nest-gate .nest-card,
.nest-gate-enter-active .nest-card {
  animation: nest-card-in 680ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.nest-gate-leave-active {
  animation: nest-gate-out 520ms ease both;
}

.nest-gate-leave-active .nest-card {
  animation: nest-card-out 420ms ease both;
}

@keyframes nest-gate-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes nest-gate-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes nest-card-in {
  from {
    opacity:   0;
    transform: translateY(18px) scale(0.97);
  }
  to {
    opacity:   1;
    transform: none;
  }
}

@keyframes nest-card-out {
  from {
    opacity:   1;
    transform: none;
  }
  to {
    opacity:   0;
    transform: translateY(10px) scale(0.98);
  }
}
</style>
