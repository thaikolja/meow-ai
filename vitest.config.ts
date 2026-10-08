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

import { defineConfig }        from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

/**
 * Vitest projects. Unit tests stay in Node. Component tests use the Nuxt environment.
 * Bun tests stay in `tests/` and are not part of this run.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name:        'unit',
          include:     [ 'test/unit/**/*.{test,spec}.ts' ],
          environment: 'node'
        }
      },
      await defineVitestProject({
        test: {
          name:        'nuxt',
          include:     [ 'test/nuxt/**/*.{test,spec}.ts' ],
          environment: 'nuxt'
        }
      })
    ]
  }
})
