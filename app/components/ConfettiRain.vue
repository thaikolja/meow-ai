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
  <div
      v-if="visible"
      ref="layer"
      :class="contained
          ? 'confetti-contained'
          : 'fixed inset-0 z-[120]'"
      class="pointer-events-none overflow-hidden"
  >
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
  /**
   * Full-screen confetti shown after a successful unlock. Each new burst id rebuilds the pieces and lets them fall once.
   */

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

  const props = withDefaults(defineProps<{
    burstId: number
    /** Covers the settings dialog only. Stays out of the footer layout. */
    contained?: boolean
  }>(), {
    contained: false
  })

  const colors  = [ '#fb7185', '#f97316', '#facc15', '#34d399', '#38bdf8', '#a78bfa' ]
  const pieces  = ref<Piece[]>([])
  const visible = ref(false)
  const layer = ref<HTMLElement | null>(null)

  let hideTimer: ReturnType<typeof setTimeout> | undefined

  /** Builds the randomized pieces for one celebration burst. */
  function buildPieces(burstId: number): Piece[] {
    return Array.from({ length: 64 }, (_, index) => ({
      id:       burstId * 1000 + index,
      left:     Math.random() * 100,
      width:    6 + Math.round(Math.random() * 6),
      height:   10 + Math.round(Math.random() * 10),
      color:    colors[Math.floor(Math.random() * colors.length)] || '#fb7185',
      delay:    Math.round(Math.random() * 350),
      duration: 1600 + Math.round(Math.random() * 1200),
      drift: props.contained
                 ? -36 + Math.round(Math.random() * 72)
                 : -160 + Math.round(Math.random() * 320),
      spin:     -720 + Math.round(Math.random() * 1440),
      radius:   1 + Math.round(Math.random() * 3)
    }))
  }

  /**
   * Plays one burst on the client. A mount that already has a positive id
   * (the shell uses `v-if` after login) starts from `onMounted`. A later id
   * starts from the watcher.
   */
  function playBurst(burstId: number) {
    if (!import.meta.client || burstId <= 0) {
      return
    }

    visible.value = true
    void nextTick(() => {
      const height = layer.value?.clientHeight || 0
      if (height > 0) layer.value?.style.setProperty('--fall', `${height}px`)
      pieces.value = buildPieces(burstId)
    })

    if (hideTimer) {
      clearTimeout(hideTimer)
    }

    hideTimer = setTimeout(() => {
      visible.value = false
    }, 2800)
  }

  watch(() => props.burstId, playBurst)

  onMounted(() => {
    playBurst(props.burstId)
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

  /*
   * The dialog is position:fixed and translated to center, so this fixed layer
   * is pinned to the dialog. Paint containment clips the pieces. Transforms
   * do the falling, so the footer padding never changes.
   */
  .confetti-contained {
    position:       fixed;
    inset:          0;
    z-index:        30;
    margin:         0;
    overflow:       hidden;
    contain:        paint;
    container-type: size;
    pointer-events: none;
  }

  .confetti-contained .confetti-piece {
    top:            0;
    animation-name: confetti-fall-contained;
  }

  @keyframes confetti-fall-contained {
    0% {
      opacity:   0;
      transform: translate3d(0, -24px, 0) rotate(0deg) scale(0.85);
    }
    12% {
      opacity: 1;
    }
    100% {
      opacity:   1;
      transform: translate3d(var(--drift), calc(var(--fall, 100cqh) - 100%), 0) rotate(var(--spin)) scale(1);
    }
  }
</style>
