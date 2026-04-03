<template>
  <div class="flex flex-col h-full bg-zinc-900 border-l border-zinc-800/50 relative overflow-hidden">
    
    <!-- Background Accents -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl text-balance"></div>
    </div>

    <ClientOnly>
      <!-- Main Content -->
      <div class="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 overflow-y-auto w-full max-w-6xl mx-auto">
        
        <!-- Hero Section -->
        <div class="mb-10 relative mt-10 sm:mt-0">
          <div class="w-28 h-28 mx-auto bg-zinc-950 rounded-full flex items-center justify-center shadow-2xl border border-zinc-700/80 relative z-10 shadow-primary-900/20">
            <Icon name="lucide:brain-circuit" class="w-14 h-14 text-white" />
          </div>
          <!-- Decorative flags -->
          <div class="absolute -bottom-2 -left-4 bg-zinc-900 rounded-full p-2 shadow-lg border border-zinc-800 animate-bounce" style="animation-duration: 3s">
            <Icon name="circle-flags:th" class="w-7 h-7" />
          </div>
          <div class="absolute -bottom-2 -right-4 bg-zinc-900 rounded-full p-2 shadow-lg border border-zinc-800 animate-bounce" style="animation-duration: 3s; animation-delay: 500ms">
            <Icon name="circle-flags:de" class="w-7 h-7" />
          </div>
        </div>

        <h1 class="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 mb-6 drop-shadow-sm tracking-tight pt-4">
          Willkommen!
        </h1>
        
        <p class="text-zinc-400 max-w-xl mx-auto mb-12 text-lg leading-relaxed">
          I am Einstein, your personal German language tutor. 
          Send me a message in Thai, German, or English to begin learning together!
        </p>

        <!-- Suggested Actions Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full mx-auto mb-12 px-2">
          <button 
            @click="handleSend('Can you teach me how to introduce myself in German? Explain the grammar basics clearly.')"
            class="group text-left p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800 hover:border-primary-500/50 transition-all flex items-start gap-4 shadow-sm"
          >
            <div class="p-2.5 bg-primary-900/30 rounded-xl group-hover:scale-110 transition-transform shrink-0">
              <Icon name="lucide:hand" class="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-200 mb-1.5">Introductions</h3>
              <p class="text-xs text-zinc-500 leading-relaxed">Learn how to say hello and introduce yourself correctly.</p>
            </div>
          </button>

          <button 
            @click="handleSend('Let\'s do a simple roleplay! You are a barista at a coffee shop in Berlin, and I am a customer ordering coffee.')"
            class="group text-left p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800 hover:border-blue-500/50 transition-all flex items-start gap-4 shadow-sm"
          >
            <div class="p-2.5 bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform shrink-0">
              <Icon name="lucide:coffee" class="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-200 mb-1.5">Roleplay: Café</h3>
              <p class="text-xs text-zinc-500 leading-relaxed">Practice ordering coffee in a casual Berlin setting.</p>
            </div>
          </button>

           <button 
            @click="handleSend('Please explain the difference between Der, Die, and Das using examples that a Thai speaker would understand.')"
            class="group text-left p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800 hover:border-orange-500/50 transition-all flex items-start gap-4 shadow-sm"
          >
            <div class="p-2.5 bg-orange-900/30 rounded-xl group-hover:scale-110 transition-transform shrink-0">
              <Icon name="lucide:book-open" class="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-200 mb-1.5">Grammar: Articles</h3>
              <p class="text-xs text-zinc-500 leading-relaxed">Master German articles (der, die, das) easily.</p>
            </div>
          </button>

          <button 
            @click="handleSend('Give me 5 essential German phrases related to traveling, along with their Thai translations and pronunciation.')"
            class="group text-left p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:bg-zinc-800 hover:border-emerald-500/50 transition-all flex items-start gap-4 shadow-sm"
          >
            <div class="p-2.5 bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform shrink-0">
              <Icon name="lucide:plane" class="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-200 mb-1.5">Travel Vocabulary</h3>
              <p class="text-xs text-zinc-500 leading-relaxed">Useful phrases for taking the train and moving around.</p>
            </div>
          </button>
        </div>
      </div>
      
      <!-- Input Area -->
      <div class="relative z-20 shrink-0 w-full">
        <ChatInput
          :is-streaming="false"
          @send="handleSend"
        />
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { createChat, addMessage } = useChats()
const selectedProvider = useState<string>('selected-provider', () => 'deepseek-default')
const selectedModel = useState<string>('selected-model', () => 'deepseek-chat')

async function handleSend(content: string) {
  const newChat = createChat(selectedProvider.value, selectedModel.value)
  addMessage(newChat.id, {
    role: 'user',
    content,
    model: selectedModel.value,
    providerId: selectedProvider.value
  })
  sessionStorage.setItem('pending-stream', newChat.id)
  router.push(`/chat/${newChat.id}`)
}

useHead({
  title: 'Einstein — AI German Tutor'
})
</script>
