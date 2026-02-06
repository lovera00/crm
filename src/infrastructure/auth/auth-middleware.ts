import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromHeaders, requireAuth, requireRole, requireResourceAccess } from './auth-utils';
import { AuthenticatedUser, UserRole } from './types';
import { AppError } from '../../domain/errors/app-error';

export type AuthOptions = {
  /**
   * Whether authentication is required (default: true)
   */
  requireAuth?: boolean;
  
  /**
   * Required role(s) for access
   */
  requiredRoles?: UserRole[];
  
  /**
   * Custom authorization function
   */
  authorize?: (user: AuthenticatedUser, request: NextRequest) => boolean | Promise<boolean>;
  
  /**
   * Function to extract resource owner ID from request
   * Used for resource-level authorization
   */
  getResourceOwnerId?: (request: NextRequest) => string | number | undefined | Promise<string | number | undefined>;
};

/**
 * Authentication middleware for API route handlers
 * Validates user authentication and authorization
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<Response> | Response,
  options: AuthOptions = {}
) {
  return async function (request: NextRequest, ...args: any[]) {
    const { requireAuth: requireAuthOption = true, requiredRoles = [], authorize, getResourceOwnerId } = options;

    // Get authenticated user from headers (set by Next.js middleware)
    const headers = request.headers;
    const user = getAuthenticatedUserFromHeaders(headers);

    if (requireAuthOption && !user) {
      throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
    }

    // If user is authenticated, perform authorization checks
    if (user) {
      // Check required roles
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => {
          // Role hierarchy check (administrador > supervisor > gestor)
          const roleHierarchy: Record<UserRole, number> = {
            gestor: 1,
            supervisor: 2,
            administrador: 3,
          };
          return roleHierarchy[user.role] >= roleHierarchy[role];
        });

        if (!hasRequiredRole) {
          throw new AppError(
            `Insufficient permissions. Required one of: ${requiredRoles.join(', ')}`,
            403,
            'INSUFFICIENT_PERMISSIONS'
          );
        }
      }

      // Check custom authorization function
      if (authorize) {
        const isAuthorized = await authorize(user, request);
        if (!isAuthorized) {
          throw new AppError('Access denied', 403, 'FORBIDDEN');
        }
      }

      // Check resource-level authorization
      if (getResourceOwnerId) {
        const resourceOwnerId = await getResourceOwnerId(request);
        if (resourceOwnerId !== undefined) {
          // Check if user can access this resource
          const canAccess = await (async () => {
            if (user.role === 'administrador') return true;
            if (user.role === 'supervisor') return true; // TODO: Implement supervisor-specific logic
            
            // gestor can only access own resources
            const ownerId = typeof resourceOwnerId === 'number' 
              ? resourceOwnerId.toString() 
              : resourceOwnerId;
            return user.id === ownerId;
          })();

          if (!canAccess) {
            throw new AppError('Access denied to resource', 403, 'RESOURCE_ACCESS_DENIED');
          }
        }
      }
    }

    // Call handler with authenticated user
    return handler(request, user!, ...args);
  };
}

import { withErrorHandler } from '../middleware/with-error-handler';
import { withRateLimit } from '../middleware/rate-limiter';

/**
 * Create authenticated route handler with error handling
 * Combines authentication with existing error handling middleware
 */
export function createAuthenticatedRouteHandler(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<Response> | Response,
  authOptions?: AuthOptions,
  rateLimitOptions?: Parameters<typeof withRateLimit>[1]
) {
  let wrappedHandler = withAuth(handler, authOptions);
  
  if (rateLimitOptions) {
    wrappedHandler = withRateLimit(wrappedHandler, rateLimitOptions);
  }
  
  return withErrorHandler(wrappedHandler);
}

/**
 * Helper to create route handlers with specific role requirements
 */
export const withGestor = (handler: Parameters<typeof withAuth>[0]) => 
  withAuth(handler, { requiredRoles: ['gestor'] });

export const withSupervisor = (handler: Parameters<typeof withAuth>[0]) => 
  withAuth(handler, { requiredRoles: ['supervisor'] });

export const withAdministrador = (handler: Parameters<typeof withAuth>[0]) => 
  withAuth(handler, { requiredRoles: ['administrador'] });

/**
 * Get current user from request (for use in API routes)
 */
export function getCurrentUser(request: NextRequest): AuthenticatedUser | null {
  return getAuthenticatedUserFromHeaders(request.headers);
}

/**
 * Require current user (throws if not authenticated)
 */
export function requireCurrentUser(request: NextRequest): AuthenticatedUser {
  const user = getCurrentUser(request);
  if (!user) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  return user;
}