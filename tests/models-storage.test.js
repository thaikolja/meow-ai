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

import {afterEach, describe, expect, test} from 'bun:test'
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir}                                                           from 'node:os'
import {join}                                                             from 'node:path'

const tempDir = mkdtempSync(join(tmpdir(), 'meow-models-'))
process.env['NUXT_DATA_DIR'] = tempDir
globalThis.useRuntimeConfig = () => ({dataDir: tempDir})

const {getAllModels, initializeDefaultModels} = await import('../server/utils/modelsStorage')
const modelsFile                              = join(tempDir, 'models.json')

describe('modelsStorage', () => {
  afterEach(() => {
    if (existsSync(modelsFile)) rmSync(modelsFile)
  })

  test('seeds 4 default models when models.json is missing', () => {
    initializeDefaultModels()
    const models = getAllModels()
    expect(models).toHaveLength(4)
    const ids = models.map(m => m.id)
    expect(ids).toContain('google/gemini-3-flash-preview')
    expect(ids).toContain('google/gemini-3.1-flash-lite-preview')
    expect(ids).toContain('google/gemini-3.5-flash')
    expect(ids).toContain('google/gemini-2.5-flash')
    expect(models.every(m => m.isActive)).toBe(true)
    expect(models.every(m => m.providerId==='openrouter-default')).toBe(true)
  })

  test('seeds defaults when models.json is an empty array', () => {
    writeFileSync(modelsFile, '[]')
    initializeDefaultModels()
    expect(getAllModels()).toHaveLength(4)
  })

  test('does not overwrite existing custom models', () => {
    const custom = [{
      id:         'custom/my-model',
      name:       'My Model',
      providerId: 'custom-provider',
      isActive:   true
    }]
    writeFileSync(modelsFile, JSON.stringify(custom))
    initializeDefaultModels()
    const models = getAllModels()
    expect(models).toHaveLength(1)
    expect(models[0]?.id).toBe('custom/my-model')
  })

  test('overwrites corrupt JSON by treating it as empty', () => {
    writeFileSync(modelsFile, '{ invalid json')
    initializeDefaultModels()
    expect(getAllModels()).toHaveLength(4)
  })

  test('returns empty array when file is missing and not initialized', () => {
    expect(getAllModels()).toEqual([])
  })

  test('persists seeded models to disk as valid JSON', () => {
    initializeDefaultModels()
    const raw    = readFileSync(modelsFile, 'utf-8')
    const parsed = JSON.parse(raw)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(4)
  })
})
