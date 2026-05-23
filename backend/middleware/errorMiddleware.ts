import { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/env.config';
import { AppError, ErrorType, ErrorResponse } from '../types/error.types';
import { SupabaseError } from './supabaseError';

/**
 * Global Error Handler Middleware
 * 
 * This middleware handles all errors that occur in the application
 * and returns a consistent error response format.
 * 
 * It differentiates between operational errors (expected) and
 * programming errors (unexpected) to provide appropriate responses.
 * 
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const globalErrorHandler = (
  err: Error | AppError | SupabaseError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Set status code and response structure
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const isOperational = 'isOperational' in err ? err.isOperational : false;

  // Log error for debugging (only in development)
  if (envConfig.nodeEnv === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
      isOperational
    });
  } else {
    // In production, log operational errors only
    if (isOperational) {
      console.error('❌ Operational Error:', err.message);
    } else {
      console.error('❌ Programming Error:', err);
    }
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    message: err.message || 'Internal server error'
  };

  // Include details if available
  if ('details' in err && err.details) {
    errorResponse.errors = err.details;
  }

  // Include stack trace in development
  if (envConfig.nodeEnv === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle specific error types with appropriate status codes
 */
export const handleSpecificErrors = () => {
  // Handle Supabase/PostgreSQL errors
  const handleSupabaseError = (err: SupabaseError, res: Response) => {
    const status = err.statusCode || 500;
    let message = 'Database error';

    // Common Supabase error codes
    switch (err.code) {
      case '23505': // Unique violation
        message = 'Resource already exists';
        break;
      case '23503': // Foreign key violation
        message = 'Related resource not found';
        break;
      case '23502': // Not null violation
        message = 'Required field is missing';
        break;
      case '42P01': // Undefined table
        message = 'Database table not found';
        break;
      case 'PGRST116': // Row not found
        message = 'Resource not found';
        break;
      default:
        message = err.message || 'Database operation failed';
    }

    return res.status(status).json({
      success: false,
      message,
      code: err.code
    });
  };

  // Handle JWT errors
  const handleJWTError = (err: any, res: Response) => {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  };

  // Handle validation errors
  const handleValidationError = (err: any, res: Response) => {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.details || err.errors
    });
  };

  return {
    handleSupabaseError,
    handleJWTError,
    handleValidationError
  };
};

/**
 * Not Found Middleware
 * 
 * This middleware handles requests to undefined routes
 * and returns a 404 response with helpful information.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  
  res.status(404).json({
    success: false,
    message,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Create an error handler for specific routes
 * Useful for handling errors in route-specific middleware chains
 */
export const createErrorHandler = (operation: string) => {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`Error in ${operation}:`, err);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: `Error during ${operation}: ${err.message}`
      });
    } else {
      next(err);
    }
  };
};

export default {
  globalErrorHandler,
  notFoundHandler,
  handleSpecificErrors,
  createErrorHandler
};