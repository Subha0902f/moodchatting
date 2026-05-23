/7
  # MoodChat Backend Middleware Architecture Guide

This guide provides a comprehensive overview of the middleware system implemented for the MoodChat backend.

## 📁 Project Structure

```
backend/
├── config/
│   ├── env.config.ts          # Environment configuration
│   └── supabase.ts            # Supabase client setup
├── middleware/
│   ├── asyncHandler.ts        # Async wrapper for controllers
│   ├── authMiddleware.ts      # JWT authentication
│   ├── errorMiddleware.ts     # Global error handling
│   ├── validationMiddleware.ts # Request validation
│   ├── roleMiddleware.ts      # Role-based access control 
│   ├── supabaseError.ts       # Supabase error handling
│   └── index.ts               # Central exports
├── types/
│   ├── express.d.ts           # Express type extensions
│   ├── user.types.ts          # User and JWT types
│   ├── error.types.ts         # Error types and classes
│   └── index.ts               # Type exports
├── routes/
│   └── exampleRoutes.ts       # Example route implementations
└── server.ts                  # Main server file
```

## 🔧 Middleware Components

### 1. asyncHandler.ts

**Purpose**: Eliminates repetitive try-catch blocks in async controllers.

**Usage**:
```typescript
import { asyncHandler } from '../middleware';

// Instead of:
const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.findById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Use:
const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.findById(req.params.id);
  res.json(user);
});
```

### 2. authMiddleware.ts

**Purpose**: Handles JWT authentication and protects routes.

**Key Functions**:
- `protect`: Verifies JWT token and attaches user to `req.user`
- `restrictTo`: Restricts access to specific user roles
- `optionalAuth`: Attaches user if token is valid, but doesn't require it
- `isOwner`: Checks if user owns a resource

**Usage**:
```typescript
import { protect, restrictTo } from '../middleware';
import { UserRole } from '../types';

// Protected route
router.get('/profile', protect, (req: Request, res: Response) => {
  // req.user is available here
  res.json({ user: req.user });
});

// Admin-only route
router.delete('/users/:id', 
  protect, 
  restrictTo(UserRole.ADMIN), 
  userController.deleteUser
);
```

**Token Format**: `Authorization: Bearer <token>`

### 3. errorMiddleware.ts

**Purpose**: Centralized error handling with consistent response format.

**Key Functions**:
- `globalErrorHandler`: Main error handler for all errors
- `notFoundHandler`: Handles 404 responses
- `handleSpecificErrors`: Handles specific error types
- `createErrorHandler`: Creates route-specific error handlers

**Error Response Format**:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [],
  "stack": "stack trace (dev only)"
}
```

**Usage**:
```typescript
// In server.ts (must be last middleware)
app.use(globalErrorHandler);

// Throwing errors in controllers
throw new AppError('User not found', 404);
```

### 4. validationMiddleware.ts

**Purpose**: Validates request data (body, params, query) with detailed error messages.

**Key Functions**:
- `validateRequest`: Generic validation for any request location
- `validateBody`: Validate request body
- `validateParams`: Validate URL parameters
- `validateQuery`: Validate query parameters
- `commonRules`: Pre-defined validation rules

**Validation Rules**:
```typescript
{
  field: 'email',           // Field name
  required: true,           // Is required?
  type: 'email',           // Type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email'
  minLength: 5,            // Minimum length (strings)
  maxLength: 100,          // Maximum length (strings)
  pattern: /regex/,        // Regex pattern
  enum: ['a', 'b'],        // Allowed values
  custom: (value) => null  // Custom validation function
}
```

**Usage**:
```typescript
router.post('/users',
  validateBody([
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, minLength: 8 },
    { field: 'name', required: true, type: 'string', maxLength: 100 }
  ]),
  userController.createUser
);
```

### 5. roleMiddleware.ts

**Purpose**: Role-based access control for routes.

**Available Roles**:
- `ADMIN`: Full access to all features
- `MODERATOR`: Content moderation capabilities
- `USER`: Standard user access

**Key Functions**:
- `restrictToRoles`: Restrict to specific roles
- `hasAnyRole`: User must have at least one role
- `hasAllRoles`: User must have all roles
- `requireAdmin`: Shorthand for admin-only
- `requireModeratorOrAdmin`: Moderator or admin access
- `requireOwnerOrAdmin`: Resource owner or admin
- `checkResourcePermission`: Dynamic permission checking

**Usage**:
```typescript
import { restrictToRoles, requireAdmin } from '../middleware';
import { UserRole } from '../types';

// Admin only
router.delete('/users/:id', protect, requireAdmin, userController.deleteUser);

// Moderator or Admin
router.post('/moderate', 
  protect, 
  restrictToRoles(UserRole.MODERATOR, UserRole.ADMIN),
  moderationController.moderate
);

// Resource owner or admin
router.put('/posts/:id',
  protect,
  requireOwnerOrAdmin(req => req.params.id),
  postController.updatePost
);
```

## 🗄️ Type System

### User Types (`types/user.types.ts`)

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
```

