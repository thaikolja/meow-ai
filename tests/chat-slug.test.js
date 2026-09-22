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

import { buildChatSlugPrompt, chatAddress, fallbackChatSlug, normalizeChatSlug } from '../shared/utils/chatSlug'

describe('chat slug', () => {
    test('turns a sentence into 4 to 8 hyphenated words', () => {
        expect(normalizeChatSlug('Cat sits on sofa.')).toBe('cat-sits-on-sofa')
        expect(normalizeChatSlug('The kitten knocks the cup off.')).toBe('the-kitten-knocks-the-cup-off')
        expect(normalizeChatSlug('cat naps beside warm sunny window')).toBe('cat-naps-beside-warm-sunny-window')
    })

    test('rejects sentences outside 4 to 8 words', () => {
        expect(normalizeChatSlug('cat sits sofa')).toBeNull()
        expect(normalizeChatSlug('one two three four five six seven eight nine')).toBeNull()
    })

    test('drops punctuation and keeps letters only', () => {
        expect(normalizeChatSlug('"Cat sits on the sofa!"')).toBe('cat-sits-on-the-sofa')
        expect(normalizeChatSlug('cat sits on sofa 2')).toBe('cat-sits-on-sofa')
    })

    test('asks the model to avoid phrases it already used', () => {
        const prompt = buildChatSlugPrompt([ 'cat-sits-on-sofa' ])
        expect(prompt).toContain('4 or 5 words')
        expect(prompt).toContain('cat-sits-on-sofa')
    })

    test('builds a fresh cat sentence when the model cannot', () => {
        const random = () => 0
        const slug   = fallbackChatSlug([ 'cat-sits-on-sofa' ], random)
        const words  = slug.split('-')

        expect(normalizeChatSlug(slug)).toBe(slug)
        expect(words.length===4 || words.length===5).toBe(true)
        expect(slug).not.toBe('cat-sits-on-sofa')
    })

    test('uses the slug in the address and the hash until one exists', () => {
        expect(chatAddress({ id: 'abc123', slug: 'cat-sits-on-sofa' })).toBe('/chat/cat-sits-on-sofa')
        expect(chatAddress({ id: 'abc123' })).toBe('/chat/abc123')
    })
})
