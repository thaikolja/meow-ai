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

/**
 * Rate limiting utility with Redis support and in-memory fallback.
 * Uses Redis when NUXT_REDIS_URL is configured, otherwise falls back to in-memory storage.
 */

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

// In-memory fallback storage
const memoryStore = new Map<string, RateLimitEntry>()

// Redis connection (lazy-loaded)
let redisClient: {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, mode: string, duration: number) => Promise<unknown>
  del: (key: string) => Promise<unknown>
} | null = null

async function getRedisClient() {
  if (redisClient!==null) return redisClient

  const redisUrl = process.env['NUXT_REDIS_URL']
  if (!redisUrl) return null

  try {
    // Dynamic import to avoid bundling Redis when not needed
    // @ts-expect-error - redis is an optional dependency
    const { createClient } = await import('redis')
    const client = createClient({ url: redisUrl })

    client.on('error', (err: Error) => {
      console.error('Redis client error:', err)
      redisClient = null
    })

    await client.connect()
    redisClient = client
    return redisClient
  } catch (error) {
    console.warn('Failed to connect to Redis, falling back to in-memory rate limiting:', error)
    return null
  }
}

/**
 * Check rate limit for a given key.
 * Returns whether the request is allowed and remaining quota.
 */
export async function checkRateLimit(
    key: string,
    maxAttempts: number,
    windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const resetAt = now + windowMs

  // Try Redis first
  const redis = await getRedisClient()

  if (redis) {
    try {
      const stored = await redis.get(key)
      let entry: RateLimitEntry

      if (stored) {
        entry = JSON.parse(stored)
        if (entry.resetAt <= now) {
          // Window expired, reset
          entry = { count: 0, resetAt }
        }
      } else {
        entry = { count: 0, resetAt }
      }

      const remaining = Math.max(0, maxAttempts - entry.count)

      if (entry.count >= maxAttempts) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt }
      }

      // Increment and store
      entry.count += 1
      await redis.set(key, JSON.stringify(entry), 'PX', windowMs)

      return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.resetAt }
    } catch (error) {
      console.warn('Redis rate limit error, falling back to memory:', error)
      // Fall through to memory implementation
    }
  }

  // In-memory fallback
  const existing = memoryStore.get(key)

  if (existing && existing.resetAt > now) {
    const remaining = Math.max(0, maxAttempts - existing.count)

    if (existing.count >= maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt }
    }

    existing.count += 1
    return { allowed: true, remaining: maxAttempts - existing.count, resetAt: existing.resetAt }
  }

  // New entry
  const newEntry: RateLimitEntry = { count: 1, resetAt }
  memoryStore.set(key, newEntry)

  // Cleanup old entries periodically (every 100 checks)
  if (memoryStore.size > 100 && Math.random() < 0.01) {
    for (const [ k, v ] of memoryStore) {
      if (v.resetAt <= now) {
        memoryStore.delete(k)
      }
    }
  }

  return { allowed: true, remaining: maxAttempts - 1, resetAt }
}

/**
 * Reset rate limit for a given key (e.g., after successful login).
 */
export async function resetRateLimit(key: string): Promise<void> {
  const redis = await getRedisClient()

  if (redis) {
    try {
      await redis.del(key)
      return
    } catch (error) {
      console.warn('Redis reset error:', error)
    }
  }

  memoryStore.delete(key)
}
