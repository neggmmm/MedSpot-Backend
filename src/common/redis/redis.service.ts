import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password') || undefined,
      // Retry with exponential backoff, max 2s between retries
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err.message));
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  /** Read a cached value. Returns null on miss. */
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /** Write a value with a TTL in seconds. */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  /** Delete one or more exact keys. */
  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) await this.client.del(...keys);
  }

  /**
   * Delete all keys matching a glob pattern (e.g. `products:list:*`).
   * Uses SCAN so it never blocks the Redis server.
   */
  async delPattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (batch: string[]) => keys.push(...batch));
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
