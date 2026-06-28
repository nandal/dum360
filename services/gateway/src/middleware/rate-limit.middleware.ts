import { Injectable, type NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter.
 * Registration endpoint: 1 req/sec per IP.
 * All other endpoints: 100 req/sec per IP (effectively unbounded for MVP).
 *
 * Post-MVP: replace with Redis-based rate limiter or API Gateway plugin.
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly store = new Map<string, RateLimitEntry>();

  // Cleanup expired entries every 60 seconds
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    const ip = req.ip ?? 'unknown';
    const key = `${ip}:${req.path}`;

    // Registration: strict limit
    const maxRequests = req.path === '/register' ? 1 : 100;
    const windowMs = req.path === '/register' ? 1000 : 1000;

    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      this.store.set(key, entry);
    }

    entry.count++;

    if (entry.count > maxRequests) {
      throw new HttpException(
        { error: 'Too Many Requests', retryAfter: Math.ceil((entry.resetAt - now) / 1000) },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) this.store.delete(key);
    }
  }

  /** Called on app shutdown — clear interval */
  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
