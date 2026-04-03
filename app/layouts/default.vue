<template>
  <div class="flex h-dvh bg-zinc-900 text-zinc-100">
    <!-- Mobile sidebar overlay -->
    <Transition name="sidebar">
      <div
        v-if="sidebarOpen && isMobile"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <Transition name="sidebar">
      <aside
        v-show="sidebarOpen"
        :class="[
          'flex flex-col w-[280px] bg-[#141416] shrink-0 z-50',
          isMobile ? 'fixed inset-y-0 left-0 shadow-2xl' : 'relative'
        ]"
      >
        <!-- Sidebar Header -->
        <div class="flex flex-col gap-2 p-3 border-b border-zinc-800/80">
          <div class="flex items-center justify-between">
            <button
              id="btn-new-chat-sidebar"
              class="flex items-center gap-2 px-3 py-2 w-full rounded-lg hover:bg-zinc-800 transition-colors text-zinc-200"
              @click="handleNewChat"
            >
              <Icon name="lucide:plus" class="w-5 h-5" />
              <span class="text-sm font-medium">New Chat</span>
            </button>
            <button
              class="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
              @click="sidebarOpen = false"
            >
              <Icon name="lucide:panel-left-close" class="w-5 h-5" />
            </button>
          </div>
          <!-- Search input -->
          <div class="relative">
            <Icon name="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search chats..."
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-primary-500 transition-colors text-zinc-200 placeholder-zinc-500"
            />
          </div>
        </div>

        <!-- Chat List -->
        <nav class="flex-1 overflow-y-auto p-2 space-y-0.5">
          <ClientOnly>
            <div v-if="filteredChats.length === 0" class="px-3 py-8 text-center text-zinc-500 text-sm">
              <span v-if="searchQuery">No matching chats</span>
              <span v-else>No conversations yet</span>
            </div>
            <ChatListItem
              v-for="chat in filteredChats"
              :key="chat.id"
              :chat="chat"
              :active="String(route.params.id || '') === chat.id"
              @select="navigateToChat(chat.id)"
              @delete="handleDeleteChat(chat.id)"
              @rename="handleRenameChat"
            />
          </ClientOnly>
        </nav>

        <!-- Sidebar Footer -->
        <div class="p-3 border-t border-zinc-800/80 space-y-1">
          <button
            id="btn-settings"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300 text-sm"
            @click="settingsOpen = true"
          >
            <Icon name="lucide:settings" class="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 bg-zinc-900 border-l border-zinc-800/50">
      <!-- Top Bar -->
      <header class="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-md">
        <button
          v-if="!sidebarOpen"
          class="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
          @click="sidebarOpen = true"
        >
          <Icon name="lucide:panel-left-open" class="w-5 h-5" />
        </button>

        <ClientOnly>
          <ModelSelector class="flex-shrink-0" />
        </ClientOnly>

        <div class="flex-1" />

        <span class="text-xs text-zinc-500 font-medium hidden sm:flex items-center gap-2">
          <Icon name="lucide:brain-circuit" class="w-4 h-4 text-blue-500" />
          Einstein (einstein.yanawa.io)
        </span>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-hidden">
        <slot />
      </div>
    </main>

    <!-- Settings Modal -->
    <ClientOnly>
      <SettingsModal v-model:open="settingsOpen" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const colorMode = useColorMode()
const { sortedChats, createChat, deleteChat, renameChat } = useChats()

const sidebarOpen = useState('sidebar-open', () => true)
const settingsOpen = useState('settings-open', () => false)
const isMobile = ref(false)
const searchQuery = ref('')

const filteredChats = computed(() => {
  if (!searchQuery.value) return sortedChats.value
  const q = searchQuery.value.toLowerCase()
  return sortedChats.value.filter(c => 
    c.title.toLowerCase().includes(q) || 
    c.messages.some(m => m.content.toLowerCase().includes(q))
  )
})

const isDark = computed(() => true)

function checkMobile() {
  if (import.meta.client) {
    isMobile.value = window.innerWidth < 768
    if (isMobile.value) sidebarOpen.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', checkMobile)
  }
})

function handleNewChat() {
  const chat = createChat()
  router.push(`/chat/${chat.id}`)
  if (isMobile.value) sidebarOpen.value = false
}

function navigateToChat(id: string) {
  router.push(`/chat/${id}`)
  if (isMobile.value) sidebarOpen.value = false
}

function handleDeleteChat(id: string) {
  deleteChat(id)
  if (String(route.params.id || '') === id) {
    router.push('/')
  }
}

function handleRenameChat({ id, title }: { id: string; title: string }) {
  renameChat(id, title)
}
</script>
