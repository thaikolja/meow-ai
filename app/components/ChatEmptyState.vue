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
  <div class="flex min-h-[18rem] items-center justify-center px-2 py-6">
    <div class="w-full max-w-2xl rounded-[2rem] border border-zinc-800/80 bg-zinc-950/60 p-6 text-center shadow-2xl shadow-primary-900/10 backdrop-blur-xl sm:p-8">
      <div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 shadow-inner">
        <Icon class="h-11 w-11 text-primary-400" name="mdi:cat" />
      </div>

      <h2 class="text-2xl font-bold tracking-tight text-zinc-100">
        Fresh litter box, fresh lesson 🐾
      </h2>

      <p class="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        Start with a gentle warm-up, tap one of the ready-made prompts, or type your own meow below. A brand-new chat
        deserves a cozy first purr.
      </p>

      <div class="mt-6 grid gap-3 text-left sm:grid-cols-3">
        <button
            v-for="starter in starters" :key="starter.title" class="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 transition-colors hover:border-primary-500/40 hover:bg-zinc-900" type="button" @click="$emit('quick-prompt', starter.prompt)">
          <div class="mb-2 flex items-center gap-2 text-primary-300">
            <Icon :name="starter.icon" class="h-4 w-4 transition-transform group-hover:scale-110" />
            <span class="text-sm font-semibold">{{ starter.title }}</span>
          </div>
          <p class="text-xs leading-relaxed text-zinc-500">
            {{ starter.description }}
          </p>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineEmits<{
    'quick-prompt': [ prompt: string ]
  }>()

  const starters = [
    {
      title:       'Soft hello',
      description: 'Learn an easy first introduction in German with pronunciation tips.',
      icon:        'lucide:hand',
      prompt:      'Teach me a warm, natural way to introduce myself in German. Please explain the pronunciation too.'
    },
    {
      title:       'Cafe practice',
      description: 'Warm up with a playful Berlin cafe roleplay for beginners.',
      icon:        'lucide:coffee',
      prompt:      'Let us do a short German cafe roleplay. Keep it beginner-friendly and correct me gently.'
    },
    {
      title:       'Grammar snack',
      description: 'Get a compact explainer for der, die, and das with simple examples.',
      icon:        'lucide:book-open',
      prompt:      'Explain der, die, and das in a very simple way for a Thai speaker, with a few short examples.'
    }
  ]
</script>
