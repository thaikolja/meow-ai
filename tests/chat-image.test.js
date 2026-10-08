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
 * Covers which models accept a page photo and how one JPEG data URL
 * is checked before OpenRouter or DeepSeek Flash receives it.
 */

import { describe, expect, test } from 'bun:test'

import { buildChatRequest, buildDeepSeekRequest } from '../server/utils/providerApi'
import {
    MAX_CHAT_IMAGE_BYTES,
    MAX_IMAGES_PER_REQUEST,
    sanitizeUpstreamMessages
}                                                 from '../shared/utils/chatImage'
import { modelSupportsVision }                    from '../shared/utils/models'

/**
 * Builds a tiny JPEG data URL. `extraBytes` pads the payload so size limits can be tested.
 *
 * @param extraBytes - Extra bytes appended after the JPEG markers.
 */
function jpegDataUrl(extraBytes = 0) {
    const bytes = [ 0xff, 0xd8, 0xff, 0xd9 ]
    for (let index = 0; index < extraBytes; index += 1) bytes.push(0)
    return `data:image/jpeg;base64,${Buffer.from(bytes).toString('base64')}`
}

describe('chat images', () => {
    test('lets Gemini and DeepSeek Flash read a photo and keeps other models closed', () => {
        expect(modelSupportsVision('google/gemini-3.8-flash')).toBe(true)
        expect(modelSupportsVision('  Google/gemini-2.5-flash  ')).toBe(true)
        expect(modelSupportsVision('deepseek-flash')).toBe(true)
        expect(modelSupportsVision('deepseek-v4-flash')).toBe(true)
        expect(modelSupportsVision('deepseek/deepseek-chat')).toBe(true)
        expect(modelSupportsVision('deepseek-v4-pro')).toBe(false)
        expect(modelSupportsVision('openai/gpt-4o')).toBe(false)
        expect(modelSupportsVision('')).toBe(false)
        expect(modelSupportsVision(null)).toBe(false)
    })

    test('forwards one JPEG data URL with the typed question on OpenRouter', () => {
        const image    = jpegDataUrl()
        const payload  = image.slice('data:image/jpeg;base64,'.length)
        const messy    = `data:image/jpeg;base64,${payload.slice(0, 4)}\n${payload.slice(4)}`
        const messages = sanitizeUpstreamMessages([
            { role: 'system', content: 'Be a tutor.' },
            {
                role:    'user',
                content: [
                    { type: 'text', text: '  What is wrong on this page?  ' },
                    { type: 'image_url', image_url: { url: messy } }
                ]
            }
        ], 'google/gemini-3.8-flash')

        expect(messages).toEqual([
            { role: 'system', content: 'Be a tutor.' },
            {
                role:    'user',
                content: [
                    { type: 'text', text: 'What is wrong on this page?' },
                    { type: 'image_url', image_url: { url: image } }
                ]
            }
        ])

        const request = buildChatRequest('https://openrouter.ai/api', 'test-key', 'google/gemini-3.8-flash', messages)
        expect(request.body.messages[1].content[1].image_url.url).toBe(image)
    })

    test('keeps a photo-only turn and drops an empty text turn', () => {
        const messages = sanitizeUpstreamMessages([
            { role: 'user', content: '   ' },
            { role: 'user', content: [ { type: 'image_url', image_url: { url: jpegDataUrl() } } ] }
        ], 'google/gemini-2.5-flash')

        expect(messages).toHaveLength(1)
        expect(Array.isArray(messages[0].content)).toBe(true)
    })

    test('forwards a JPEG to DeepSeek Flash and rejects it for other models', () => {
        const image    = jpegDataUrl()
        const messages = sanitizeUpstreamMessages([
            {
                role: 'user', content: [
                    { type: 'text', text: 'What is on this page?' },
                    { type: 'image_url', image_url: { url: image } }
                ]
            }
        ], 'deepseek-flash')

        const request = buildDeepSeekRequest('ds-test-key', 'deepseek-flash', messages)
        expect(request.body.model).toBe('deepseek-flash')
        expect(request.body.messages[0].content[1].image_url.url).toBe(image)

        expect(() => sanitizeUpstreamMessages([
            { role: 'user', content: [ { type: 'image_url', image_url: { url: image } } ] }
        ], 'deepseek-v4-pro')).toThrow(/can't read images/)
        expect(() => sanitizeUpstreamMessages([
            { role: 'user', content: [ { type: 'image_url', image_url: { url: image } } ] }
        ], 'openai/gpt-4o')).toThrow(/can't read images/)
    })

    test('rejects remote urls, other formats, a second photo, and oversized files', () => {
        const model = 'google/gemini-3.5-flash-lite'

        expect(() => sanitizeUpstreamMessages([
            { role: 'user', content: [ { type: 'image_url', image_url: { url: 'https://example.com/page.jpg' } } ] }
        ], model)).toThrow(/JPEG/)

        expect(() => sanitizeUpstreamMessages([
            { role: 'user', content: [ { type: 'image_url', image_url: { url: 'data:image/png;base64,aaaa' } } ] }
        ], model)).toThrow(/JPEG/)

        expect(() => sanitizeUpstreamMessages([
            {
                role:    'user',
                content: [
                    { type: 'image_url', image_url: { url: jpegDataUrl() } },
                    { type: 'image_url', image_url: { url: jpegDataUrl() } }
                ]
            }
        ], model)).toThrow(/Only one image/)

        expect(() => sanitizeUpstreamMessages([
            { role: 'assistant', content: [ { type: 'image_url', image_url: { url: jpegDataUrl() } } ] }
        ], model)).toThrow(/Only user messages/)

        const huge = jpegDataUrl(MAX_CHAT_IMAGE_BYTES)
        expect(() => sanitizeUpstreamMessages([
            { role: 'user', content: [ { type: 'image_url', image_url: { url: huge } } ] }
        ], model)).toThrow(/too large/)
    })

    test('rejects more photos than one request may forward', () => {
        const messages = Array.from({ length: MAX_IMAGES_PER_REQUEST + 1 }, () => ({
            role:    'user',
            content: [ { type: 'image_url', image_url: { url: jpegDataUrl() } } ]
        }))

        expect(() => sanitizeUpstreamMessages(messages, 'google/gemini-3.8-flash')).toThrow(/Too many images/)
    })
})
