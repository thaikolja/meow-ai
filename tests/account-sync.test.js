/*
 * Copyright (C) 2026 Kolja Nolte
 * https://meow.yanawa.io
 * info@meow.yanawa.io
 *
 * This work is licensed under the MIT License. You are free to use, modify,
 * and distribute this work, provided that you include the copyright notice
 * and this permission notice in all copies or substantial portions of the work.
 * For more information, visit: https://opensource.org/licenses/MIT
 *
 * @author    Kolja Nolte
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

/**
 * Covers per-username settings and chats, catalog names, and the settings footer.
 * The data directory is a temp folder. `.data/models.json` is only read.
 */

import { describe, expect, test }                                from 'bun:test'
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir }                                                from 'node:os'
import { join }                                                  from 'node:path'
import { fileURLToPath }                                         from 'node:url'

import { createSessionToken, verifySessionToken } from '../server/utils/authSession'
import {
    AccountAuthError,
    loadAccountForSession,
    saveAccountForSession
}                                                 from '../server/utils/userRecord'
import { buildChatRequest, buildDeepSeekRequest } from '../server/utils/providerApi'
import { catalogModelName }                       from '../shared/utils/models'
import { missingChatRedirect }                    from '../shared/utils/accountHydrate'
import {
    accountMutationEpoch,
    canPushAccountWrite,
    noteAccountMutation,
    resetAccountMutation,
    setAccountWritesOpen,
    shouldApplyFetchedAccount
}                                                 from '../app/utils/accountSyncGate'
import {
    committedSystemPrompt,
    refillSettingsDraft,
    resetSettingsDraft,
    restoreSystemPromptDraft,
    visibleModelId
}                                                 from '../shared/utils/settingsDraft'

const root                   = fileURLToPath(new URL('..', import.meta.url))
const dataDir                = mkdtempSync(join(tmpdir(), 'meow-account-'))
process.env['NUXT_DATA_DIR'] = dataDir

const secret     = 'house-secret'
const sineToken  = createSessionToken('sine', secret)
const otherToken = createSessionToken('whiskers', secret)

const savedPrompt = 'Explain German cases with a patient cat.'
const savedChat   = {
    id:        'chat-1',
    title:     'Cases',
    slug:      'cat-sits-on-sofa',
    model:     'deepseek-flash',
    createdAt: 10,
    updatedAt: 11,
    messages:  [
        {
            id:        'm1',
            role:      'user',
            content:   'Guten Tag',
            timestamp: 10,
            model:     'deepseek-flash'
        }
    ]
}

describe.serial('account sync', () => {
    test('saves and reloads sine, and keeps whiskers empty', async () => {
        writeFileSync(join(dataDir, 'models.json'), '{"untouched":true}\n')

        const saved = await saveAccountForSession(dataDir, sineToken, secret, {
            settings: {
                systemPrompt: savedPrompt,
                modelId:      'google/gemini-3.8-flash',
                maxContext:   12
            },
            chats:    [ savedChat ],
            username: 'whiskers'
        })

        expect(saved.settings.systemPrompt).toBe(savedPrompt)
        expect(saved.settings.modelId).toBe('google/gemini-3.8-flash')
        expect(saved.settings.maxContext).toBe(12)
        expect(saved.chats[0]?.slug).toBe('cat-sits-on-sofa')
        expect(saved.chats[0]?.model).toBe('deepseek-flash')
        expect(saved.chats[0]?.messages[0]?.content).toBe('Guten Tag')

        const loaded = loadAccountForSession(dataDir, sineToken, secret)
        expect(loaded.settings).toEqual(saved.settings)
        expect(loaded.chats[0]?.messages[0]?.content).toBe('Guten Tag')
        expect(loaded.chats[0]?.slug).toBe('cat-sits-on-sofa')
        expect(loaded.chats[0]?.model).toBe('deepseek-flash')

        const other = loadAccountForSession(dataDir, otherToken, secret)
        expect(other.stored).toBeUndefined()
        expect(other.chats).toEqual([])
        expect(other.settings.systemPrompt).toBeNull()
        expect(other.settings.modelId).toBe('')
        expect(loaded.stored).toBe(true)
        expect(readFileSync(join(dataDir, 'models.json'), 'utf8')).toBe('{"untouched":true}\n')
    })

    test('a missing or invalid session cannot read or write sine', async () => {
        const before     = readdirSync(join(dataDir, 'accounts')).sort()
        const sineBefore = loadAccountForSession(dataDir, sineToken, secret)

        expect(verifySessionToken(null, secret)).toBeNull()
        expect(verifySessionToken('not-a-session', secret)).toBeNull()
        expect(verifySessionToken(createSessionToken('sine', 'other-secret'), secret)).toBeNull()

        expect(() => loadAccountForSession(dataDir, null, secret)).toThrow(AccountAuthError)
        expect(() => loadAccountForSession(dataDir, 'not-a-session', secret)).toThrow(AccountAuthError)
        expect(() => saveAccountForSession(dataDir, null, secret, {
            settings: { systemPrompt: 'stolen', modelId: 'deepseek-flash', maxContext: 1 }
        })).toThrow(AccountAuthError)
        expect(() => saveAccountForSession(dataDir, createSessionToken('sine', 'other-secret'), secret, {
            chats: [ {
                ...savedChat,
                id:       'intruder',
                messages: [ { id: 'x', role: 'user', content: 'nope', timestamp: 1 } ]
            } ]
        })).toThrow(AccountAuthError)

        expect(readdirSync(join(dataDir, 'accounts')).sort()).toEqual(before)
        expect(loadAccountForSession(dataDir, sineToken, secret)).toEqual(sineBefore)
    })

    test('stores null when the prompt matches the shipped default', () => {
        const draft = {
            systemPrompt: 'Be a cat tutor',
            modelId:      'google/gemini-3.8-flash',
            maxContext:   8
        }

        expect(committedSystemPrompt('Be a cat tutor', 'Be a cat tutor')).toBeNull()
        expect(committedSystemPrompt('  ', 'Be a cat tutor')).toBeNull()
        expect(committedSystemPrompt(savedPrompt, 'Be a cat tutor')).toBe(savedPrompt)
        expect(restoreSystemPromptDraft(draft, 'Be a cat tutor')).toEqual({
            systemPrompt: 'Be a cat tutor',
            modelId:      'google/gemini-3.8-flash',
            maxContext:   8
        })
        expect(resetSettingsDraft('Be a cat tutor', 'google/gemini-3.8-flash')).toEqual({
            systemPrompt: 'Be a cat tutor',
            modelId:      'google/gemini-3.8-flash',
            maxContext:   25
        })
    })
})

