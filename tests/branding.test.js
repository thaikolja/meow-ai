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
 * @email     kolja.nolte@gmail.com
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

import { describe, expect, test } from 'bun:test'
import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const IGNORED_DIRS = new Set([ '.git', '.nuxt', '.output', 'node_modules', '.idea' ])
const SCANNED_EXTENSIONS = new Set([ '.ts', '.js', '.vue', '.mjs', '.json', '.md', '.yml', '.yaml', '.css', '.txt' ])
const EXTRA_FILES = new Set([ 'package.json', '.gitlab-ci.yml' ])
const LEGACY_BRAND = ['Ein', 'stein'].join('')
const LEGACY_DOMAIN = ['chat', 'yanawa', 'io'].join('.')
const FORBIDDEN_STRINGS = [ LEGACY_BRAND, LEGACY_DOMAIN ]
const EXCLUDED_FILES = new Set([ join(ROOT, 'tests/branding.test.js') ])

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        files.push(...await collectFiles(join(dir, entry.name)))
      }
      continue
    }

    const filePath = join(dir, entry.name)
    if ((SCANNED_EXTENSIONS.has(extname(entry.name)) || EXTRA_FILES.has(entry.name)) && !EXCLUDED_FILES.has(filePath)) {
      files.push(filePath)
    }
  }

  return files
}

describe('Meow branding sweep', () => {
  test('source files do not contain the old project branding', async () => {
    const files = await collectFiles(ROOT)
    const violations = []

    for (const file of files) {
      const content = await readFile(file, 'utf8')
      for (const match of FORBIDDEN_STRINGS) {
        if (content.includes(match)) {
          violations.push({ file, match })
        }
      }
    }

    expect(violations).toEqual([])
  })

  test('key app metadata points at Meow', async () => {
    const nuxtConfig = await readFile(join(ROOT, 'nuxt.config.ts'), 'utf8')
    const indexPage = await readFile(join(ROOT, 'app/pages/index.vue'), 'utf8')
    const loginPage = await readFile(join(ROOT, 'app/pages/login.vue'), 'utf8')
    const authGate = await readFile(join(ROOT, 'app/components/AuthGate.vue'), 'utf8')
    const chatPage = await readFile(join(ROOT, 'app/pages/chat/[id].vue'), 'utf8')
    const agents = await readFile(join(ROOT, 'AGENTS.md'), 'utf8')
    const styles = await readFile(join(ROOT, 'app/assets/css/main.css'), 'utf8')
    const favicon = await readFile(join(ROOT, 'public/favicon.svg'), 'utf8')

    expect(nuxtConfig).toContain('Meow 🐾')
    expect(nuxtConfig).toContain('https://meow.yanawa.io')
    expect(nuxtConfig).toContain("rel: 'canonical'")
    expect(nuxtConfig).toContain('/favicon.svg')
    expect(nuxtConfig).toContain('/favicon.ico')
    expect(indexPage).toContain('Meow 🐾 — AI German Tutor')
    expect(loginPage).toContain('Cat flap moved — Meow 🐾')
    expect(authGate).toContain('Open the cat flap')
    expect(chatPage).toContain('meow.yanawa.io')
    expect(agents).toContain('How to work with meow.yanawa.io')
    expect(styles).toContain('meow.yanawa.io — Custom Styles')
    expect(favicon).toContain('prefers-color-scheme: light')
  })

  test('core UI branding now uses Meow copy', async () => {
    const layout = await readFile(join(ROOT, 'app/layouts/default.vue'), 'utf8')
    const chatInput = await readFile(join(ROOT, 'app/components/ChatInput.vue'), 'utf8')
    const chatMessage = await readFile(join(ROOT, 'app/components/ChatMessage.vue'), 'utf8')
    const thinkingCat = await readFile(join(ROOT, 'app/components/ThinkingCat.vue'), 'utf8')
    const chatMessages = await readFile(join(ROOT, 'app/components/ChatMessages.vue'), 'utf8')

    expect(layout).toContain('Meow 🐾')
    expect(chatInput).toContain('Meow is sharpening claws')
    expect(chatMessage).toContain('Meow 🐾')
    expect(thinkingCat).toContain('Meow is drafting a reply')
    expect(thinkingCat).toContain('Meow is lining up the next pounce')
    expect(chatMessage).not.toContain('label="Thinking..."')
    expect(chatMessages).not.toContain("isThinking ? 'Thinking...' : undefined")
  })
})
