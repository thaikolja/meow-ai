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
  <UModal
      v-model:open="open"
      :ui="{ content: 'settings-modal-panel w-[calc(100vw-1.5rem)] max-w-lg overflow-hidden sm:max-w-2xl', header: 'w-full min-w-0' }"
      dismissible
  >
    <!-- Modal Header with Cat-themed Title -->
    <template #header="{ close }">
      <div class="flex w-full min-w-0 items-center gap-3">
        <Icon
            class="h-5 w-5 shrink-0 text-primary-400"
            name="mdi:paw"
        />
        <h2 class="min-w-0 truncate text-lg font-semibold text-neutral-100 italic">Paw-ferences 🐾</h2>
        <button
            aria-label="Close"
            class="ms-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
            type="button"
            @click="close()"
        >
          <Icon
              class="h-5 w-5"
              name="lucide:x"
          />
        </button>
      </div>
    </template>

    <!-- Settings Main Body -->
    <template #body>
      <div class="space-y-8 p-1">
        <!-- AI Behavior Configurations (System Prompts) -->
        <div>
          <h3 class="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4 italic">Cat-figurations 🐾</h3>
          <div class="space-y-3">
            <div>
              <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label class="block text-xs font-medium text-neutral-500">Global System Prompt</label> <span
                  :class="draftIsCustom
                        ? 'border-primary-500/40 bg-primary-500/10 text-primary-300'
                        : 'border-neutral-700 bg-neutral-800 text-neutral-400'"
                  class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              >
                  {{ draftIsCustom ? 'Custom override' : 'Default prompt' }}
                </span>
              </div>

              <textarea
                  v-model="draft.systemPrompt"
                  class="min-h-52 w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-primary-500 transition-colors resize-y"
                  placeholder="e.g. You are a helpful assistant..."
                  rows="6"
                  @input="markDraftEdited"
              />

              <p class="text-xs text-neutral-500 mt-1">
                Edit <code>/public/system-prompt.md</code> to overwrite the default system prompt
              </p>
            </div>
          </div>
        </div>

        <!-- Default Model Selector -->
        <div>
          <h3 class="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4 italic">Default Meow-del 🐾
          </h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Preferred
                Model</label> <select
                v-model="draft.modelId"
                class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 outline-none focus:border-primary-500 transition-colors"
                @change="markDraftEdited"
            >
              <option
                  v-if="activeModels.length===0"
                  disabled
                  value=""
              >No models available
              </option>
              <option
                  v-for="model in activeModels"
                  :key="model.id"
                  :value="model.id"
              >
                {{ modelLabel(model.id) }}
              </option>
            </select>
              <p class="text-xs text-neutral-500 mt-1">
                This is the model new chats start with. Choosing another model inside a chat stays in that chat.
              </p>
            </div>
          </div>
        </div>

        <!-- Token Handling & Context Limits -->
        <div>
          <h3 class="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4 italic">Paw-token Handling 🐾
          </h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Max Context
                Messages</label> <input
                v-model.number="draft.maxContext"
                class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 outline-none focus:border-primary-500 transition-colors"
                min="0"
                type="number"
                @input="markDraftEdited"
            />
              <p class="text-xs text-neutral-500 mt-1">Controls how many previous messages are attached to outgoing
                requests. Set to 0 for unlimited context (may incur higher costs).
              </p>
            </div>
          </div>
        </div>

      </div>
    </template>

    <template #footer>
      <!-- Fixed overlay. The dialog's centering transform keeps it inside the modal, out of the button row. -->
      <ConfettiRain
          v-if="open && saveBurst > 0"
          contained
          :burst-id="saveBurst"
      />
      <div class="flex w-full min-w-0 flex-wrap items-center gap-2">
        <button
            class="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-400 disabled:opacity-60"
            data-settings-action="save"
            type="button"
            :disabled="saving || !accountSynced"
            @click="saveDraft"
        >
          <Icon
              class="h-4 w-4"
              name="mdi:cat"
          />
          <span>Save the nest</span>
        </button>
        <button
            class="inline-flex max-w-full items-center gap-2 rounded-lg border border-red-800/50 px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            data-settings-action="restore-prompt"
            type="button"
            :disabled="!draftIsCustom"
            @click="restoreDefaultPrompt"
        >
          <Icon
              class="h-4 w-4 shrink-0"
              name="mdi:file-restore"
          />
          <span>Change Meow's default prompt</span>
        </button>
      </div>
    </template>
  </UModal>
</template>

<script
    lang="ts"
    setup
>
/**
 * Main settings modal providing access to global app configurations.
 * Handles system prompts, default model selection, context management, and state cleanup.
 */

