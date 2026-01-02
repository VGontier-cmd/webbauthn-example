/**
 * Redis service for storing WebAuthn challenges
 *
 * Uses Redis with TTL (Time To Live) for automatic expiration.
 * This is the recommended approach for production as it:
 * - Automatically expires challenges (no cleanup job needed)
 * - Is faster than database (in-memory)
 * - Scales horizontally
 * - Survives server restarts (with persistence)
 *
 * @module redis/redis.service
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor() {
    // Get Redis URL from environment or use default
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => {
        // Retry with exponential backoff
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Handle connection errors
    this.client.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }

  /**
   * Initialize Redis connection
   * Tests the connection on module initialization
   */
  async onModuleInit() {
    try {
      await this.client.ping();
      console.log("✅ Redis connected successfully");
    } catch (error) {
      console.error("❌ Redis connection failed:", error);
      throw error;
    }
  }

  /**
   * Cleanup: Close Redis connection on module destruction
   */
  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Store a challenge with automatic expiration (TTL)
   *
   * @param key - Challenge key (e.g., "reg-{userId}" or "auth-email-{email}")
   * @param challenge - The challenge string to store
   * @param ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
   *
   * Redis automatically deletes the key after TTL expires.
   * No manual cleanup needed!
   */
  async setChallenge(
    key: string,
    challenge: string,
    ttlSeconds: number = 300
  ): Promise<void> {
    // SETEX = SET with EXpiration
    // Automatically deletes after ttlSeconds
    await this.client.setex(key, ttlSeconds, challenge);
  }

  /**
   * Retrieve a challenge from Redis
   *
   * @param key - Challenge key
   * @returns The challenge string or null if not found/expired
   */
  async getChallenge(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Delete a challenge immediately (one-time use)
   *
   * Called after successful verification to prevent replay attacks.
   *
   * @param key - Challenge key to delete
   */
  async deleteChallenge(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if a challenge exists
   *
   * @param key - Challenge key
   * @returns true if challenge exists and hasn't expired
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Get remaining TTL for a challenge
   *
   * @param key - Challenge key
   * @returns Remaining seconds until expiration, or -1 if key doesn't exist
   */
  async getTTL(key: string): Promise<number> {
    return await this.client.ttl(key);
  }
}
