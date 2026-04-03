<template>
  <div class="flex items-center justify-center min-h-screen bg-zinc-900 overflow-hidden relative">
    
    <!-- Background Accents -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-sm mx-4 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 relative z-10 shadow-2xl shadow-primary-900/10">
      
      <!-- Header -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 shadow-inner relative">
          <Icon name="mdi:cat" class="w-10 h-10 text-primary-500" />
          <Icon name="mdi:paw" class="w-5 h-5 text-zinc-600 absolute -bottom-2 -right-1 rotate-12" />
        </div>
        <h1 class="text-2xl font-bold text-zinc-100 tracking-tight">Einstein 🐾</h1>
        <p class="text-sm text-zinc-500 mt-1">Please log in to continue learning</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        
        <div>
          <label class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Your Name</label>
          <div class="relative">
            <Icon name="lucide:user" class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              v-model="username"
              type="text" 
              required
              class="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-zinc-200 placeholder-zinc-500 outline-none focus:border-primary-500 transition-colors text-sm"
              placeholder="e.g. Kolja"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Secret Password</label>
          <div class="relative">
            <Icon name="lucide:key" class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              v-model="password"
              type="password" 
              required
              class="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-zinc-200 placeholder-zinc-500 outline-none focus:border-primary-500 transition-colors text-sm font-mono"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="text-xs text-red-400 pt-1 text-center font-medium bg-red-950/30 p-2 rounded-lg border border-red-900/50">
          {{ errorMsg }}
        </div>

        <button 
          type="submit"
          :disabled="loading"
          class="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-all mt-6 shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Icon v-if="loading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <Icon v-else name="mdi:paw" class="w-4 h-4" />
          <span>{{ loading ? 'Unlocking...' : 'Let me in!' }}</span>
        </button>
      </form>
      
    </div>
  </div>
</template>

<script setup lang="ts">
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) return
  
  loading.value = true
  errorMsg.value = ''
  
  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value.trim(),
        password: password.value.trim()
      }
    })
    
    // Cookie is set server-side automatically
    window.location.href = '/' // Force hard redirect to reload app state
  } catch (e: any) {
    errorMsg.value = e.data?.message || 'Login failed! Please check your password.'
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Login - Einstein 🐾'
})
</script>
