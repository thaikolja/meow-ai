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

declare module 'bun:test' {
  export const describe: any
  export const expect: any
  export const test: any
}

declare module 'node:fs/promises' {
  export const readdir: any
  export const readFile: any
}

declare module 'node:path' {
  export const extname: any
  export const join: any
}

declare module 'node:url' {
  export const fileURLToPath: any
}

