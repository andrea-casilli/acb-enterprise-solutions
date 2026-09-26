import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiError } from './errors.js';
import { config } from './config.js';

const validRequestId = /^[A-Za-z0-9._-]{8,128}$/;

export const requestContext: RequestHandler = (request, response, next) => {
  const suppliedId = request.header('x-request-id')?.trim();
  request.requestId = suppliedId && validRequestId.test(suppliedId) ? suppliedId : randomUUID();
  response.setHeader('X-Request-ID', request.requestId);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

  if (config.isProduction) {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

export const noStore: RequestHandler = (_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  next();
};

type RateLimitOptions = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export function rateLimit({ key, maxRequests, windowMs }: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, RateLimitBucket>();
  let lastCleanupAt = Date.now();

  return (request: Request, response: Response, next: NextFunction) => {
    if (request.method === 'OPTIONS') return next();

    const now = Date.now();
    if (now - lastCleanupAt > windowMs) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
      }
      lastCleanupAt = now;
    }

    const bucketKey = `${key}:${request.ip}`;
    const existing = buckets.get(bucketKey);
    const bucket = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;

    bucket.count += 1;
    buckets.set(bucketKey, bucket);

    const remaining = Math.max(0, maxRequests - bucket.count);
    response.setHeader('RateLimit-Limit', maxRequests);
    response.setHeader('RateLimit-Remaining', remaining);
    response.setHeader('RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > maxRequests) {
      response.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return next(new ApiError(429, 'Troppe richieste: riprova più tardi', 'RATE_LIMITED'));
    }

    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
