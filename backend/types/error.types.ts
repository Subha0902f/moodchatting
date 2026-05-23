/**
 * Custom error interface for standardized error handling
 */
export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  details?: any;
}

/**
 * Error response interface for API responses
 */
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: any[];
  stack?: string;
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * API Error class for operational errors
 * Use this for expected errors that should return specific HTTP status codes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types for different scenarios
 */
export enum ErrorType {
  VALIDATION_ERROR = 'ValidationError',
  AUTHENTICATION_ERROR = 'AuthenticationError',
  AUTHORIZATION_ERROR = 'AuthorizationError',
  NOT_FOUND_ERROR = 'NotFoundError',
  DATABASE_ERROR = 'DatabaseError',
  INTERNAL_ERROR = 'InternalError'
}