### Error Types (`types/error.types.ts`)

```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: any[];
  stack?: string;
}
```

### Express Extension (`types/express.d.ts`)

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
```

## 🚀 Usage Examples

### Complete Protected Route Example

```typescript
import { Router } from 'express';
import { protect, restrictTo, validateBody, asyncHandler } from '../middleware';
import { UserRole } from '../types';

const router = Router();

// Create blog post
router.post('/posts',
  protect,
  validateBody([
    { field: 'title', required: true, type: 'string', minLength: 5, maxLength: 200 },
    { field: 'content', required: true, type: 'string', minLength: 50 },
    { field: 'mood', required: true, type: 'string' }
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { title, content, mood } = req.body;
    const authorId = req.user!.id; // req.user is typed and available
    
    // Create post logic here
    const post = await postService.create({
      title,
      content,
      mood,
      author: authorId
    });
    
    res.status(201).json({
      success: true,
      data: post
    });
  })
);

// Get user's own posts
router.get('/my-posts',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const posts = await postService.findByAuthor(userId);
    
    res.json({
      success: true,
      data: posts
    });
  })
);

// Admin: Get all posts
router.get('/admin/all-posts',
  protect,
  restrictTo(UserRole.ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    const posts = await postService.findAll();
    
    res.json({
      success: true,
      data: posts
    });
  })
);

export default router;
```

### Error Handling Example

```typescript
import { asyncHandler } from '../middleware';
import { AppError } from '../types';

// In a controller
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const user = await userService.findById(id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Custom error with details
throw new AppError(
  'Validation failed',
  400,
  true,
  [
    { field: 'email', message: 'Invalid email format' },
    { field: 'password', message: 'Password too short' }
  ]
);
```

## 🔒 Security Features

### 1. JWT Authentication
- Tokens are verified on every protected request
- User data is fetched fresh from database
- Expired tokens are rejected

### 2. Role-Based Access Control
- Routes can be restricted to specific roles
- Admins have override permissions
- Resource ownership can be enforced

### 3. Input Validation
- All user input is validated before processing
- Type checking prevents injection attacks
- Length limits prevent buffer overflows

### 4. Error Handling
- Errors don't leak sensitive information
- Stack traces only shown in development
- Consistent error response format

### 5. Rate Limiting
- API rate limiting prevents abuse
- Configurable limits per time window

## 📊 Database Integration

### Supabase/PostgreSQL Queries

```typescript
import { supabaseAdmin } from '../config/supabase';

// Select
const { data, error } = await supabaseAdmin
  .from('users')
  .select('id, email, full_name, role')
  .eq('id', userId)
  .single();

// Insert
const { data, error } = await supabaseAdmin
  .from('posts')
  .insert({
    title: 'Hello World',
    content: 'Post content',
    author_id: userId
  })
  .select()
  .single();

// Update
const { data, error } = await supabaseAdmin
  .from('users')
  .update({ full_name: 'New Name' })
  .eq('id', userId)
  .select()
  .single();

// Delete
const { error } = await supabaseAdmin
  .from('posts')
  .delete()
  .eq('id', postId);
```

## 🧪 Testing Middleware

### Testing Authentication

```typescript
// Create test user and get token
const token = await generateTestToken();

// Test protected route
const response = await request(app)
  .get('/api/profile')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

### Testing Validation

```typescript
// Test missing required field
const response = await request(app)
  .post('/api/users')
  .send({ email: 'test@example.com' }) // Missing password
  .expect(400);

expect(response.body.errors).toContainEqual(
  expect.objectContaining({ field: 'password' })
);
```

### Testing Role-Based Access

```typescript
// Test admin-only route with regular user
const userToken = await generateUserToken();

const response = await request(app)
  .delete('/api/admin/users/123')
  .set('Authorization', `Bearer ${userToken}`)
  .expect(403);
```

## 🔄 Middleware Execution Order

1. **Security Middleware** (Helmet, CORS)
2. **Body Parsing** (express.json, express.urlencoded)
3. **Rate Limiting**
4. **Authentication** (protect middleware)
5. **Validation** (validateBody, validateParams, etc.)
6. **Role Checking** (restrictTo, requireAdmin, etc.)
7. **Route Handler**
8. **Error Handler** (globalErrorHandler)
9. **404 Handler** (notFoundHandler)

## 📝 Best Practices

1. **Always use asyncHandler** for async controllers
2. **Validate all user input** before processing
3. **Use specific error messages** but don't leak sensitive info
4. **Protect sensitive routes** with appropriate middleware
5. **Keep middleware focused** on single responsibilities
6. **Use TypeScript** for type safety throughout
7. **Test middleware** in isolation and integration
8. **Document route requirements** in comments
9. **Use environment variables** for configuration
10. **Implement proper error handling** at all levels

## 🛠️ Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Frontend (for CORS)
FRONTEND_URL=http://localhost:5173
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [JSON Web Tokens](https://jwt.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Note**: This middleware system is designed to be scalable and maintainable. Follow the patterns shown in the examples for consistent implementation across your application.