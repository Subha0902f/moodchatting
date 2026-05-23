/**
 * MoodChat Backend Server
 * 
 * Main entry point for the Express.js backend server.
 * Configures all middleware, routes, and error handling.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/authRoutes';
import blogRoutes from './routes/blogRoutes';
import channelRoutes from './routes/channelRoutes';
import chatRoutes from './routes/chatRoutes';
import friendRoutes from './routes/friendRoutes';
import messageRoutes from './routes/messageRoutes';
import modeRoutes from './routes/modeRoutes';
import noteRoutes from './routes/noteRoutes';
import reminderRoutes from './routes/reminderRoutes';
import userRoutes from './routes/userRoutes';

// Import middleware
import {
  globalErrorHandler,
  notFoundHandler
} from './middleware/errorMiddleware';
import { protect } from './middleware/authMiddleware';

// Import config
import { envConfig } from './config/env.config';
import { testSupabaseConnection } from './config/supabase';

// Import socket handler
import { initializeSocket } from './sockets/socketHandler';

// Initialize Express application
const app: Application = express();
const httpServer = createServer(app);
const port = envConfig.port;

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket.io handler
initializeSocket(io);

// ─── Global Middleware ──────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// ─── Health Check & Status Routes ───────────────────────────────────────────

/**
 * Health check endpoint
 * Used for monitoring and load balancer health checks
 */
app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'MoodChat backend is running',
    timestamp: new Date().toISOString(),
    environment: envConfig.nodeEnv
  });
});

/**
 * API status endpoint
 * Returns API version and status information
 */
app.get('/api/status', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────

// Authentication routes (public)
app.use('/auth', authRoutes);

// Protected routes (require authentication)
// All routes below this point require a valid JWT token

// User routes
app.use('/users', protect, userRoutes);

// Friend routes
app.use('/friends', protect, friendRoutes);

// Chat routes
app.use('/chat', protect, chatRoutes);

// Message routes
app.use('/messages', protect, messageRoutes);

// Channel routes
app.use('/channels', protect, channelRoutes);

// Blog routes
app.use('/blog', protect, blogRoutes);

// Note routes
app.use('/notes', protect, noteRoutes);

// Mode/Mood routes
app.use('/modes', protect, modeRoutes);

// Reminder routes
app.use('/reminders', protect, reminderRoutes);

// ─── Example Protected Route ────────────────────────────────────────────────

/**
 * Example: Protected route that requires authentication
 * 
 * This demonstrates how to use the protect middleware to secure routes.
 * The req.user object will be available in the controller.
 * 
 * Usage:
 * GET /api/profile
 * Headers: { Authorization: "Bearer <token>" }
 */
app.get('/api/profile', protect, (req: Request, res: Response) => {
  // req.user is now available and typed
  return res.status(200).json({
    success: true,
    data: {
      id: req.user?.id,
      email: req.user?.email,
      full_name: req.user?.full_name,
      role: req.user?.role,
      avatar_url: req.user?.avatar_url
    }
  });
});

/**
 * Example: Route with role-based access control
 * 
 * This demonstrates how to restrict routes to specific roles.
 * Only users with ADMIN role can access this endpoint.
 * 
 * Usage:
 * DELETE /api/admin/users/:id
 * Headers: { Authorization: "Bearer <admin-token>" }
 */
app.delete('/api/admin/users/:id', protect, (req: Request, res: Response, _next: NextFunction) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action'
    });
  }
  
  // Admin-only logic here
  return res.status(200).json({
    success: true,
    message: `User ${req.params.id} would be deleted (admin only)`
  });
});

// ─── Error Handling ─────────────────────────────────────────────────────────

/**
 * 404 Not Found Handler
 * Handles requests to undefined routes
 */
app.use(notFoundHandler);

/**
 * Global Error Handler
 * Catches all errors and returns a standardized error response
 * Must be last middleware
 */
app.use(globalErrorHandler);

// ─── Server Startup ─────────────────────────────────────────────────────────

/**
 * Start the server
 * Tests database connection and starts listening on the configured port
 */
const startServer = async () => {
  try {
    // Test Supabase connection
    await testSupabaseConnection();

    httpServer.listen(port, () => {
      console.log(`✅ MoodChat backend server running on port ${port}`);
      console.log(`📡 Environment: ${envConfig.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
      console.log(`📊 API status: http://localhost:${port}/api/status`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throw an error, or shutdown
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export { app, httpServer, io };
export default app;