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
  <div class="flex flex-col h-full bg-transparent relative overflow-hidden">
    <ClientOnly>
      <!-- Main Centered Content (Hero and Suggested Actions) -->
      <div class="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 overflow-y-auto w-full max-w-6xl mx-auto">

        <!-- Hero Mascot Section with Animations -->
        <div class="mb-10 relative mt-10 sm:mt-0">
          <div class="w-28 h-28 mx-auto bg-zinc-950 rounded-full flex items-center justify-center shadow-2xl border border-zinc-700/80 relative z-10 shadow-primary-900/20">
            <Icon class="w-16 h-16 text-white" name="mdi:cat" />
          </div>
          <!-- Language Flags (Thai and German) representing the app focus -->
          <div class="absolute -bottom-2 -left-4 bg-zinc-900 rounded-full p-2 shadow-lg border border-zinc-800 animate-bounce" style="animation-duration: 3s">
            <Icon class="w-7 h-7" name="circle-flags:th" />
          </div>
          <div class="absolute -bottom-2 -right-4 bg-zinc-900 rounded-full p-2 shadow-lg border border-zinc-800 animate-bounce" style="animation-duration: 3s; animation-delay: 500ms">
            <Icon class="w-7 h-7" name="circle-flags:de" />
          </div>
        </div>

        <h1 class="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-r from-primary-400 via-zinc-100 to-primary-600 mb-2 drop-shadow-xl tracking-tight pt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          Meow 🐾
        </h1>

        <h2 class="text-2xl md:text-3xl font-bold text-zinc-400 mb-8 tracking-wide">
          Willkommen, {{ displayName }}!
        </h2>

        <p class="text-zinc-500 max-w-xl mx-auto mb-12 text-lg leading-relaxed font-medium">
          I am your personal AI German Tutor. Ready to turn language learning into something feline-tastic? 🐾
        </p>

        <!-- Suggested Actions Grid: Pre-defined prompts for quick onboarding -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full mx-auto mb-12 px-2">
          <!-- Introduction Prompt -->
          <button
              class="group text-left p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800 hover:border-primary-500/50 transition-all flex items-start gap-4 shadow-sm" @click="handleSend('Can you teach me how to introduce myself in German? Explain the grammar basics clearly.')">
            <div class="p-2.5 bg-primary-900/30 rounded-xl group-hover:scale-110 transition-transform shrink-0">
              <Icon class="w-5 h-5 text-primary-400" name="lucide:hand" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-200 mb-1.5">Introductions</h3>
              <p class="text-xs text-zinc-500 leading-relaxed">Learn how to say hello and introduce yourself correctly
                in German.
              </p>
            </div>
          </button>

          <!-- Roleplay Prompt -->
          <button
              class="group text-left p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800 hover:border-blue-500/50 transition-all flex items-start gap-4 shadow-sm" @click="handleSend('Let\'s do a simple roleplay! You are a barista at a coffee shop in Berlin, and I am a customer ordering coffee.')">
            <div class="p-2.5 bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform shrink-0">
              <Icon class="w-5 h-5 text-blue-400" name="lucide:coffee" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-200 mb-1.5">Roleplay: Café</h3>
              <p class="text-xs text-zinc-500 leading-relaxed">Practice ordering coffee in a realistic casual Berlin
                setting.
              </p>
            </div>
          </button>

          <!-- Grammar Deep-dive Prompt -->
          <button
              class="group text-left p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800 hover:border-orange-500/50 transition-all flex items-start gap-4 shadow-sm" @click="handleSend('Please explain the difference between Der, Die, and Das using examples that a Thai speaker would understand.')">
            <div class="p-2.5 bg-orange-900/30 rounded-xl group-hover:scale-110 transition-transform shrink-0">
              <Icon class="w-5 h-5 text-orange-400" name="lucide:book-open" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-200 mb-1.5">Grammar: Articles</h3>
              <p class="text-xs text-zinc-500 leading-relaxed">Master the complexity of German articles (der, die, das)
                with local context.
              </p>
            </div>
          </button>

          <!-- Phrase List Prompt -->
          <button
              class="group text-left p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800 hover:border-emerald-500/50 transition-all flex items-start gap-4 shadow-sm" @click="handleSend('Give me 5 essential German phrases related to traveling, along with their Thai translations and pronunciation.')">
            <div class="p-2.5 bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform shrink-0">
              <Icon class="w-5 h-5 text-emerald-400" name="lucide:plane" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-200 mb-1.5">Travel Vocabulary</h3>
              <p class="text-xs text-zinc-500 leading-relaxed">Prepare for your next trip with train and transport
                essentials.
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Primary Entry Point: Reusable ChatInput component -->
      <div class="relative z-20 shrink-0 w-full">
        <ChatInput
            :is-streaming="false" @send="handleSend" />
      </div>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Landing page/Dashboard for Meow (meow.yanawa.io).
   * Provides a friendly hero section, quick-start prompts, and immediate chat entry.
   */

  const router                     = useRouter()
  const { createChat, addMessage } = useChats()

  // Shared global state for current AI configuration
  const selectedProvider = useState<string>('selected-provider', () => 'groq-default')
  const selectedModel    = useState<string>('selected-model', () => 'llama-3.3-70b-versatile')

  // Personalized greeting state
  const username    = useCookie('chat_username')
  const displayName = computed(() => username.value || 'Friend')

  /**
   * Handles the initial message submission from the dashboard.
   * 1. Creates a new unique chat thread.
   * 2. Injects the current user input into that thread.
   * 3. Sets a session flag to auto-trigger generation on the chat page.
   * 4. Navigates to the chat view.
   */
  async function handleSend(content: string) {
    const newChat = createChat(selectedProvider.value, selectedModel.value)
    addMessage(newChat.id, {
      role:       'user',
      content,
      model:      selectedModel.value,
      providerId: selectedProvider.value
    })

    // Handshake mechanism for cross-page stream triggering
    sessionStorage.setItem('pending-stream', newChat.id)
    router.push(`/chat/${newChat.id}`)
  }

  /** Set page metadata for SEO and browser tabs */
  useHead({
    title: 'Meow 🐾 — AI German Tutor'
  })
</script>
