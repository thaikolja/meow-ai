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
 * Resolves the file-backed data directory and creates it when it is missing.
 * A blank override falls back to `<cwd>/.data`.
 */

import { existsSync, mkdirSync } from 'node:fs'
import { join }                  from 'node:path'

/**
 * Returns the trimmed override, or `join(cwd, '.data')` when the override is missing or blank.
 *
 * @param configuredDataDir - Optional directory, such as the `NUXT_DATA_DIR` value.
 * @param cwd - Base directory used for the default. Defaults to `process.cwd()`.
 * @returns The path. This function does not create it.
 */
export function resolveDataDirPath(configuredDataDir?: string, cwd = process.cwd()): string {
  return configuredDataDir?.trim() || join(cwd, '.data')
}

/**
 * Creates the resolved data directory, including parents, when it does not exist.
 *
 * @param configuredDataDir - Optional override passed to `resolveDataDirPath`.
 * @returns The resolved directory path.
 */
export function ensureDataDir(configuredDataDir?: string): string {
  const dataDir = resolveDataDirPath(configuredDataDir)

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  return dataDir
}
