/**
 * Example Routes
 * 
 * This file demonstrates how to use all the middleware components
 * in real route implementations. It serves as a reference for
 * building protected, validated, and role-based routes.
 */

import { Router } from 'express';
import {
  protect,
  restrictTo,
  validateBody,
  validateParams,
  validateQuery,
  asyncHandler
} from '../middleware';
import { UserRole } from '../types/user.types';
import { Request, Response } from 'express';

const router = Router();

// ─── Example 1: Public Route ────────────────────────────────────────────────

/**
 * Public route - no authentication required
 * Anyone can access this endpoint
 */
router.get('/public-info', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'This is public information',
    data: {
      appName: 'MoodChat',
      version: '1.0.0',
      features: ['Chat', 'Blogging', 'Mood Tracking']
    }
  });
});

// ─── Example 2: Protected Route (Authentication Required) ───────────────────

/**
 * Protected route - requires valid JWT token
 * The protect middleware verifies the token and attaches user to req.user
 */
router.get(
  '/my-profile',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    // req.user is now available and typed
    res.status(200).json({
      success: true,
      data: {
        id: req.user?.id,
        email: req.user?.email,
        full_name: req.user?.full_name,
        role: req.user?.role,
        avatar_url: req.user?.avatar_url
      }
    });
  })
);

// ─── Example 3: Protected Route with Validation ─────────────────────────────

/**
 * Protected route with body validation
 * Validates required fields before processing
 */
router.post(
  '/update-profile',
  protect,
  validateBody([
    { field: 'full_name', required: false, type: 'string', maxLength: 100 },
    { field: 'avatar_url', required: false, type: 'string' },
    { field: 'bio', required: false, type: 'string', maxLength: 500 }
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    // Validation has already passed
    // req.user is available
    const { full_name, avatar_url, bio } = req.body;
    
    res.status(200).json({
      success: true,
      message: 'Profile update would be processed here',
      data: { full_name, avatar_url, bio }
    });
  })
);

// ─── Example 4: Role-Based Access Control ───────────────────────────────────

/**
 * Admin-only route
 * Only users with ADMIN role can access this endpoint
 */
router.get(
  '/admin/dashboard',
  protect,
  restrictTo(UserRole.ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the admin dashboard',
      data: {
        user: req.user,
        adminFeatures: ['User Management', 'Content Moderation', 'Analytics']
      }
    });
  })
);

/**
 * Moderator or Admin route
 * Users with MODERATOR or ADMIN role can access
 */
router.post(
  '/moderate-content',
  protect,
  restrictTo(UserRole.MODERATOR, UserRole.ADMIN),
  validateBody([
    { field: 'contentId', required: true, type: 'string' },
    { field: 'action', required: true, type: 'string', enum: ['approve', 'reject', 'flag'] }
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId, action } = req.body;
    
    res.status(200).json({
      success: true,
      message: `Content ${contentId} marked for ${action}`,
      moderatedBy: req.user?.email
    });
  })
);

// ─── Example 5: Resource Ownership ──────────────────────────────────────────

/**
 * Route with ownership check
 * Users can only access their own resources (unless admin)
 */
router.get(
  '/posts/:postId',
  protect,
  validateParams([
    { field: 'postId', required: true, type: 'string' }
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = req.user?.id;
    
    // In a real app, you would check if the post belongs to the user
    // For this example, we'll just show the concept
    
    res.status(200).json({
      success: true,
      message: `Accessing post ${postId} as user ${userId}`,
      data: {
        postId,
        userId,
        isOwner: true // Would be determined by database lookup
      }
    });
  })
);

// ─── Example 6: Complex Validation ──────────────────────────────────────────

/**
 * Route with complex validation rules
 * Demonstrates custom validation and multiple field rules
 */
router.post(
  '/create-post',
  protect,
  validateBody([
    { field: 'title', required: true, type: 'string', minLength: 5, maxLength: 200 },
    { field: 'content', required: true, type: 'string', minLength: 50 },
    { field: 'tags', required: false, type: 'array' },
    { field: 'category', required: true, type: 'string', enum: ['personal', 'public', 'private'] },
    {
      field: 'published',
      required: false,
      type: 'boolean'
    },
    {
      field: 'mood',
      required: true,
      custom: (value: any) => {
        const validMoods = ['happy', 'sad', 'angry', 'anxious', 'calm', 'excited'];
        if (!validMoods.includes(value)) {
          return `Mood must be one of: ${validMoods.join(', ')}`;
        }
        return null;
      }
    }
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { title, content, tags, category, published, mood } = req.body;
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        title,
        content,
        tags,
        category,
        published: published || false,
        mood,
        author: req.user?.id,
        createdAt: new Date().toISOString()
      }
    });
  })
);

// ─── Example 7: Query Parameter Validation ──────────────────────────────────

/**
 * Route with query parameter validation
 * Validates pagination and filtering parameters
 */
router.get(
  '/search-posts',
  protect,
  validateQuery([
    { field: 'page', required: false, type: 'number' },
    { field: 'limit', required: false, type: 'number' },
    { field: 'mood', required: false, type: 'string' },
    { field: 'category', required: false, type: 'string' },
    { field: 'sort', required: false, type: 'string', enum: ['newest', 'oldest', 'popular'] }
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, mood, category, sort = 'newest' } = req.query;
    
    res.status(200).json({
      success: true,
      message: 'Search results would be returned here',
      data: {
        page: Number(page),
        limit: Number(limit),
        filters: { mood, category },
        sort,
        user: req.user?.email
      }
    });
  })
);

// ─── Example 8: Optional Authentication ─────────────────────────────────────

/**
 * Route with optional authentication
 * Public content, but shows extra info for authenticated users
 */
router.get(
  '/public-posts/:postId',
  // optionalAuth would be used here if implemented
  validateParams([
    { field: 'postId', required: true, type: 'string' }
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const isAuthenticated = !!req.user;
    
    res.status(200).json({
      success: true,
      data: {
        postId,
        isAuthenticated,
        user: req.user ? {
          id: req.user.id,
          email: req.user.email
        } : null,
        content: {
          title: 'Sample Post',
          content: 'This is a public post that anyone can view'
        }
      }
    });
  })
);

export default router;