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

import { expect, test } from '@playwright/test'

import { E2E_HOUSE_SECRET } from './house-secret'

/**
 * Confetti is absent on the gate and after a rejected secret, and present after the flap opens.
 */
test('confetti plays only after a successful login', async ({ page }) => {
  await page.goto('/')
  const openFlap = page.getByRole('button', { name: 'Open the cat flap' })
  // This sentence is rendered only after the client has fetched a challenge.
  // Clicking earlier submits the form as a plain GET and reloads the gate.
  const challengeReady = page.getByText(
    'This one-time paw-print expires quickly and is tied to this browser session.'
  )

  async function waitForPawPrint() {
    await expect(challengeReady).toBeVisible()
    await expect(openFlap).toBeEnabled()
  }

  await expect(page.locator('.confetti-piece')).toHaveCount(0)
  await expect(page.getByText('yes', { exact: true })).toHaveCount(0)
  await waitForPawPrint()

  await page.getByPlaceholder('e.g. Captain Whiskers').fill('Whiskers')
  await page.getByPlaceholder('••••••••').fill('wrong-secret')
  await openFlap.click()
  await expect(page.getByText('The house secret did not match that paw-print.')).toBeVisible()
  await expect(page.locator('.confetti-piece')).toHaveCount(0)

  await waitForPawPrint()
  await page.getByPlaceholder('e.g. Captain Whiskers').fill('Whiskers')
  await page.getByPlaceholder('••••••••').fill(E2E_HOUSE_SECRET)
  await openFlap.click()

  await expect(page.getByRole('heading', { name: 'Willkommen, Whiskers!' })).toBeVisible()
  await expect(page.locator('.confetti-piece')).toHaveCount(64)
  await expect(openFlap).toHaveCount(0)
})
