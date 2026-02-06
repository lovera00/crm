import { DefaultSession } from 'next-auth';

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

// Application-specific types
export type UserRole = 'gestor' | 'supervisor' | 'administrador';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email?: string;
  name?: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
  isAuthenticated: boolean;
}

// Role-based access control types
export type Permission = 
  | 'create:persona'
  | 'read:persona'
  | 'update:persona'
  | 'delete:persona'
  | 'create:seguimiento'
  | 'read:seguimiento'
  | 'update:seguimiento'
  | 'delete:seguimiento'
  | 'create:autorizacion'
  | 'read:autorizacion'
  | 'update:autorizacion'
  | 'delete:autorizacion'
  | 'execute:actualizaciones-diarias'
  | 'manage:usuarios';

export type RolePermissions = Record<UserRole, Permission[]>;