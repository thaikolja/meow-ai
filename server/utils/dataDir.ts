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
