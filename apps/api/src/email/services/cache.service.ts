import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private redis: Redis;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  onModuleInit() {
    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });
    this.redis.on('error', (err) => {
      this.logger.error('Redis error:', err);
    });
  }

  /**
   * Cache email metadata
   */
  async cacheEmail(accountId: string, folder: string, email: any): Promise<void> {
    const key = `email:${accountId}:${folder}:${email.messageId}`;
    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(email));
  }

  /**
   * Get cached email
   */
  async getCachedEmail(accountId: string, folder: string, messageId: string): Promise<any | null> {
    const key = `email:${accountId}:${folder}:${messageId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache email list
   */
  async cacheEmailList(
    accountId: string,
    folder: string,
    emails: any[],
    offset = 0
  ): Promise<void> {
    const key = `emails:${accountId}:${folder}:${offset}`;
    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(emails));
  }

  /**
   * Get cached email list
   */
  async getCachedEmailList(accountId: string, folder: string, offset = 0): Promise<any[] | null> {
    const key = `emails:${accountId}:${folder}:${offset}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache threads
   */
  async cacheThreads(accountId: string, threads: any[]): Promise<void> {
    const key = `threads:${accountId}`;
    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(threads));
  }

  /**
   * Get cached threads
   */
  async getCachedThreads(accountId: string): Promise<any[] | null> {
    const key = `threads:${accountId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate cache for account
   */
  async invalidateAccountCache(accountId: string): Promise<void> {
    const pattern = `*:${accountId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Cache AI result
   */
  async cacheAIResult(key: string, result: any, ttl = 86400): Promise<void> {
    await this.redis.setex(`ai:${key}`, ttl, JSON.stringify(result));
  }

  /**
   * Get cached AI result
   */
  async getCachedAIResult(key: string): Promise<any | null> {
    const cached = await this.redis.get(`ai:${key}`);
    return cached ? JSON.parse(cached) : null;
  }
}