import { catalogModelName }                                                                     from '#shared/utils/models'
import type { SettingsDraft }                                                                   from '#shared/utils/settingsDraft'
import { committedSystemPrompt, refillSettingsDraft, restoreSystemPromptDraft, visibleModelId } from '#shared/utils/settingsDraft'

const open = defineModel<boolean>('open', { required: true })

const { activeModels, loadModels } = useModels()
const {
        defaultSystemPrompt,
        systemPromptOverride,
        maxContextMessages,
        selectedModel: persistedModel,
        ensureDefaultSystemPromptLoaded,
        setSelectedModel,
        setSystemPromptOverride,
        saveSettings
      }                            = useSettings()
const defaultModel                 = useDefaultModel()
const headerModel                  = useState<string>('selected-model', () => persistedModel.value || defaultModel.value)
const { authState }                = useAuthSession()
const accountSyncedFor             = useState<string | null>('account-synced-for', () => null)
const accountSynced                = computed(() => {
  const username = authState.value.username
  return Boolean(username) && accountSyncedFor.value === username
})
const saving                       = ref(false)
const saveBurst                    = ref(0)
/** True after the user changes the open draft, so a late account load does not wipe that edit. */
const draftEdited                  = ref(false)

const draft = ref<SettingsDraft>({
  systemPrompt: '',
  modelId:      '',
  maxContext:   25
})

/** True when the unsaved prompt is not the shipped prompt. */
const draftIsCustom = computed(() => committedSystemPrompt(draft.value.systemPrompt, defaultSystemPrompt.value) !== null)

/**
 * Catalog name for a model id. The option value stays the id.
 *
 * @param modelId - Catalog id.
 */
function modelLabel(modelId: string) {
  return catalogModelName(activeModels.value, modelId) || 'Meow'
}

/** Keeps the dropdown on a catalog id. An unknown configured default is not shown. */
function shownModelId(modelId: string) {
  return visibleModelId(
      modelId,
      activeModels.value.map(model => model.id),
      defaultModel.value
  )
}

/** Copies the saved fields into the draft unless the user already changed it. */
function fillDraft() {
  draft.value = refillSettingsDraft(
      draftEdited.value,
      draft.value,
      {
        systemPrompt: systemPromptOverride.value,
        modelId:      shownModelId(persistedModel.value || headerModel.value || draft.value.modelId),
        maxContext:   maxContextMessages.value
      },
      defaultSystemPrompt.value
  )
}

/** Marks the open draft so a saved account does not replace what the user just typed. */
function markDraftEdited() {
  draftEdited.value = true
}

watch([ systemPromptOverride, persistedModel, maxContextMessages, defaultSystemPrompt, headerModel ], () => {
  if (saving.value) return
  fillDraft()
})

watch(activeModels, () => {
  draft.value.modelId = shownModelId(draft.value.modelId)
})

watch(open, (isOpen) => {
  if (!isOpen) {
    saveBurst.value = 0
    return
  }
  draftEdited.value = false
  void ensureDefaultSystemPromptLoaded().then(() => {
    if (open.value) fillDraft()
  })
})

onMounted(() => {
  void loadModels()
  fillDraft()
})

/** Puts the shipped prompt back in the draft. The model, context window, and chats stay. */
function restoreDefaultPrompt() {
  if (!draftIsCustom.value) return
  if (import.meta.client) {
    window.alert('Meow will put the shipped default prompt back in this draft. The selected model and your chats stay. Save the nest to keep the change.')
  }
  draftEdited.value        = true
  draft.value.systemPrompt = restoreSystemPromptDraft(draft.value, defaultSystemPrompt.value).systemPrompt
}

/**
 * Commits the draft and lets the settings watcher write it for this username.
 */
async function saveDraft() {
  if (!accountSynced.value || saving.value) return

  saving.value      = true
  draftEdited.value = true
  try {
    await ensureDefaultSystemPromptLoaded()
    const promptText = draft.value.systemPrompt
    const modelId    = shownModelId(draft.value.modelId)
    const maxContext = Math.max(0, Math.floor(Number(draft.value.maxContext) || 0))
    const prompt     = committedSystemPrompt(promptText, defaultSystemPrompt.value)
    setSystemPromptOverride(prompt)
    maxContextMessages.value = maxContext
    setSelectedModel(modelId)
    headerModel.value        = modelId
    draft.value.systemPrompt = prompt ?? defaultSystemPrompt.value
    draft.value.modelId      = modelId
    draft.value.maxContext   = maxContext
    const saved              = await saveSettings()
    if (saved) saveBurst.value += 1
  } finally {
    draftEdited.value = false
    saving.value      = false
  }
}
</script>
