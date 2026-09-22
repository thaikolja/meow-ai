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

import { describe, expect, test } from 'bun:test'

import { applyModelPick, displayedModelId } from '../shared/utils/sessionModel'

const DEFAULT_MODEL = 'google/gemini-2.5-flash'
const SESSION_MODEL = 'google/gemini-3-flash-preview'

describe('session model selection', () => {
    test('a chat shows its own model instead of the global default', () => {
        expect(displayedModelId({
            path:        '/chat/abc',
            chatModel:   SESSION_MODEL,
            globalModel: DEFAULT_MODEL
        })).toBe(SESSION_MODEL)
    })

    test('a chat with no stored model falls back to the global default', () => {
        expect(displayedModelId({
            path:        '/chat/abc',
            chatModel:   '  ',
            globalModel: DEFAULT_MODEL
        })).toBe(DEFAULT_MODEL)
    })

    test('picking a model inside a chat keeps the global default', () => {
        expect(applyModelPick({
            path:        '/chat/abc/',
            pickedModel: SESSION_MODEL,
            globalModel: DEFAULT_MODEL
        })).toEqual({
            sessionModel: SESSION_MODEL,
            globalModel:  DEFAULT_MODEL
        })
    })

    test('picking a model outside a chat updates only the global default', () => {
        expect(applyModelPick({
            path:        '/',
            pickedModel: SESSION_MODEL,
            globalModel: DEFAULT_MODEL
        })).toEqual({
            sessionModel: null,
            globalModel:  SESSION_MODEL
        })
    })
})
