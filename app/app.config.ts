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
 * Application-wide UI configuration for Nuxt UI.
 * Defines the primary and neutral color palettes used throughout the app.
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'purple', // Main brand color for accents and highlights
      neutral: 'zinc'    // Base neutral color for backgrounds and text
    }
  }
})
