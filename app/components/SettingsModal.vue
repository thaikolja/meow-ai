<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-2xl' }">
    <template #header>
      <div class="flex items-center gap-3">
        <Icon name="mdi:paw" class="w-5 h-5 text-primary-400" />
        <h2 class="text-lg font-semibold text-neutral-100 italic">Paw-ferences 🐾</h2>
      </div>
    </template>

    <template #body>
      <div class="space-y-8 p-1">
        <!-- General Section -->
        <div>
          <h3 class="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4 italic">Cat-figurations 🐾</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Global System Prompt</label>
              <textarea
                v-model="systemPrompt"
                rows="3"
                placeholder="e.g. You are a helpful assistant..."
                class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-primary-500 transition-colors resize-none"
              ></textarea>
              <p class="text-xs text-neutral-500 mt-1">This instruction is sent with every new conversation.</p>
            </div>
          </div>
        </div>

        <!-- Token Management Section -->
        <div>
          <h3 class="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4 italic">Paw-token Handling 🐾</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Max Context Messages</label>
              <input
                v-model.number="maxContextMessages"
                type="number"
                min="0"
                class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 outline-none focus:border-primary-500 transition-colors"
              />
              <p class="text-xs text-neutral-500 mt-1">Limit how many previous messages are sent to the API to save tokens. The rest stay locally in your browser. (0 to send everything)</p>
            </div>
          </div>
        </div>

        <!-- Providers Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-neutral-300 uppercase tracking-wider italic">Meow-del Feeders 🐾</h3>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 transition-colors text-sm"
              @click="showAddForm = true"
            >
              <Icon name="lucide:plus" class="w-3.5 h-3.5" />
              <span>Add Provider</span>
            </button>
          </div>

          <!-- Add Provider Form -->
          <ProviderForm
            v-if="showAddForm"
            class="mb-4"
            @save="handleAddProvider"
            @cancel="showAddForm = false"
          />

          <!-- Provider List -->
          <ProviderList />
        </div>

        <!-- Danger Zone -->
        <div class="border-t border-neutral-800 pt-4">
          <h3 class="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 italic">Danger Zone 🐾</h3>
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-800/50 text-red-400 hover:bg-red-900/20 transition-colors text-sm"
            @click="handleClearChats"
          >
            <Icon name="mdi:trash-can" class="w-4 h-4" />
            <span>Empty Litter Box 🐾</span>
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const { addProvider, fetchModels } = useProviders()
const { clearAllChats } = useChats()
const { systemPrompt, maxContextMessages } = useSettings()

const showAddForm = ref(false)

async function handleAddProvider(data: { name: string; baseUrl: string; apiKey: string }) {
  const provider = addProvider(data)
  showAddForm.value = false
  // Auto-fetch models
  await fetchModels(provider.id)
}

function handleClearChats() {
  if (confirm('Are you sure you want to empty the litter box? All meows will be gone forever! 🐾')) {
    clearAllChats()
    navigateTo('/')
  }
}
</script>
