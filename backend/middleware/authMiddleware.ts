import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';
import { envConfig } from '../config/env.config';
import { User, UserRole, JWTPayload } from '../types/user.types';
import { AppError } from '../types/error.types';
import { asyncHandler } from './asyncHandler';

/**
 * JWT Verification Middleware
 * 
 * This middleware verifies JWT tokens from the Authorization header
 * and attaches the authenticated user to req.user.
 * 
 * Token format: "Bearer <token>"
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // 1. Get token from Authorization header
      let token: string | undefined;
      
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }

      // 2. Check if token exists
      if (!token) {
        throw new AppError(
          'You are not logged in! Please log in to get access.',
          401
        );
      }

      const attachSupabaseUser = async () => {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        const authUser = data.user;

        if (error || !authUser?.email) return false;

        const userRow = {
          id: authUser.id,
          email: authUser.email,
          full_name:
            (authUser.user_metadata?.full_name as string | undefined) ||
            (authUser.user_metadata?.name as string | undefined) ||
            (authUser.user_metadata?.username as string | undefined) ||
            null,
          role: UserRole.USER,
          avatar_url: (authUser.user_metadata?.avatar_url as string | undefined) || null,
          updated_at: new Date().toISOString(),
        };

        const { data: user, error: upsertError } = await supabaseAdmin
          .from('users')
          .upsert(userRow, { onConflict: 'id' })
          .select('id, email, full_name, role, avatar_url, created_at, updated_at')
          .single();

        if (upsertError || !user) {
          console.error('[auth] Supabase user sync failed:', upsertError?.message);
          throw new AppError('Authentication failed', 401);
        }

        req.user = {
          id: user.id,
          email: user.email,
          full_name: user.full_name || undefined,
          role: user.role as UserRole,
          avatar_url: user.avatar_url || undefined,
          created_at: user.created_at,
          updated_at: user.updated_at
        } as User;

        return true;
      };

      const attachAppJwtUser = async () => {
        const decoded = jwt.verify(token, envConfig.jwt.secret) as JWTPayload;

        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, role, avatar_url, created_at, updated_at')
          .eq('id', decoded.id)
          .single();

        if (error || !user) {
          throw new AppError(
            'The user belonging to this token no longer exists.',
            401
          );
        }

        req.user = {
          id: user.id,
          email: user.email,
          full_name: user.full_name || undefined,
          role: user.role as UserRole,
          avatar_url: user.avatar_url || undefined,
          created_at: user.created_at,
          updated_at: user.updated_at
        } as User;
      };

      try {
        await attachAppJwtUser();
      } catch (jwtError) {
        const attached = await attachSupabaseUser();
        if (!attached) throw jwtError;
      }

      next();
    } catch (error) {
      // Handle JWT verification errors
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token. Please log in again!', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Your token has expired! Please log in again.', 401);
      }
      
      // Re-throw if it's already an AppError
      if (error instanceof AppError) {
        throw error;
      }
      
      // For any other errors
      throw new AppError('Authentication failed', 401);
    }
  }
);

/**
 * Restrict access to specific routes
 * This middleware ensures the user is authenticated
 */
export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Check if user exists and has required role
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(
        'You do not have permission to perform this action',
        403
      );
    }
    next();
  };
};

/**
 * Optional authentication middleware
 * Some routes may want to know if a user is logged in,
 * but don't require authentication
 */
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;
      
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, envConfig.jwt.secret) as JWTPayload;
          
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, role, avatar_url, created_at, updated_at')
            .eq('id', decoded.id)
            .single();

          if (user) {
            req.user = {
              id: user.id,
              email: user.email,
              full_name: user.full_name || undefined,
              role: user.role as UserRole,
              avatar_url: user.avatar_url || undefined,
              created_at: user.created_at,
              updated_at: user.updated_at
            } as User;
          }
        } catch (jwtError) {
          // If token is invalid, continue without user
          // Don't throw error since auth is optional
        }
      }

      next();
    } catch (error) {
      // Continue without user on any error
      next();
    }
  }
);

/**
 * Check if user is the owner of a resource
 * @param getResourceOwnerId - Function to get the owner ID from request
 */
export const isOwner = (getResourceOwnerId: (req: Request) => string) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to perform this action', 401);
    }

    const resourceOwnerId = getResourceOwnerId(req);
    
    if (req.user.role === UserRole.ADMIN) {
      // Admins can perform any action
      return next();
    }

    if (req.user.id !== resourceOwnerId) {
      throw new AppError(
        'You can only perform this action on your own resources',
        403
      );
    }

    next();
  });
};

export default {
  protect,
  restrictTo,
  optionalAuth,
  isOwner
};
