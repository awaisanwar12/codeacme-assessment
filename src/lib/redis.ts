// src/lib/redis.ts
// Redis client wrapper for caching and rate limiting
import { Redis } from '@upstash/redis';

// Singleton pattern for Redis client
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!upstashUrl || !upstashToken) {
    console.warn('Redis not configured. UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required.');
    return null;
  }
  
  redisClient = new Redis({
    url: upstashUrl,
    token: upstashToken,
  });
  
  return redisClient;
}

// Cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 300): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis DELETE error:', error);
    return false;
  }
}

export async function cacheInvalidate(pattern: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Redis invalidate error:', error);
    return false;
  }
}

// Rate limiting
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowSeconds: number = 3600
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedisClient();
  
  // If Redis is unavailable, always allow the request
  if (!redis) {
    return { 
      allowed: true, 
      remaining: maxRequests - 1, 
      resetAt: Date.now() + windowSeconds * 1000 
    };
  }
  
  const key = `rate-limit:${identifier}`;
  
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    const ttl = await redis.ttl(key);
    const resetAt = Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000;
    const remaining = Math.max(0, maxRequests - current);
    
    return {
      allowed: current <= maxRequests,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - always allow request if rate limiting fails
    return { 
      allowed: true, 
      remaining: maxRequests - 1, 
      resetAt: Date.now() + windowSeconds * 1000 
    };
  }
}
