<template>
  <div class="flex flex-col h-full bg-zinc-900 border-l border-zinc-800/50">
    <ClientOnly>
      <!-- Main Content -->
      <div class="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h1 class="text-3xl font-bold text-zinc-100 mb-4">Einstein — Your German Tutor 🇩🇪</h1>
        <p class="text-zinc-400 max-w-md mx-auto mb-8">
          Welcome! Ask me anything to practice your German. I speak English, German, and Thai! 🇹🇭
        </p>
      </div>
      
      <!-- Input Area -->
      <ChatInput
        :is-streaming="false"
        @send="handleSend"
      />
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
  title: 'chat.yanawa.io — AI Chat Interface'
})
</script>