describe('catalog names and upstream model ids', () => {
    test('shows the catalog name and sends the catalog id', () => {
        const catalogPath = join(root, '.data/models.json')
        const catalogText = readFileSync(catalogPath, 'utf8')
        const catalog     = JSON.parse(catalogText)
        const gemini      = catalog.find(model => model.id==='google/gemini-3.8-flash')
        const deepseek    = catalog.find(model => model.id==='deepseek-flash')

        expect(gemini?.name).toBe('Gemini 3.8 Flash')
        expect(deepseek?.name).toBe('DeepSeek V4.1 Flash')
        expect(catalogModelName(catalog, gemini.id)).toBe(gemini.name)
        expect(catalogModelName(catalog, gemini.id)).not.toBe(gemini.id)
        expect(catalogModelName(catalog, deepseek.id)).toBe(deepseek.name)
        expect(catalogModelName(catalog, deepseek.id)).not.toBe(deepseek.id)

        const openRouter = buildChatRequest(
                'https://openrouter.ai/api',
                'test-key',
                gemini.id,
                [ { role: 'user', content: 'hi' } ]
        )
        expect(openRouter.apiUrl).toBe('https://openrouter.ai/api/v1/chat/completions')
        expect(openRouter.body.model).toBe('google/gemini-3.8-flash')
        expect(openRouter.body.model).not.toBe('Gemini 3.8 Flash')

        const deepseekRequest = buildDeepSeekRequest(
                'ds-test-key',
                deepseek.id,
                [ { role: 'user', content: 'hi' } ]
        )
        expect(deepseekRequest.apiUrl).toBe('https://api.deepseek.com/chat/completions')
        expect(deepseekRequest.body.model).toBe('deepseek-flash')
        expect(deepseekRequest.body.model).not.toBe('DeepSeek V4.1 Flash')
        expect(readFileSync(catalogPath, 'utf8')).toBe(catalogText)
    })
})

describe('settings modal footer', () => {
    test('has Save, then a prompt restore that stays quiet when nothing changed', () => {
        const source  = readFileSync(join(root, 'app/components/SettingsModal.vue'), 'utf8')
        const footer  = source.split('<template #footer>')[1]?.split('</template>')[0] || ''
        const buttons = footer.split('<button').slice(1)
        const actions = [ ...footer.matchAll(/data-settings-action="([^"]+)"/g) ].map(match => match[1])

        expect(source.includes('Danger Zone')).toBe(false)
        expect(source.includes('Empty Litter Box')).toBe(false)
        expect(source.includes('let a, a')).toBe(false)
        expect(source.includes('class=""')).toBe(false)
        expect(source.includes('clearAllChats')).toBe(false)
        expect(actions).toEqual([ 'save', 'restore-prompt' ])
        expect(buttons).toHaveLength(2)
        expect(buttons[0]).toContain('<Icon')
        expect(buttons[0]).toContain('Save')
        expect(buttons[0]).toContain('saveDraft')
        expect(buttons[1]).toContain('<Icon')
        expect(buttons[1]).toContain('Change Meow\'s default prompt')
        expect(buttons[1]).toContain('restoreDefaultPrompt')
        expect(buttons[1]).toContain('draftIsCustom')
        expect(source).toContain('window.alert')
        expect(source.includes('Sweep the nest')).toBe(false)
        expect(source.includes('resetAllFields')).toBe(false)
        expect(source).toContain('restoreSystemPromptDraft')
        expect(source).toContain('refillSettingsDraft')
    })
})

