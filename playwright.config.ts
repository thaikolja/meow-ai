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

import { defineConfig, devices } from '@playwright/test'

import { E2E_HOUSE_SECRET } from './test/e2e/house-secret'

/**
 * Copies the current environment and forces the fixture house secret.
 * Nuxt does not overwrite variables that are already set, so `.env` cannot replace this password.
 *
 * @returns Environment for the Playwright dev server.
 */
function e2eServerEnv(): Record<string, string> {
  const env: Record<string, string> = {}

  for (const [ key, value ] of Object.entries(process.env)) {
    if (typeof value === 'string') {
      env[key] = value
    }
  }

  env['NUXT_APP_PASSWORD']   = E2E_HOUSE_SECRET
  env['NUXT_SESSION_SECRET'] = E2E_HOUSE_SECRET
  env['NUXT_BUILD_DIR']      = '.nuxt-e2e'
  env['HOST']                = '127.0.0.1'
  env['PORT']                = '4173'

  return env
}

/**
 * Browser tests against a Nuxt dev server on port 4173.
 * `NUXT_BUILD_DIR` keeps that server out of the `.nuxt` directory a local `bun run dev` is using.
 */
export default defineConfig({
  testDir:       './test/e2e',
  timeout:       90_000,
  expect:        { timeout: 20_000 },
  fullyParallel: false,
  workers:       1,
  retries:       0,
  reporter:      'list',
  use:           {
    baseURL: 'http://127.0.0.1:4173',
    trace:   'retain-on-failure'
  },
  projects:      [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-chrome',
      use:  { ...devices['Pixel 5'] }
    }
  ],
  webServer:     {
    command:             'mkdir -p /tmp/meow-sockets && TMPDIR=/tmp/meow-sockets bunx nuxt dev --port 4173 --host 127.0.0.1',
    url:                 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout:             180_000,
    env:                 e2eServerEnv()
  }
})
