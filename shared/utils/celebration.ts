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
 * Decides when the celebration overlay may mount.
 * The sequence starts at zero and rises only after a successful login.
 */

/**
 * Confetti is visible only after at least one successful login in this page load.
 *
 * @param sequence - `celebrationSequence` from `useCelebration()`. Zero means no successful login yet.
 * @returns Whether `ConfettiRain` should mount.
 */
export function shouldShowConfetti(sequence: number): boolean {
  return sequence > 0
}
