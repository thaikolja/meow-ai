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
  <div v-if="visible" class="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
    <span
        v-for="piece in pieces" :key="piece.id" :style="{
          left: `${piece.left}%`,
          width: `${piece.width}px`,
          height: `${piece.height}px`,
          backgroundColor: piece.color,
          borderRadius: `${piece.radius}px`,
          animationDelay: `${piece.delay}ms`,
          animationDuration: `${piece.duration}ms`,
          '--drift': `${piece.drift}px`,
          '--spin': `${piece.spin}deg`
        }" class="confetti-piece absolute top-[-12vh] block opacity-0" />
  </div>
</template>

<script lang="ts" setup>
  type Piece = {
    id: number
    left: number
    width: number
    height: number
    color: string
    delay: number
    duration: number
    drift: number
    spin: number
    radius: number
  }

  const props = defineProps<{
    burstId: number
  }>()

  const colors  = [ '#fb7185', '#f97316', '#facc15', '#34d399', '#38bdf8', '#a78bfa' ]
  const pieces  = ref<Piece[]>([])
  const visible = ref(false)

  let hideTimer: ReturnType<typeof setTimeout> | undefined

  function buildPieces(burstId: number): Piece[] {
    return Array.from({ length: 64 }, (_, index) => ({
      id:       burstId * 1000 + index,
      left:     Math.random() * 100,
      width:    6 + Math.round(Math.random() * 6),
      height:   10 + Math.round(Math.random() * 10),
      color:    colors[Math.floor(Math.random() * colors.length)] || '#fb7185',
      delay:    Math.round(Math.random() * 350),
      duration: 1600 + Math.round(Math.random() * 1200),
      drift:    -160 + Math.round(Math.random() * 320),
      spin:     -720 + Math.round(Math.random() * 1440),
      radius:   1 + Math.round(Math.random() * 3)
    }))
  }

  watch(() => props.burstId, (burstId) => {
    if (!import.meta.client || burstId <= 0) {
      return
    }

    pieces.value  = buildPieces(burstId)
    visible.value = true

    if (hideTimer) {
      clearTimeout(hideTimer)
    }

    hideTimer = setTimeout(() => {
      visible.value = false
    }, 2800)
  })

  onUnmounted(() => {
    if (hideTimer) {
      clearTimeout(hideTimer)
    }
  })
</script>

<style scoped>
  .confetti-piece {
    animation-name:            confetti-fall;
    animation-timing-function: linear;
    animation-iteration-count: 1;
    box-shadow:                0 0 12px rgb(255 255 255 / 0.18);
    animation-fill-mode:       forwards;
  }

  @keyframes confetti-fall {
    0% {
      opacity:   0;
      transform: translate3d(0, -12vh, 0) rotate(0deg) scale(0.85);
    }
    10% {
      opacity: 1;
    }
    100% {
      opacity:   1;
      transform: translate3d(var(--drift), 115vh, 0) rotate(var(--spin)) scale(1);
    }
  }
</style>
