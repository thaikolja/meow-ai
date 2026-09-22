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

<script lang="ts" setup>
  useHead({
    title: 'Cat flap moved — Meow 🐾'
  })

  await navigateTo('/', { replace: true })
</script>

<template>
  <CatLoadingState
      full-screen label="Padding back home..." subtitle="The old login page retired. Meow is taking you to the new cat flap on the front page." title="The cat flap moved 🐾" />
</template>
