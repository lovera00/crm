import { describe, it, expect, vi } from 'vitest';
import { getAuthenticatedUserFromHeaders, requireAuth, hasRole, requireRole, canAccessResource, requireResourceAccess, createMockUser } from './auth-utils';
import { AppError } from '../../domain/errors/app-error';

describe('Auth Utilities', () => {
  describe('getAuthenticatedUserFromHeaders', () => {
    it('should return null when headers are missing', () => {
      const headers = new Headers();
      const result = getAuthenticatedUserFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should return null when x-user-id is missing', () => {
      const headers = new Headers();
      headers.set('x-user-role', 'gestor');
      const result = getAuthenticatedUserFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should return null when x-user-role is missing', () => {
      const headers = new Headers();
      headers.set('x-user-id', '123');
      const result = getAuthenticatedUserFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should return null when role is invalid', () => {
      const headers = new Headers();
      headers.set('x-user-id', '123');
      headers.set('x-user-role', 'invalid-role');
      const result = getAuthenticatedUserFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should return authenticated user for valid gestor', () => {
      const headers = new Headers();
      headers.set('x-user-id', '123');
      headers.set('x-user-role', 'gestor');
      const result = getAuthenticatedUserFromHeaders(headers);
      expect(result).toEqual({
        id: '123',
        role: 'gestor',
      });
    });

    it('should return authenticated user for valid supervisor', () => {
      const headers = new Headers();
      headers.set('x-user-id', '456');
      headers.set('x-user-role', 'supervisor');
      const result = getAuthenticatedUserFromHeaders(headers);
      expect(result).toEqual({
        id: '456',
        role: 'supervisor',
      });
    });

    it('should return authenticated user for valid administrador', () => {
      const headers = new Headers();
      headers.set('x-user-id', '789');
      headers.set('x-user-role', 'administrador');
      const result = getAuthenticatedUserFromHeaders(headers);
      expect(result).toEqual({
        id: '789',
        role: 'administrador',
      });
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', () => {
      const headers = new Headers();
      headers.set('x-user-id', '123');
      headers.set('x-user-role', 'gestor');
      const result = requireAuth(headers);
      expect(result).toEqual({
        id: '123',
        role: 'gestor',
      });
    });

    it('should throw AppError when not authenticated', () => {
      const headers = new Headers();
      expect(() => requireAuth(headers)).toThrow(AppError);
      expect(() => requireAuth(headers)).toThrow('Authentication required');
    });
  });

  describe('hasRole', () => {
    it('should return true when user has exact role', () => {
      const user = createMockUser('gestor');
      expect(hasRole(user, 'gestor')).toBe(true);
    });

    it('should return true when user has higher role', () => {
      const supervisor = createMockUser('supervisor');
      expect(hasRole(supervisor, 'gestor')).toBe(true);
      
      const administrador = createMockUser('administrador');
      expect(hasRole(administrador, 'gestor')).toBe(true);
      expect(hasRole(administrador, 'supervisor')).toBe(true);
    });

    it('should return false when user has lower role', () => {
      const gestor = createMockUser('gestor');
      expect(hasRole(gestor, 'supervisor')).toBe(false);
      expect(hasRole(gestor, 'administrador')).toBe(false);
      
      const supervisor = createMockUser('supervisor');
      expect(hasRole(supervisor, 'administrador')).toBe(false);
    });
  });

  describe('requireRole', () => {
    it('should not throw when user has required role', () => {
      const user = createMockUser('supervisor');
      expect(() => requireRole(user, 'gestor')).not.toThrow();
      expect(() => requireRole(user, 'supervisor')).not.toThrow();
    });

    it('should throw AppError when user lacks required role', () => {
      const user = createMockUser('gestor');
      expect(() => requireRole(user, 'supervisor')).toThrow(AppError);
      expect(() => requireRole(user, 'supervisor')).toThrow('Insufficient permissions');
      
      expect(() => requireRole(user, 'administrador')).toThrow(AppError);
    });
  });

  describe('canAccessResource', () => {
    it('should allow administrador access to any resource', () => {
      const admin = createMockUser('administrador');
      expect(canAccessResource(admin)).toBe(true);
      expect(canAccessResource(admin, '123')).toBe(true);
      expect(canAccessResource(admin, 456)).toBe(true);
    });

    it('should allow gestor access to own resource', () => {
      const gestor = createMockUser('gestor', '123');
      expect(canAccessResource(gestor, '123')).toBe(true);
    });

    it('should deny gestor access to other resources', () => {
      const gestor = createMockUser('gestor', '123');
      expect(canAccessResource(gestor, '456')).toBe(false);
    });

    it('should allow gestor access when no owner specified', () => {
      const gestor = createMockUser('gestor', '123');
      expect(canAccessResource(gestor)).toBe(true);
      expect(canAccessResource(gestor, null as any)).toBe(true);
      expect(canAccessResource(gestor, undefined)).toBe(true);
    });

    it('should allow supervisor access to any resource (temporary implementation)', () => {
      const supervisor = createMockUser('supervisor', '123');
      expect(canAccessResource(supervisor, '456')).toBe(true);
      expect(canAccessResource(supervisor, '789')).toBe(true);
    });

    it('should handle numeric owner IDs', () => {
      const gestor = createMockUser('gestor', '123');
      expect(canAccessResource(gestor, 123)).toBe(true);
      expect(canAccessResource(gestor, 456)).toBe(false);
    });
  });

  describe('requireResourceAccess', () => {
    it('should not throw when user can access resource', () => {
      const gestor = createMockUser('gestor', '123');
      expect(() => requireResourceAccess(gestor, '123')).not.toThrow();
      
      const admin = createMockUser('administrador', '456');
      expect(() => requireResourceAccess(admin, '123')).not.toThrow();
    });

    it('should throw AppError when user cannot access resource', () => {
      const gestor = createMockUser('gestor', '123');
      expect(() => requireResourceAccess(gestor, '456')).toThrow(AppError);
      expect(() => requireResourceAccess(gestor, '456')).toThrow('Access denied to resource');
    });
  });

  describe('createMockUser', () => {
    it('should create mock user with default values', () => {
      const user = createMockUser();
      expect(user.id).toBe('1');
      expect(user.role).toBe('gestor');
      expect(user.email).toBe('gestor@example.com');
      expect(user.name).toBe('Mock gestor');
    });

    it('should create mock user with custom values', () => {
      const user = createMockUser('supervisor', '789');
      expect(user.id).toBe('789');
      expect(user.role).toBe('supervisor');
      expect(user.email).toBe('supervisor@example.com');
      expect(user.name).toBe('Mock supervisor');
    });
  });
});