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
  <button
      :class="[
      'group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-150 text-sm',
      active
        ? 'bg-neutral-800 text-neutral-100'
        : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
    ]" @click="$emit('select')">
    <Icon class="w-4 h-4 shrink-0 opacity-60" name="lucide:message-square" />
    <span v-if="!isRenaming" class="truncate flex-1 text-left">{{ chat.title }}</span>

    <!-- Rename input (visible only when editing title) -->
    <input
        v-if="isRenaming" ref="renameInput" v-model="renameValue" class="flex-1 bg-neutral-700 text-neutral-100 rounded px-2 py-0.5 text-sm outline-none ring-1 ring-primary-500" @blur="submitRename" @keydown.enter="submitRename" @keydown.escape="cancelRename" @click.stop />

    <!-- Quick Actions (Rename and Delete) -->
    <div
        :class="[
        'flex items-center gap-0.5 shrink-0 transition-opacity',
        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      ]">
      <button
          v-if="!isRenaming" class="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors" title="Rename" @click.stop="startRename">
        <Icon class="w-3.5 h-3.5" name="lucide:pencil" />
      </button>
      <button
          v-if="!isRenaming" class="p-1 rounded hover:bg-red-900/50 text-neutral-500 hover:text-red-400 transition-colors" title="Delete" @click.stop="$emit('delete')">
        <Icon class="w-3.5 h-3.5" name="lucide:trash-2" />
      </button>
    </div>
  </button>
</template>

<script lang="ts" setup>
  /**
   * Represeents a single chat entry in the sidebar navigation list.
   * Supports renaming and deletion via context-aware buttons.
   */

  import type { Chat } from '~/types'

  const props = defineProps<{
    /** Information about the chat being displayed */
    chat: Chat
    /** Whether the chat is currently the active view in the application */
    active: boolean
  }>()

  const emit = defineEmits<{
    /** Selection handler triggered when the item is clicked */
    select: []
    /** Deletion event triggered on user confirmation via button click */
    delete: []
    /** Rename event containing the target chat ID and new title string */
    rename: [ { id: string; title: string } ]
  }>()

  // UI state for inline renaming
  const isRenaming  = ref(false)
  const renameValue = ref('')
  const renameInput = ref<HTMLInputElement>()

  /**
   * Enters the renaming state and sets initial focus to the input field.
   * Selects the entire title text for quick replacement.
   */
  function startRename() {
    renameValue.value = props.chat.title
    isRenaming.value  = true
    nextTick(() => {
      renameInput.value?.focus()
      renameInput.value?.select()
    })
  }

  /**
   * Submits the new title back to the application store via emit.
   * Automatically exits the renaming state.
   */
  function submitRename() {
    if (renameValue.value.trim() && renameValue.value!==props.chat.title) {
      emit('rename', { id: props.chat.id, title: renameValue.value.trim() })
    }
    isRenaming.value = false
  }

  /** Cancels the ongoing rename operation without saving changes */
  function cancelRename() {
    isRenaming.value = false
  }
</script>
