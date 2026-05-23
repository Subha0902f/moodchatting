/**
 * User role enumeration for role-based access control
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

/**
 * User interface representing the authenticated user data
 * This will be attached to req.user after successful authentication
 */
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * JWT Payload interface - what's encoded in the JWT token
 */
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Authentication response interface
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Database user row interface (matches Supabase users table structure)
 */
export interface DatabaseUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}