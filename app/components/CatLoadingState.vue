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
  <div :class="[fullScreen ? 'min-h-screen' : 'min-h-full py-10', 'relative flex items-center justify-center overflow-hidden px-4']">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary-600/10 blur-3xl"></div>
      <div class="absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl"></div>
    </div>

    <div class="relative z-10 w-full max-w-md rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-8 text-center shadow-2xl shadow-primary-900/10 backdrop-blur-xl">
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 shadow-inner">
        <Icon class="h-11 w-11 animate-pulse text-primary-400" name="mdi:cat" />
      </div>

      <h2 class="text-2xl font-bold tracking-tight text-zinc-100">
        {{ title }}
      </h2>

      <p class="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
        {{ subtitle }}
      </p>

      <div class="mt-6 flex justify-center">
        <ThinkingCat compact :label="label" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  withDefaults(defineProps<{
    title?: string
    subtitle?: string
    label?: string
    fullScreen?: boolean
  }>(), {
    title:      'Warming up the whiskers...',
    subtitle:   'Meow is fluffing the cushions and checking your session.',
    label:      'Stretching whiskers...',
    fullScreen: false
  })
</script>
