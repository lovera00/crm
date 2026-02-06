import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createAuthenticatedRouteHandler, getCurrentUser, requireCurrentUser, withGestor, withSupervisor, withAdministrador } from './auth-middleware';
import { AppError } from '../../domain/errors/app-error';
import { AuthenticatedUser } from './types';

// Mock the auth-utils module
vi.mock('./auth-utils', () => ({
  getAuthenticatedUserFromHeaders: vi.fn(),
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
  requireResourceAccess: vi.fn(),
}));

// Mock the error handler and rate limiter
vi.mock('../middleware/with-error-handler', () => ({
  withErrorHandler: vi.fn((handler) => handler),
}));

vi.mock('../middleware/rate-limiter', () => ({
  withRateLimit: vi.fn((handler) => handler),
}));

import { getAuthenticatedUserFromHeaders } from './auth-utils';

describe('Auth Middleware', () => {
  let mockRequest: NextRequest;
  let mockHandler: any;
  let mockUser: AuthenticatedUser;

  beforeEach(() => {
    mockRequest = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost:3000/api/test'),
    } as NextRequest;

    mockHandler = vi.fn().mockResolvedValue(new NextResponse('OK', { status: 200 }));
    
    mockUser = {
      id: '123',
      role: 'gestor',
    };

    vi.clearAllMocks();
  });

  describe('withAuth', () => {
    it('should allow access when user is authenticated and no requirements', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser);

      const wrappedHandler = withAuth(mockHandler);
      await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockUser);
    });

    it('should throw when authentication is required but user is not authenticated', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(null);

      const wrappedHandler = withAuth(mockHandler, { requireAuth: true });
      
      await expect(wrappedHandler(mockRequest)).rejects.toThrow(AppError);
      await expect(wrappedHandler(mockRequest)).rejects.toThrow('Authentication required');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow access when authentication is not required and user is not authenticated', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(null);

      const wrappedHandler = withAuth(mockHandler, { requireAuth: false });
      await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, null);
    });

    it('should check required roles when specified', async () => {
      const supervisorUser = { id: '456', role: 'supervisor' as const };
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(supervisorUser);

      // Supervisor should have access to gestor routes (higher role)
      const wrappedHandler = withAuth(mockHandler, { requiredRoles: ['gestor'] });
      await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, supervisorUser);
    });

    it('should deny access when user lacks required role', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser); // gestor

      const wrappedHandler = withAuth(mockHandler, { requiredRoles: ['supervisor'] });
      
      await expect(wrappedHandler(mockRequest)).rejects.toThrow(AppError);
      await expect(wrappedHandler(mockRequest)).rejects.toThrow('Insufficient permissions');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow administrador access to any role requirement', async () => {
      const adminUser = { id: '789', role: 'administrador' as const };
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(adminUser);

      const wrappedHandler = withAuth(mockHandler, { requiredRoles: ['gestor'] });
      await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, adminUser);
    });

    it('should call custom authorize function when provided', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser);
      const authorize = vi.fn().mockReturnValue(true);

      const wrappedHandler = withAuth(mockHandler, { authorize });
      await wrappedHandler(mockRequest);

      expect(authorize).toHaveBeenCalledWith(mockUser, mockRequest);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockUser);
    });

    it('should deny access when custom authorize function returns false', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser);
      const authorize = vi.fn().mockReturnValue(false);

      const wrappedHandler = withAuth(mockHandler, { authorize });
      
      await expect(wrappedHandler(mockRequest)).rejects.toThrow(AppError);
      await expect(wrappedHandler(mockRequest)).rejects.toThrow('Access denied');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should check resource-level authorization when getResourceOwnerId is provided', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser);
      const getResourceOwnerId = vi.fn().mockReturnValue('123'); // Same as user ID

      const wrappedHandler = withAuth(mockHandler, { getResourceOwnerId });
      await wrappedHandler(mockRequest);

      expect(getResourceOwnerId).toHaveBeenCalledWith(mockRequest);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockUser);
    });

    it('should deny access when gestor tries to access other user resource', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser); // gestor with id '123'
      const getResourceOwnerId = vi.fn().mockReturnValue('456'); // Different user ID

      const wrappedHandler = withAuth(mockHandler, { getResourceOwnerId });
      
      await expect(wrappedHandler(mockRequest)).rejects.toThrow(AppError);
      await expect(wrappedHandler(mockRequest)).rejects.toThrow('Access denied to resource');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow administrador access to any resource', async () => {
      const adminUser = { id: '789', role: 'administrador' as const };
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(adminUser);
      const getResourceOwnerId = vi.fn().mockReturnValue('999'); // Different user ID

      const wrappedHandler = withAuth(mockHandler, { getResourceOwnerId });
      await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, adminUser);
    });

    it('should allow supervisor access to any resource (temporary)', async () => {
      const supervisorUser = { id: '456', role: 'supervisor' as const };
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(supervisorUser);
      const getResourceOwnerId = vi.fn().mockReturnValue('999'); // Different user ID

      const wrappedHandler = withAuth(mockHandler, { getResourceOwnerId });
      await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, supervisorUser);
    });
  });

  describe('createAuthenticatedRouteHandler', () => {
    it('should wrap handler with auth and error handling', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser);
      
      const handler = vi.fn().mockResolvedValue(new NextResponse('OK'));
      const wrapped = createAuthenticatedRouteHandler(handler);
      
      await wrapped(mockRequest);
      
      expect(handler).toHaveBeenCalledWith(mockRequest, mockUser);
    });

    it('should include rate limiting when options provided', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser);
      
      const handler = vi.fn().mockResolvedValue(new NextResponse('OK'));
      const wrapped = createAuthenticatedRouteHandler(handler, {}, {
        windowMs: 60000,
        maxRequests: 10,
      });
      
      await wrapped(mockRequest);
      
      // Rate limiter mock should have been called
      const { withRateLimit } = await import('../middleware/rate-limiter');
      expect(vi.mocked(withRateLimit)).toHaveBeenCalled();
    });
  });

  describe('role-specific helpers', () => {
    it('withGestor should require gestor role', async () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser);
      
      const handler = vi.fn().mockResolvedValue(new NextResponse('OK'));
      const wrapped = withGestor(handler);
      
      await wrapped(mockRequest);
      expect(handler).toHaveBeenCalledWith(mockRequest, mockUser);
    });

    it('withSupervisor should require supervisor role', async () => {
      const supervisorUser = { id: '456', role: 'supervisor' as const };
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(supervisorUser);
      
      const handler = vi.fn().mockResolvedValue(new NextResponse('OK'));
      const wrapped = withSupervisor(handler);
      
      await wrapped(mockRequest);
      expect(handler).toHaveBeenCalledWith(mockRequest, supervisorUser);
    });

    it('withAdministrador should require administrador role', async () => {
      const adminUser = { id: '789', role: 'administrador' as const };
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(adminUser);
      
      const handler = vi.fn().mockResolvedValue(new NextResponse('OK'));
      const wrapped = withAdministrador(handler);
      
      await wrapped(mockRequest);
      expect(handler).toHaveBeenCalledWith(mockRequest, adminUser);
    });
  });

  describe('getCurrentUser and requireCurrentUser', () => {
    it('getCurrentUser should return user from headers', () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser);
      
      const result = getCurrentUser(mockRequest);
      expect(result).toEqual(mockUser);
      expect(getAuthenticatedUserFromHeaders).toHaveBeenCalledWith(mockRequest.headers);
    });

    it('getCurrentUser should return null when not authenticated', () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(null);
      
      const result = getCurrentUser(mockRequest);
      expect(result).toBeNull();
    });

    it('requireCurrentUser should return user when authenticated', () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(mockUser);
      
      const result = requireCurrentUser(mockRequest);
      expect(result).toEqual(mockUser);
    });

    it('requireCurrentUser should throw when not authenticated', () => {
      vi.mocked(getAuthenticatedUserFromHeaders).mockReturnValue(null);
      
      expect(() => requireCurrentUser(mockRequest)).toThrow(AppError);
      expect(() => requireCurrentUser(mockRequest)).toThrow('Authentication required');
    });
  });
});