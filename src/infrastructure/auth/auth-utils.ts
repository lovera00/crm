import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AuthenticatedUser, UserRole } from './types';
import { AppError } from '../../domain/errors/app-error';

/**
 * Get authenticated user from request headers (set by middleware)
 * This should be used in API route handlers
 */
export function getAuthenticatedUserFromHeaders(headers: Headers): AuthenticatedUser | null {
  const userId = headers.get('x-user-id');
  const userRole = headers.get('x-user-role') as UserRole;

  if (!userId || !userRole) {
    return null;
  }

  // Validate role
  if (!['gestor', 'supervisor', 'administrador'].includes(userRole)) {
    return null;
  }

  return {
    id: userId,
    role: userRole,
  };
}

/**
 * Require authentication - throws error if user is not authenticated
 */
export function requireAuth(headers: Headers): AuthenticatedUser {
  const user = getAuthenticatedUserFromHeaders(headers);
  if (!user) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  return user;
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, requiredRole: UserRole): boolean {
  // Role hierarchy: administrador > supervisor > gestor
  const roleHierarchy: Record<UserRole, number> = {
    gestor: 1,
    supervisor: 2,
    administrador: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Require specific role - throws error if user doesn't have required role
 */
export function requireRole(user: AuthenticatedUser, requiredRole: UserRole): void {
  if (!hasRole(user, requiredRole)) {
    throw new AppError(
      `Insufficient permissions. Required role: ${requiredRole}`,
      403,
      'INSUFFICIENT_PERMISSIONS'
    );
  }
}

/**
 * Check if user is allowed to access resource based on ownership
 * Gestor can only access resources they own (assigned to them)
 * Supervisor can access resources of gestores they supervise
 * Administrador can access all resources
 */
export function canAccessResource(
  user: AuthenticatedUser,
  resourceOwnerId?: string | number
): boolean {
  if (user.role === 'administrador') {
    return true;
  }

  if (!resourceOwnerId) {
    // If no owner specified, allow access
    return true;
  }

  const ownerId = typeof resourceOwnerId === 'number' ? resourceOwnerId.toString() : resourceOwnerId;

  if (user.role === 'supervisor') {
    // In a real implementation, supervisors would have a list of gestores they supervise
    // For now, allow access to any resource (to be implemented with proper relationships)
    return true;
  }

  // gestor can only access their own resources
  return user.id === ownerId;
}

/**
 * Require resource access - throws error if user cannot access resource
 */
export function requireResourceAccess(
  user: AuthenticatedUser,
  resourceOwnerId?: string | number
): void {
  if (!canAccessResource(user, resourceOwnerId)) {
    throw new AppError(
      'Access denied to resource',
      403,
      'RESOURCE_ACCESS_DENIED'
    );
  }
}

/**
 * Get token from request (for use in server components or API routes without middleware)
 */
export async function getTokenFromRequest(request: NextRequest) {
  return getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
}

/**
 * Create mock authenticated user for testing
 */
export function createMockUser(role: UserRole = 'gestor', id: string = '1'): AuthenticatedUser {
  return {
    id,
    role,
    email: `${role}@example.com`,
    name: `Mock ${role}`,
  };
}