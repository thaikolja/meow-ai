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
  <div class="app-shell flex max-w-full bg-zinc-900 text-zinc-100 overflow-hidden">
    <!-- Mobile sidebar overlay -->
    <Transition name="sidebar">
      <div
          v-if="sidebarOpen && isMobile" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" @click="sidebarOpen = false" />
    </Transition>

    <!-- Sidebar -->
    <Transition name="sidebar">
      <aside
          v-show="sidebarOpen" :class="[
          'flex flex-col w-[min(85vw,280px)] md:w-[280px] bg-[#141416] shrink-0 z-50 max-w-full',
          isMobile ? 'fixed inset-y-0 left-0 shadow-2xl' : 'relative'
        ]">
        <!-- Sidebar Branding -->
        <NuxtLink class="px-6 py-8 flex flex-col items-center justify-center opacity-30 hover:opacity-100 transition-opacity cursor-pointer group" to="/">
          <div class="flex gap-2 group-hover:scale-110 transition-transform duration-500">
            <Icon class="w-10 h-10" name="mdi:cat" />
            <Icon class="w-6 h-6 mt-4 -ml-2 rotate-12" name="mdi:paw" />
          </div>
          <p class="text-[10px] uppercase tracking-[0.2em] font-bold mt-2">Meow 🐾</p>
        </NuxtLink>

        <!-- Sidebar Header -->
        <div class="flex flex-col gap-2 p-3 border-b border-zinc-800/80">
          <div class="flex items-center justify-between">
            <button
                id="btn-new-chat-sidebar" class="flex items-center gap-2 px-3 py-2 w-full rounded-lg hover:bg-zinc-800 transition-colors text-zinc-200" @click="handleNewChat">
              <Icon class="w-5 h-5" name="lucide:plus" />
              <span class="text-sm font-medium">New Meow 🐾</span>
            </button>
            <button
                class="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400" @click="sidebarOpen = false">
              <Icon class="w-5 h-5" name="lucide:panel-left-close" />
            </button>
          </div>
          <!-- Search input -->
          <div class="relative">
            <Icon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" name="lucide:search" />
            <input
                v-model="searchQuery" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-base sm:text-sm outline-none focus:border-primary-500 transition-colors text-zinc-200 placeholder-zinc-500" placeholder="Sniff out meows... 🐾" type="text" />
          </div>
        </div>

        <!-- Chat List (Authenticated only) -->
        <nav v-if="displayName" class="flex-1 overflow-y-auto p-2 space-y-0.5">
          <ClientOnly>
            <div v-if="filteredChats.length === 0" class="px-3 py-8 text-center text-zinc-500 text-sm">
              <span v-if="searchQuery">No matching meows 🐾</span> <span v-else>No purrs recorded yet 🐾</span>
            </div>
            <ChatListItem
                v-for="chat in filteredChats"
                :key="chat.id"
                :active="isOpenChat(chat)"
                :chat="chat"
                @delete="handleDeleteChat(chat.id)"
                @rename="handleRenameChat"
                @select="navigateToChat(chat.slug || chat.id)"
            />
          </ClientOnly>
        </nav>

        <!-- Cute Login Placeholder (Unauthenticated only) -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Icon class="w-16 h-16 text-zinc-700 opacity-20" name="mdi:cat" />
          <p class="text-zinc-600 text-sm font-medium leading-relaxed italic">
            Meow! Unlock the cat flap to see your chat history 🐾
          </p>
        </div>

        <!-- Sidebar Footer -->
        <div v-if="displayName" class="p-3 border-t border-zinc-800/80 space-y-1">
          <button
              id="btn-settings" class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300 text-sm" @click="settingsOpen = true">
            <Icon class="w-4 h-4 text-primary-400" name="mdi:paw" />
            <span>Paw-ferences 🐾</span>
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Main Content -->
    <main class="flex-1 flex max-w-full min-w-0 flex-col bg-zinc-900 border-l border-zinc-800/50 relative overflow-hidden">
      <!-- Background Accents -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl text-balance"></div>
      </div>

      <!-- Top Bar -->
      <header class="relative z-40 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-md">
        <button
            v-if="!sidebarOpen" class="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400" @click="sidebarOpen = true">
          <Icon class="w-5 h-5" name="lucide:panel-left-open" />
        </button>

        <ClientOnly>
          <ModelSelector v-if="displayName" class="min-w-0 shrink max-w-full" />
        </ClientOnly>

        <div class="flex-1" />

        <div class="flex items-center gap-2 sm:gap-4 text-xs text-zinc-500 font-medium">
          <div class="hidden sm:flex items-center gap-2">
            <Icon class="w-4 h-4 text-primary-500" name="mdi:cat" />
            Meow 🐾
          </div>
          <!-- Repository links: GitLab and GitHub (open in new tab) -->
          <div class="hidden sm:flex items-center gap-8 ms-3">
            <a aria-label="View on GitLab" class="text-zinc-400 hover:text-zinc-200 transition-colors" href="https://gitlab.com/thaikolja/meow-ai" rel="noopener noreferrer" target="_blank">
              <Icon class="w-4 h-4" name="mdi:gitlab" />
            </a>
            <a aria-label="View on GitHub" class="text-zinc-400 hover:text-zinc-200 transition-colors" href="https://github.com/thaikolja/meow-ai" rel="noopener noreferrer" target="_blank">
              <Icon class="w-4 h-4" name="mdi:github" />
            </a>
          </div>
          <div v-if="displayName" class="hidden sm:block h-4 w-px bg-zinc-800" />
          <div v-if="displayName" class="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-zinc-400">
            <Icon class="w-3.5 h-3.5 text-primary-400" name="lucide:user" />
            <span class="max-w-28 truncate">{{ displayName }}</span>
            <button
                :disabled="logoutPending" class="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/70 bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-primary-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60" title="Log out" @click="handleLogout">
              <Icon :class="['w-3.5 h-3.5', logoutPending && 'animate-spin']" :name="logoutPending ? 'lucide:loader-circle' : 'lucide:log-out'" />
              <span class="hidden sm:inline">{{ logoutPending ? 'Padding out...': 'Paws out' }}</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="relative z-10 flex-1 min-w-0 overflow-hidden">
        <slot />
      </div>
    </main>

    <!-- Settings Modal -->
    <ClientOnly>
      <SettingsModal v-model:open="settingsOpen" />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Global layout for the Yanawa Chat app.
   * Provides the sidebar navigation, model selection, and main content area.
   * Handles mobile responsiveness and global UI states (sidebar/settings).
   */

  const route                                               = useRoute()
  const router                                              = useRouter()
  const { assignChatSlug }                                           = useChatSlug()
  // Access custom chat logic for management
  const { sortedChats, createChat, deleteChat, renameChat, getChat } = useChats()
  const { authState, logout }                               = useAuthSession()
  const defaultProvider                                     = useDefaultProvider()
  const defaultModel                                        = useDefaultModel()
  const { selectedModel: savedDefault } = useSettings()

  // Global application states
  const sidebarOpen      = useState('sidebar-open', () => true)
  const settingsOpen     = useState('settings-open', () => false)
  const isMobile         = ref(false)
  const searchQuery      = ref('')
  const usernameCookie   = useCookie('chat_username')
  const selectedProvider = useState<string>('selected-provider', () => defaultProvider.value)
  const logoutPending    = ref(false)

  const displayName = computed(() => authState.value.username || usernameCookie.value || '')

  /**
   * Filtered list of chats based on search query.
   * Matches title or message content within any chat.
   */
  const filteredChats = computed(() => {
    if (!searchQuery.value) return sortedChats.value
    const q = searchQuery.value.toLowerCase()
    return sortedChats.value.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some(m => m.content.toLowerCase().includes(q))
    )
  })

  /**
   * Checks for mobile screen size and updates layout state.
   * Prevents overlapping UI elements on small screens.
   */
  function checkMobile() {
    if (import.meta.client) {
      isMobile.value = window.innerWidth < 768
      if (isMobile.value) sidebarOpen.value = false
    }
  }

  function updateViewportHeight() {
    if (import.meta.server) {
      return
    }

    const viewportHeight = window.visualViewport?.height || window.innerHeight
    document.documentElement.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`)
  }

  // Lifecycle hooks for handling screen resizing and responsiveness
  onMounted(() => {
    checkMobile()
    updateViewportHeight()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('resize', updateViewportHeight)
    window.visualViewport?.addEventListener('resize', updateViewportHeight)
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('resize', updateViewportHeight)
      window.visualViewport?.removeEventListener('resize', updateViewportHeight)
    }
  })

  /**
   * Initializes a new chat session and redirects the user.
   * Automatically closes the sidebar on mobile to focus on the new chat.
   */
  function isOpenChat(chat: { id: string; slug?: string }) {
    const key = String(route.params.id || '')
    return key === chat.id || key === chat.slug
  }

  function handleNewChat() {
    const chat = createChat(selectedProvider.value, savedDefault.value || defaultModel.value)
    assignChatSlug(chat.id)
    router.push(`/chat/${chat.id}`)
    if (isMobile.value) sidebarOpen.value = false
  }

  /**
   * Navigation helper for chat history items.
   * Handles mobile UI behavior during navigation.
   */
  function navigateToChat(id: string) {
    router.push(`/chat/${id}`)
    if (isMobile.value) sidebarOpen.value = false
  }

  /**
   * Deletes a chat and redirects if current chat is the one deleted.
   */
  function handleDeleteChat(id: string) {
    const open = getChat(String(route.params.id || ''))
    deleteChat(id)
    if (open?.id === id) {
      router.push('/')
    }
  }

  /** Event handler for renaming a specific chat thread */
  function handleRenameChat({ id, title }: { id: string; title: string }) {
    renameChat(id, title)
  }

  async function handleLogout() {
    if (logoutPending.value) {
      return
    }

    logoutPending.value = true

    try {
      await logout()
      await router.push('/')
    } finally {
      logoutPending.value = false
    }
  }
</script>
