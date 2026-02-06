import { NextRequest, NextResponse } from 'next/server';
import { config } from '../../config';

// In-memory store for rate limiting
// In production, use Redis or another distributed store
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple rate limiter middleware
 * Limits requests per IP address
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response> | Response,
  options?: {
    windowMs?: number;
    maxRequests?: number;
    skip?: (request: NextRequest) => boolean;
  }
) {
  const windowMs = options?.windowMs ?? config.API_RATE_LIMIT_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? config.API_RATE_LIMIT_MAX_REQUESTS;

  return async function (request: NextRequest, ...args: any[]) {
    // Skip rate limiting for certain conditions
    if (options?.skip?.(request)) {
      return handler(request, ...args);
    }

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const now = Date.now();
    const key = `rate-limit:${ip}`;
    
    let entry = rateLimitStore.get(key);
    
    // Clean up old entries
    if (entry && entry.resetTime <= now) {
      rateLimitStore.delete(key);
      entry = undefined;
    }
    
    // Create new entry if none exists
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }
    
    // Check if rate limit exceeded
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      );
    }
    
    // Increment count
    entry.count++;
    
    // Add rate limit headers to response
    const response = await handler(request, ...args);
    
    if (response instanceof NextResponse || response instanceof Response) {
      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit', maxRequests.toString());
      headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
      headers.set('X-RateLimit-Reset', entry.resetTime.toString());
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    
    return response;
  };
}

/**
 * Combine rate limiting with error handling
 */
export function createRateLimitedRouteHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response> | Response,
  options?: Parameters<typeof withRateLimit>[1]
) {
  return withRateLimit(handler, options);
}