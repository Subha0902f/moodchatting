/**
 * Middleware Index
 * 
 * Central export file for all middleware components.
 * This makes imports cleaner throughout the project.
 */

// Async handler wrapper
export { asyncHandler, default as asyncHandlerDefault } from './asyncHandler';

// Authentication middleware
export {
  protect,
  restrictTo,
  optionalAuth,
  isOwner,
  default as authMiddleware
} from './authMiddleware';

// Error handling middleware
export {
  globalErrorHandler,
  notFoundHandler,
  handleSpecificErrors,
  createErrorHandler,
  default as errorMiddleware
} from './errorMiddleware';

// Validation middleware
export {
  validateRequest,
  validateBody,
  validateParams,
  validateQuery,
  commonRules,
  default as validationMiddleware
} from './validationMiddleware';

// Role-based access control middleware
export {
  restrictToRoles,
  hasAnyRole,
  hasAllRoles,
  requireAdmin,
  requireModeratorOrAdmin,
  requireAuth,
  requireOwnerOrAdmin,
  requireOwner,
  checkResourcePermission,
  default as roleMiddleware
} from './roleMiddleware';

// Supabase error handling
export { SupabaseError, SupabaseErrorInterface } from './supabaseError';