/**
 * Supabase Error Interface and Class
 * 
 * This file defines error types specific to Supabase/PostgreSQL operations
 * to provide better error handling and user-friendly messages.
 */

/**
 * Interface for Supabase/PostgreSQL errors
 */
export interface SupabaseErrorInterface {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  statusCode?: number;
}

/**
 * SupabaseError class for database-related errors
 * Extends the native Error class with Supabase-specific properties
 */
export class SupabaseError extends Error {
  public readonly code?: string;
  public readonly details?: string;
  public readonly hint?: string;
  public readonly statusCode: number;

  constructor(errorData: SupabaseErrorInterface) {
    super(errorData.message);
    this.name = 'SupabaseError';
    this.code = errorData.code;
    this.details = errorData.details;
    this.hint = errorData.hint;
    this.statusCode = errorData.statusCode || 500;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SupabaseError);
    }
  }

  /**
   * Create a SupabaseError from a Supabase response error object
   */
  static fromSupabaseError(error: any): SupabaseError {
    return new SupabaseError({
      message: error.message || 'Database operation failed',
      code: error.code,
      details: error.details,
      hint: error.hint,
      statusCode: error.status || 500
    });
  }

  /**
   * Check if this is a unique constraint violation
   */
  isUniqueViolation(): boolean {
    return this.code === '23505';
  }

  /**
   * Check if this is a foreign key constraint violation
   */
  isForeignKeyViolation(): boolean {
    return this.code === '23503';
  }

  /**
   * Check if this is a not null violation
   */
  isNotNullViolation(): boolean {
    return this.code === '23502';
  }

  /**
   * Check if this is a row not found error
   */
  isRowNotFound(): boolean {
    return this.code === 'PGRST116';
  }
}

export default SupabaseError;