import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { AppError, handleError, ValidationError } from '../../domain/errors/app-error';
import { createLogger } from '../logging/logger';
import { z } from 'zod';
import { withRateLimit } from './rate-limiter';

type NextRouteHandler = (
  request: NextRequest,
  ...args: any[]
) => Promise<Response> | Response;

export function withErrorHandler(handler: NextRouteHandler) {
  return async (request: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    const requestId = request.headers.get('x-request-id') || randomUUID();
    
    const requestLogger = createLogger({
      requestId,
      method: request.method,
      url: request.url,
      pathname: request.nextUrl.pathname,
    });

    try {
      requestLogger.info('Request started');
      
      // Add logger to request context for use in handlers
      // @ts-ignore
      request.logger = requestLogger;
      
      const response = await handler(request, ...args);
      
      const duration = Date.now() - startTime;
      requestLogger.info({ 
        duration,
        status: response.status,
        statusText: response.statusText,
      }, 'Request completed');
      
      // Add request ID to response headers
      response.headers.set('x-request-id', requestId);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const appError = handleError(error);
      
      requestLogger.error({
        duration,
        error: appError,
        statusCode: appError.statusCode,
        stack: error instanceof Error ? error.stack : undefined,
      }, 'Request failed');
      
      return NextResponse.json(
        appError.toJSON(),
        { status: appError.statusCode }
      );
    }
  };
}

// Utility to create route handlers with error handling
export function createRouteHandler(handler: NextRouteHandler) {
  return withErrorHandler(handler);
}

// Utility to create route handlers with error handling AND rate limiting
export function createProtectedRouteHandler(
  handler: NextRouteHandler,
  rateLimitOptions?: Parameters<typeof withRateLimit>[1]
) {
  return withErrorHandler(withRateLimit(handler, rateLimitOptions));
}



// Validation helper for request body
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request body', error.issues);
    }
    throw new AppError('Invalid request body', 400, 'INVALID_REQUEST_BODY', error);
  }
}