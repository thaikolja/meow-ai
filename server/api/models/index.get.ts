/*
 * Copyright (C) 2026 Kolja Nolte
 * https://meow.yanawa.io
 * info@meow.yanawa.io
 *
 * This work is licensed under the MIT License. You are free to use, modify,
 * and distribute this work, provided that you include the copyright notice
 * and this permission notice in all copies or substantial portions of the work.
 * For more information, visit https://opensource.org/licenses/MIT
 *
 * @author    Kolja Nolte
 * @email     kolja.nolte@gmail.com
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

/**
 * Server-side endpoint to list available models from .data/models.json.
 * Returns models with their human-readable names and provider associations.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ensureDataDir }            from '../../utils/dataDir'

export type StoredModel = {
  id: string
  name: string
  providerId: string
  isActive: boolean
}

function getModelsPath(event?: Parameters<typeof useRuntimeConfig>[0]): string {
  const runtimeConfig = useRuntimeConfig(event)
  const dataDir       = ensureDataDir(runtimeConfig.dataDir || process.env['NUXT_DATA_DIR'])
  return join(dataDir, 'models.json')
}

function loadModelsFile(event?: Parameters<typeof useRuntimeConfig>[0]): StoredModel[] {
  const filePath = getModelsPath(event)
  if (!existsSync(filePath)) {
    return []
  }
  try {
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

export default defineEventHandler((event) => {
  const models = loadModelsFile(event)
  return { models }
})