describe('account hydrate races', () => {
    test('a closed write window still applies the first account load', () => {
        resetAccountMutation()
        setAccountWritesOpen(false)

        const start = accountMutationEpoch()
        noteAccountMutation()

        expect(accountMutationEpoch()).toBe(start)
        expect(shouldApplyFetchedAccount(start, false)).toBe(true)
        expect(canPushAccountWrite(true, false)).toBe(false)
        expect(canPushAccountWrite(false, false)).toBe(false)
        expect(canPushAccountWrite(true, true)).toBe(false)

        setAccountWritesOpen(true)
        expect(canPushAccountWrite(true, false)).toBe(true)
        noteAccountMutation()
        expect(accountMutationEpoch()).toBe(start + 1)
        expect(shouldApplyFetchedAccount(start, true)).toBe(false)
        expect(shouldApplyFetchedAccount(accountMutationEpoch(), true)).toBe(true)

        setAccountWritesOpen(false)
        resetAccountMutation()
    })

    test('a saved chat address stays until that username account is loaded', () => {
        expect(missingChatRedirect(false, 'cat-sits-on-sofa', false)).toBe(false)
        expect(missingChatRedirect(true, 'cat-sits-on-sofa', false)).toBe(true)
        expect(missingChatRedirect(true, 'cat-sits-on-sofa', true)).toBe(false)
        expect(missingChatRedirect(true, '   ', false)).toBe(false)

        const page    = readFileSync(join(root, 'app/pages/chat/[id].vue'), 'utf8')
        const mounted = page.split('onMounted(() => {')[1]?.split('onUnmounted')[0] || ''
        expect(mounted.includes('router.push')).toBe(false)
        expect(page).toContain('missingChatRedirect(')

        const sync = readFileSync(join(root, 'app/composables/useAccountSync.ts'), 'utf8')
        expect(sync).toContain('shouldApplyFetchedAccount(')
        expect(sync).toContain('setAccountWritesOpen(true)')
        expect(sync.includes('accountMutationEpoch()!==epochAtStart')).toBe(false)

        const chats    = readFileSync(join(root, 'app/composables/useChats.ts'), 'utf8')
        const settings = readFileSync(join(root, 'app/composables/useSettings.ts'), 'utf8')
        expect(chats).toContain('canPushAccountWrite(')
        expect(settings).toContain('canPushAccountWrite(')

        const shell = readFileSync(join(root, 'app/app.vue'), 'utf8')
        expect(shell).toContain('account-synced-for')
        expect(shell).toContain('v-show="appReady"')
    })

    test('an untouched settings draft takes the saved prompt, model id, and context', () => {
        const current   = {
            systemPrompt: 'shipped',
            modelId:      'google/gemini-3.8-flash',
            maxContext:   25
        }
        const committed = {
            systemPrompt: 'Explain German cases with a patient cat.',
            modelId:      'deepseek-flash',
            maxContext:   12
        }

        const filled = refillSettingsDraft(false, current, committed, 'shipped')
        expect(filled.systemPrompt).toBe('Explain German cases with a patient cat.')
        expect(filled.modelId).toBe('deepseek-flash')
        expect(filled.maxContext).toBe(12)

        const edited = {
            systemPrompt: 'user typed',
            modelId:      'google/gemini-3.8-flash',
            maxContext:   3
        }
        expect(refillSettingsDraft(true, edited, committed, 'shipped')).toEqual(edited)

        const catalog = [ 'google/gemini-3.8-flash', 'deepseek-flash' ]
        expect(visibleModelId('deepseek-flash', catalog, 'google/gemini-2.5-flash')).toBe('deepseek-flash')
        expect(visibleModelId('google/gemini-2.5-flash', catalog, 'google/gemini-2.5-flash')).toBe('google/gemini-3.8-flash')
    })

    test('settings save is registered in the browser, not during server render', () => {
        const settings = readFileSync(join(root, 'app/composables/useSettings.ts'), 'utf8')
        expect(settings).toContain('if (import.meta.client && !settingsWatchBound)')
        expect(settings.includes('useState(\'settings-persistence-bound\'')).toBe(false)
    })
})

describe('v1.6.0 notes', () => {
    test('package, readme, and changelog name this version', () => {
        const pkg       = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
        const readme    = readFileSync(join(root, 'README.md'), 'utf8')
        const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')

        expect(pkg.version).toBe('1.6.0')
        expect(readme).toContain('Version 1.6.0')
        expect(readme.includes('Do not bump past this until asked')).toBe(false)
        expect(readme.includes('stay on 1.5.0')).toBe(false)
        expect(changelog).toContain('## v1.6.0')
    })
})
