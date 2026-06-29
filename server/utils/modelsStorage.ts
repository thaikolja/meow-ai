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

/**
 * Server-side file-backed catalog of available models with human-readable names.
 * Mirrors the file-backed storage pattern: read from .data/models.json, seed
 * defaults when the file is empty or missing.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join }                                      from 'node:path'
import { ensureDataDir }                             from './dataDir'
import type { Model }                                from '#shared/types/model'

function getStoragePath(): string {
  const dataDir = ensureDataDir(useRuntimeConfig().dataDir || process.env['NUXT_DATA_DIR'])
  return join(dataDir, 'models.json')
}

function loadModelsFile(): Model[] {
  const filePath = getStoragePath()
  if (!existsSync(filePath)) return []
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return []
  }
}

function saveModelsFile(models: Model[]): void {
  writeFileSync(getStoragePath(), JSON.stringify(models, null, 2))
}

export function getAllModels(): Model[] {
  return loadModelsFile()
}

export function initializeDefaultModels(): void {
  const models = loadModelsFile()

  if (models.length > 0) return

  const defaults: Model[] = [
    {
      id:         'google/gemini-3-flash-preview',
      name:       'Gemini 3 Flash',
      providerId: 'openrouter-default',
      isActive:   true
    },
    {
      id:         'google/gemini-3.1-flash-lite-preview',
      name:       'Gemini 3.1 Flash Lite',
      providerId: 'openrouter-default',
      isActive:   true
    },
    {
      id:         'google/gemini-3.5-flash',
      name:       'Gemini 3.5 Flash',
      providerId: 'openrouter-default',
      isActive:   true
    },
    {
      id:         'google/gemini-2.5-flash',
      name:       'Gemini 2.5 Flash',
      providerId: 'openrouter-default',
      isActive:   true
    }
  ]

  saveModelsFile(defaults)
}
