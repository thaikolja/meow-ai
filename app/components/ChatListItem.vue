<template>
  <button
    :class="[
      'group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-150 text-sm',
      active
        ? 'bg-neutral-800 text-neutral-100'
        : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
    ]"
    @click="$emit('select')"
  >
    <Icon name="lucide:message-square" class="w-4 h-4 shrink-0 opacity-60" />
    <span v-if="!isRenaming" class="truncate flex-1 text-left">{{ chat.title }}</span>

    <!-- Rename input -->
    <input
      v-if="isRenaming"
      ref="renameInput"
      v-model="renameValue"
      class="flex-1 bg-neutral-700 text-neutral-100 rounded px-2 py-0.5 text-sm outline-none ring-1 ring-primary-500"
      @keydown.enter="submitRename"
      @keydown.escape="cancelRename"
      @blur="submitRename"
      @click.stop
    />

    <!-- Actions -->
    <div
      :class="[
        'flex items-center gap-0.5 shrink-0 transition-opacity',
        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      ]"
    >
      <button
        v-if="!isRenaming"
        class="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors"
        title="Rename"
        @click.stop="startRename"
      >
        <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
      </button>
      <button
        v-if="!isRenaming"
        class="p-1 rounded hover:bg-red-900/50 text-neutral-500 hover:text-red-400 transition-colors"
        title="Delete"
        @click.stop="$emit('delete')"
      >
        <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
      </button>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { Chat } from '~/types'

const props = defineProps<{
  chat: Chat
  active: boolean
}>()

const emit = defineEmits<{
  select: []
  delete: []
  rename: [{ id: string; title: string }]
}>()

const isRenaming = ref(false)
const renameValue = ref('')
const renameInput = ref<HTMLInputElement>()

function startRename() {
  renameValue.value = props.chat.title
  isRenaming.value = true
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

function submitRename() {
  if (renameValue.value.trim() && renameValue.value !== props.chat.title) {
    emit('rename', { id: props.chat.id, title: renameValue.value.trim() })
  }
  isRenaming.value = false
}

function cancelRename() {
  isRenaming.value = false
}
</script>
