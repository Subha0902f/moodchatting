import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/user.types';
import { AppError } from '../types/error.types';

/**
 * Role-Based Access Control Middleware
 * 
 * This middleware handles role-based permissions for routes.
 * It checks if the authenticated user has the required role(s)
 * to access a specific route or perform a specific action.
 * 
 * @example
 * // Only admins can delete users
 * router.delete('/users/:id',
 *   protect,
 *   restrictToRoles(UserRole.ADMIN),
 *   userController.deleteUser
 * );
 * 
 * // Admins and moderators can manage channels
 * router.post('/channels',
 *   protect,
 *   restrictToRoles(UserRole.ADMIN, UserRole.MODERATOR),
 *   channelController.createChannel
 * );
 */

/**
 * Restrict access to specific roles
 * 
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export const restrictToRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user) {
      throw new AppError('You must be logged in to access this resource', 401);
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      const allowedRolesString = allowedRoles.join(' or ');
      throw new AppError(
        `This action requires ${getRoleArticle(allowedRolesString)} ${allowedRolesString} role`,
        403
      );
    }

    next();
  };
};

/**
 * Check if user has ANY of the specified roles
 * More flexible than restrictToRoles - allows access if user has at least one role
 * 
 * @param roles - Array of roles
 * @returns Express middleware function
 */
export const hasAnyRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const hasRole = roles.some(role => req.user?.role === role);
    
    if (!hasRole) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Check if user has ALL of the specified roles
 * More strict - user must have all specified roles
 * 
 * @param roles - Array of roles
 * @returns Express middleware function
 */
export const hasAllRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const hasAllRoles = roles.every(role => req.user?.role === role);
    
    if (!hasAllRoles) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Check if user is an admin
 * Shorthand for restrictToRoles(UserRole.ADMIN)
 */
export const requireAdmin = restrictToRoles(UserRole.ADMIN);

/**
 * Check if user is a moderator or admin
 */
export const requireModeratorOrAdmin = restrictToRoles(
  UserRole.MODERATOR,
  UserRole.ADMIN
);

/**
 * Check if user is authenticated (any role)
 * This is less strict than protect() as it doesn't verify the token again
 * (assuming protect() was already called)
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError('You must be logged in to access this resource', 401);
  }
  next();
};

/**
 * Check if user is the owner of a resource or has admin role
 * 
 * @param getResourceOwnerId - Function that extracts the owner ID from the request
 * @returns Express middleware function
 * 
 * @example
 * // Only owner or admin can update a blog post
 * router.put('/posts/:id',
 *   protect,
 *   requireOwnerOrAdmin(req => req.params.id),
 *   postController.updatePost
 * );
 */
export const requireOwnerOrAdmin = (getResourceOwnerId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to access this resource', 401);
    }

    // Admins can access everything
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Check if user is the owner
    const resourceOwnerId = getResourceOwnerId(req);
    
    if (req.user.id !== resourceOwnerId) {
      throw new AppError(
        'You can only perform this action on your own resources',
        403
      );
    }

    next();
  };
};

/**
 * Check if user is the owner of a resource (no admin override)
 * 
 * @param getResourceOwnerId - Function that extracts the owner ID from the request
 * @returns Express middleware function
 */
export const requireOwner = (getResourceOwnerId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('You must be logged in to access this resource', 401);
    }

    const resourceOwnerId = getResourceOwnerId(req);
    
    if (req.user.id !== resourceOwnerId) {
      throw new AppError(
        'You can only perform this action on your own resources',
        403
      );
    }

    next();
  };
};

/**
 * Dynamic role checking based on resource permissions
 * Useful for complex scenarios where permissions are stored in the database
 * 
 * @param checkPermission - Async function that checks if user has permission
 * @returns Express middleware function
 * 
 * @example
 * // Check if user can access a specific channel
 * router.get('/channels/:id/messages',
 *   protect,
 *   checkResourcePermission(async (req) => {
 *     const channelId = req.params.id;
 *     const userId = req.user.id;
 *     
 *     // Check if user is a member of the channel
 *     const { data } = await supabaseAdmin
 *       .from('channel_members')
 *       .select('user_id')
 *       .eq('channel_id', channelId)
 *       .eq('user_id', userId)
 *       .single();
 *     
 *     return !!data;
 *   }),
 *   messageController.getChannelMessages
 * );
 */
export const checkResourcePermission = (
  checkPermission: (req: Request) => Promise<boolean>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    try {
      const hasPermission = await checkPermission(req);
      
      if (!hasPermission) {
        throw new AppError('You do not have permission to access this resource', 403);
      }
      
      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error checking permissions', 500);
    }
  };
};

/**
 * Helper function to get the correct article for role names
 */
function getRoleArticle(roles: string): string {
  // If roles start with a vowel sound, use "an", otherwise "a"
  const firstRole = roles.split(' or ')[0];
  return /^[aeiou]/i.test(firstRole) ? 'an' : 'a';
}

export default {
  restrictToRoles,
  hasAnyRole,
  hasAllRoles,
  requireAdmin,
  requireModeratorOrAdmin,
  requireAuth,
  requireOwnerOrAdmin,
  requireOwner,
  checkResourcePermission
};