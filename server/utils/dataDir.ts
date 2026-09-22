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

import { existsSync, mkdirSync } from 'node:fs'
import { join }                  from 'node:path'

export function resolveDataDirPath(configuredDataDir?: string, cwd = process.cwd()): string {
  return configuredDataDir?.trim() || join(cwd, '.data')
}

export function ensureDataDir(configuredDataDir?: string): string {
  const dataDir = resolveDataDirPath(configuredDataDir)

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  return dataDir
}
