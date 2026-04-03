<template>
  <div class="flex flex-col items-start gap-3 py-2 animate-in fade-in duration-500">
    <div class="flex items-center gap-3">
      <!-- Pulsing Cat Head Icon -->
      <div class="relative flex items-center justify-center">
        <div class="absolute inset-0 bg-primary-500/20 rounded-full animate-ping opacity-20"></div>
        <Icon name="mdi:cat" class="w-6 h-6 text-primary-400 relative z-10 animate-pulse" />
      </div>

      <!-- Thinking Dots with Cat Tails -->
      <div class="flex items-end gap-1.5 h-6">
        <div 
          v-for="i in 3" 
          :key="i"
          class="w-1.5 h-4 bg-zinc-700/50 rounded-full relative overflow-hidden"
        >
          <div 
            class="absolute bottom-0 left-0 w-full bg-primary-500/40 rounded-full animate-bounce"
            :style="{ 
              height: '60%', 
              animationDelay: `${(i-1) * 200}ms`,
              animationDuration: '1s'
            }"
          ></div>
        </div>
      </div>
    </div>
    
    <p class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 italic animate-pulse">
      Einstein is purring... 🐾
    </p>
  </div>
</template>

<style scoped>
@keyframes pulse-soft {
  0%, 100% { opacity: 0.4; transform: scale(0.98); }
  50% { opacity: 0.8; transform: scale(1.02); }
}
</style>
