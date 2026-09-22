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
  <div :class="compact ? 'flex items-center gap-3 py-2 animate-in fade-in duration-500' : 'flex flex-col items-start gap-3 py-2 animate-in fade-in duration-500'">
    <div class="flex items-center gap-3">
      <!-- Pulsing Cat Head Icon -->
      <div class="relative flex items-center justify-center">
        <!-- Visual ping to acknowledge background processing -->
        <div class="absolute inset-0 bg-primary-500/20 rounded-full animate-ping opacity-20"></div>
        <Icon class="w-6 h-6 text-primary-400 relative z-10 animate-pulse" name="mdi:cat" />
      </div>

      <!-- Thinking Dots with Cat Tails -->
      <div class="flex items-end gap-1.5 h-6">
        <!-- Generates 3 vertical bars representing processing tails -->
        <div
            v-for="i in 3" :key="i" class="w-1.5 h-4 bg-zinc-700/50 rounded-full relative overflow-hidden">
          <!-- Internal animation bar with staggered delays for fluid motion -->
          <div
              :style="{
              height: '60%',
              animationDelay: `${(i-1) * 200}ms`,
              animationDuration: '1s'
            }" class="absolute bottom-0 left-0 w-full bg-primary-500/40 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>

    <!-- Pulse label for personality/feedback -->
    <p v-if="!compact" class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 italic animate-pulse">
      {{ loadingLine }}
    </p>
    <p v-else class="text-sm font-medium text-zinc-400 animate-pulse">
      {{ loadingLine }}
    </p>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Visual loading/streaming indicator (mascot).
   * Provides the user with responsive feedback while waiting for an AI response.
   * Uses a combination of pinging circles, bouncing 'tails', and pulsing labels.
   */

  const props = withDefaults(defineProps<{
    compact?: boolean
    label?: string
  }>(), {
    compact: false
  })

  const loadingLines = [
    'Meow is drafting a reply... 🐾',
    'Meow is chasing the right words... 🐾',
    'Meow is untangling the yarn... 🐾',
    'Meow is pawing through the chat... 🐾',
    'Meow is warming up the whiskers... 🐾',
    'Meow is batting around a bright idea... 🐾',
    'Meow is lining up the next pounce... 🐾'
  ]

  function pickLoadingLine() {
    return loadingLines[Math.floor(Math.random() * loadingLines.length)] || 'Meow is drafting a reply... 🐾'
  }

  const randomLoadingLine = ref(pickLoadingLine())
  const loadingLine = computed(() => props.label?.trim() || randomLoadingLine.value)
</script>

<style scoped>
  /**
   * Custom animation definitions for softer UI interactions.
   */
  @keyframes pulse-soft {
    0%, 100% {
      opacity:   0.4;
      transform: scale(0.98);
    }
    50% {
      opacity:   0.8;
      transform: scale(1.02);
    }
  }
</style>
