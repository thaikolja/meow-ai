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
 * Server-side endpoint to list available models from .data/models.json.
 * Seeds the default catalog when the file is empty or missing.
 */

import { getAllModels, initializeDefaultModels } from '../../utils/modelsStorage'

export default defineEventHandler((event) => {
  initializeDefaultModels()
  const models = getAllModels()
  return { models }
})
