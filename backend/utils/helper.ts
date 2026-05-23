/**
 * Utility Helper Functions
 * 
 * This module provides reusable utility functions used across the entire backend.
 * These helpers promote code reusability, consistency, and maintainability.
 * 
 * Best Practices for Utility/Helper Design:
 * - Keep functions pure and side-effect free when possible
 * - Make functions small and focused on a single responsibility
 * - Use TypeScript for type safety and better IDE support
 * - Document function purposes and parameters
 * - Handle edge cases and potential errors gracefully
 * - Avoid business logic - keep utilities generic and reusable
 */

import crypto from 'crypto';
import { AppError, ErrorType } from '../types/error.types.js';
import type { User, DatabaseUser } from '../types/user.types.js';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Standard API response structure for consistent client communication
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationInfo;
  timestamp: string;
}

/**
 * Pagination information included in paginated responses
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Options for pagination configuration
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  totalItems: number;
}

/**
 * Options for unique username generation
 */
export interface UsernameGenerationOptions {
  baseUsername: string;
  existingUsernames: string[];
  maxAttempts?: number;
}

/**
 * Result of field validation
 */
export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
}

/**
 * Options for creating custom errors
 */
export interface CustomErrorOptions {
  message: string;
  statusCode?: number;
  type?: ErrorType;
  details?: unknown;
  isOperational?: boolean;
}

// =============================================================================
// 1. generateUniqueUsername
// =============================================================================

/**
 * Generates a unique username by appending random suffixes if the base username exists
 * 
 * Why this is useful:
 * - Ensures no duplicate usernames in the system
 * - Provides a fallback when desired username is taken
 * - Maintains user experience by keeping base username recognizable
 * 
 * @param options - Configuration for username generation
 * @returns A unique username that doesn't exist in the system
 * 
 * @example
 * ```typescript
 * const uniqueUsername = generateUniqueUsername({
 *   baseUsername: 'john_doe',
 *   existingUsernames: ['john_doe', 'john_doe_1'],
 *   maxAttempts: 100
 * });
 * // Returns: 'john_doe_2' (or another unique variant)
 * ```
 */
export function generateUniqueUsername(options: UsernameGenerationOptions): string {
  const { baseUsername, existingUsernames, maxAttempts = 100 } = options;
  
  // Normalize to lowercase for case-insensitive comparison
  const normalizedExisting = new Set(
    existingUsernames.map(name => name.toLowerCase())
  );
  const normalizedBase = baseUsername.toLowerCase();
  
  // If base username is available, return it
  if (!normalizedExisting.has(normalizedBase)) {
    return baseUsername;
  }
  
  // Try appending numbers until we find an available username
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${normalizedBase}_${generateRandomId(4)}`;
    if (!normalizedExisting.has(candidate)) {
      return candidate;
    }
  }
  
  // Fallback: append timestamp for guaranteed uniqueness
  return `${normalizedBase}_${Date.now()}_${generateRandomId(4)}`;
}

// =============================================================================
// 2. formatResponse
// =============================================================================

/**
 * Standardizes API responses for consistent client communication
 * 
 * Why this is useful:
 * - Ensures all API responses follow the same structure
 * - Makes frontend parsing predictable and reliable
 * - Includes pagination info when needed
 * - Adds timestamp for caching/debugging purposes
 * 
 * @param data - The response data payload
 * @param options - Optional configuration for the response
 * @returns Standardized API response object
 * 
 * @example
 * ```typescript
 * // Success response
 * res.status(200).json(formatResponse({ users: userList }, { message: 'Users fetched successfully' }));
 * 
 * // Paginated response
 * res.status(200).json(formatResponse(posts, { 
 *   message: 'Posts retrieved',
 *   pagination: { page: 1, limit: 10, totalItems: 100 }
 * }));
 * ```
 */
export function formatResponse<T>(
  data: T,
  options: { message?: string; pagination?: PaginationOptions } = {}
): ApiResponse<T> {
  const { message, pagination } = options;
  
  const response: ApiResponse<T> = {
    success: true,
    timestamp: new Date().toISOString()
  };
  
  if (message !== undefined) {
    response.message = message;
  }
  
  response.data = data;
  
  if (pagination) {
    response.pagination = createPagination(pagination);
  }
  
  return response;
}

/**
 * Creates a standardized error response
 * 
 * @param error - The error object or message
 * @returns Standardized error API response
 */
export function formatErrorResponse(
  error: Error | string
): Omit<ApiResponse<null>, 'data' | 'pagination'> {
  return {
    success: false,
    message: typeof error === 'string' ? error : error.message,
    timestamp: new Date().toISOString()
  };
}

// =============================================================================
// 3. createPagination
// =============================================================================

/**
 * Calculates pagination metadata for paginated responses
 * 
 * Why this is useful:
 * - Centralizes pagination calculation logic
 * - Ensures consistent pagination across all endpoints
 * - Provides frontend with necessary navigation info
 * 
 * @param options - Pagination configuration
 * @returns Pagination metadata object
 * 
 * @example
 * ```typescript
 * const pagination = createPagination({ page: 2, limit: 20, totalItems: 150 });
 * // Returns: { page: 2, limit: 20, totalItems: 150, totalPages: 8, hasNextPage: true, hasPrevPage: true }
 * ```
 */
export function createPagination(options: PaginationOptions): PaginationInfo {
  const { page, limit, totalItems } = options;
  
  // Ensure positive values
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  
  const totalPages = Math.ceil(totalItems / safeLimit);
  
  return {
    page: safePage,
    limit: safeLimit,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1
  };
}

/**
 * Calculates database query parameters for pagination
 * 
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @param maxLimit - Maximum allowed limit
 * @returns Offset and limit for database query
 */
export function calculatePaginationParams(
  page: number = 1,
  limit: number = 10,
  maxLimit: number = 100
): { offset: number; limit: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), maxLimit);
  const offset = (safePage - 1) * safeLimit;
  
  return { offset, limit: safeLimit };
}

// =============================================================================
// 4. sanitizeUser
// =============================================================================

/**
 * Removes sensitive fields from user data before sending to client
 * 
 * Why this is useful:
 * - Prevents accidental exposure of sensitive data
 * - Ensures consistent user data structure in responses
 * - Centralizes security logic for user data
 * 
 * @param user - User object from database
 * @returns Sanitized user object safe for client transmission
 * 
 * @example
 * ```typescript
 * const safeUser = sanitizeUser(databaseUser);
 * res.json(formatResponse(safeUser, { message: 'User retrieved' }));
 * ```
 */
export function sanitizeUser(user: DatabaseUser | User): Omit<User, 'password_hash'> {
  // Create a copy and remove sensitive fields
  const { 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    password_hash, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _password, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...safeUser 
  } = user as unknown as { password_hash?: string; _password?: string; [key: string]: unknown };
  
  return safeUser as Omit<User, 'password_hash'>;
}

/**
 * Sanitizes multiple users (array)
 * 
 * @param users - Array of user objects
 * @returns Array of sanitized user objects
 */
export function sanitizeUsers(users: (DatabaseUser | User)[]): Omit<User, 'password_hash'>[] {
  return users.map(user => sanitizeUser(user));
}

// =============================================================================
// 5. generateChatRoomId
// =============================================================================

/**
 * Creates a consistent, deterministic room ID for private chats between two users
 * 
 * Why this is useful:
 * - Ensures the same room ID regardless of who initiates the chat
 * - Prevents duplicate rooms for the same pair of users
 * - Useful for 1-on-1 private messaging
 * 
 * @param userId1 - First user's ID
 * @param userId2 - Second user's ID
 * @returns Consistent room ID string
 * 
 * @example
 * ```typescript
 * const roomId = generateChatRoomId('user-123', 'user-456');
 * // Same result regardless of argument order
 * generateChatRoomId('user-456', 'user-123') === roomId // true
 * ```
 */
export function generateChatRoomId(userId1: string, userId2: string): string {
  // Sort IDs to ensure consistent ordering
  const sortedIds = [userId1, userId2].sort();
  return `private_${sortedIds[0]}_${sortedIds[1]}`;
}

/**
 * Creates a unique room ID for group chats
 * 
 * @param groupIdentifier - Optional identifier for the group
 * @returns Unique group room ID
 */
export function generateGroupRoomId(groupIdentifier?: string): string {
  if (groupIdentifier) {
    return `group_${groupIdentifier}`;
  }
  return `group_${crypto.randomUUID()}`;
}

// =============================================================================
// 6. validateRequiredFields
// =============================================================================

/**
 * Validates that all required fields are present and non-empty
 * 
 * Why this is useful:
 * - Centralizes validation logic
 * - Provides detailed error information
 * - Works with any object type
 * 
 * @param data - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result with details about missing fields
 * 
 * @example
 * ```typescript
 * const validation = validateRequiredFields(
 *   { email: 'test@example.com' },
 *   ['email', 'password', 'name']
 * );
 * 
 * if (!validation.isValid) {
 *   return res.status(400).json(formatErrorResponse(validation.errors.join(', ')));
 * }
 * ```
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): ValidationResult {
  const missingFields: string[] = [];
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    
    if (value === undefined || value === null) {
      missingFields.push(String(field));
      errors.push(`${String(field)} is required`);
      continue;
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      missingFields.push(String(field));
      errors.push(`${String(field)} cannot be empty`);
    }
    
    if (Array.isArray(value) && value.length === 0) {
      missingFields.push(String(field));
      errors.push(`${String(field)} must contain at least one item`);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    errors
  };
}

/**
 * Validates request body fields with custom validation functions
 * 
 * @param data - Object to validate
 * @param validators - Object mapping field names to validation functions
 * @returns Array of validation errors
 */
export function validateWithCustomRules<T extends Record<string, unknown>>(
  data: T,
  validators: {
    [K in keyof T]?: (value: T[K], allData: T) => string | null;
  }
): string[] {
  const errors: string[] = [];
  
  for (const [field, validator] of Object.entries(validators)) {
    if (validator && data[field] !== undefined) {
      const error = validator(data[field], data);
      if (error) {
        errors.push(error);
      }
    }
  }
  
  return errors;
}

// =============================================================================
// 7. generateRandomId
// =============================================================================

/**
 * Generates a random ID string for temporary or internal use
 * 
 * Why this is useful:
 * - Creates unique identifiers for temporary data
 * - Useful for optimistic UI updates
 * - Can generate short IDs for user-friendly references
 * 
 * @param length - Length of the ID (default: 8)
 * @param prefix - Optional prefix for the ID
 * @returns Random ID string
 * 
 * @example
 * ```typescript
 * const tempId = generateRandomId(); // 'a3f8b2c1'
 * const shortId = generateRandomId(4); // 'x9k2'
 * const prefixedId = generateRandomId(6, 'msg_'); // 'msg_a3f8b2'
 * ```
 */
export function generateRandomId(length: number = 8, prefix: string = ''): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  
  const randomValues = crypto.getRandomValues(new Uint32Array(length));
  for (let i = 0; i < length; i++) {
    id += chars[randomValues[i] % chars.length];
  }
  
  return `${prefix}${id}`;
}

/**
 * Generates a UUID v4 (universally unique identifier)
 * 
 * @returns UUID string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

// =============================================================================
// 8. formatTimestamp
// =============================================================================

/**
 * Formats a timestamp into a human-readable string
 * 
 * Why this is useful:
 * - Consistent date/time formatting across the application
 * - Supports multiple format options
 * - Handles timezone considerations
 * 
 * @param date - Date string or Date object
 * @param format - Format type ('relative', 'short', 'long', 'iso')
 * @param timezone - Optional timezone (default: UTC)
 * @returns Formatted date string
 * 
 * @example
 * ```typescript
 * formatTimestamp(new Date(), 'relative'); // '2 hours ago'
 * formatTimestamp('2024-01-15T10:30:00Z', 'short'); // 'Jan 15, 2024'
 * formatTimestamp(new Date(), 'iso'); // '2024-01-15T10:30:00.000Z'
 * ```
 */
export function formatTimestamp(
  date: string | Date,
  format: 'relative' | 'short' | 'long' | 'iso' = 'iso',
  timezone: string = 'UTC'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  switch (format) {
    case 'relative':
      return getRelativeTime(dateObj);
      
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: timezone
      });
      
    case 'long':
      return dateObj.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone
      });
      
    case 'iso':
    default:
      return dateObj.toISOString();
  }
}

/**
 * Helper function to calculate relative time
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
  return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
}

/**
 * Formats a message with timestamp for chat display
 * 
 * @param message - Message content
 * @param timestamp - Message timestamp
 * @returns Formatted message object
 */
export function formatChatMessage(message: string, timestamp: string | Date): {
  content: string;
  timestamp: string;
  formattedTime: string;
} {
  return {
    content: message,
    timestamp: typeof timestamp === 'string' ? timestamp : timestamp.toISOString(),
    formattedTime: formatTimestamp(timestamp, 'short')
  };
}

// =============================================================================
// 9. isUserOnline
// =============================================================================

/**
 * Checks if a user is in the online users collection
 * 
 * Why this is useful:
 * - Centralizes online status checking logic
 * - Works with any Map/Set based online tracking
 * - Type-safe user ID checking
 * 
 * @param userId - User ID to check
 * @param onlineUsers - Map or Set of online user IDs
 * @returns True if user is online
 * 
 * @example
 * ```typescript
 * const onlineUsers = new Set(['user-123', 'user-456']);
 * const isOnline = isUserOnline('user-123', onlineUsers); // true
 * ```
 */
export function isUserOnline(
  userId: string,
  onlineUsers: Set<string> | Map<string, unknown>
): boolean {
  if (onlineUsers instanceof Set) {
    return onlineUsers.has(userId);
  }
  return onlineUsers instanceof Map && onlineUsers.has(userId);
}

/**
 * Gets the count of online users
 * 
 * @param onlineUsers - Map or Set of online user IDs
 * @returns Number of online users
 */
export function getOnlineUserCount(onlineUsers: Set<string> | Map<string, unknown>): number {
  return onlineUsers.size;
}

/**
 * Adds a user to the online users collection
 * 
 * @param userId - User ID to add
 * @param onlineUsers - Map or Set of online user IDs
 */
export function addUserOnline(userId: string, onlineUsers: Set<string> | Map<string, unknown>): void {
  if (onlineUsers instanceof Set) {
    onlineUsers.add(userId);
  } else if (onlineUsers instanceof Map) {
    onlineUsers.set(userId, new Date().toISOString());
  }
}

/**
 * Removes a user from the online users collection
 * 
 * @param userId - User ID to remove
 * @param onlineUsers - Map or Set of online user IDs
 */
export function removeUserOnline(userId: string, onlineUsers: Set<string> | Map<string, unknown>): void {
  if (onlineUsers instanceof Set) {
    onlineUsers.delete(userId);
  } else if (onlineUsers instanceof Map) {
    onlineUsers.delete(userId);
  }
}

// =============================================================================
// 10. delay
// =============================================================================

/**
 * Creates a promise that resolves after a specified delay
 * 
 * Why this is useful:
 * - Useful for testing and debugging
 * - Implements retry logic with delays
 * - Rate limiting and backoff strategies
 * 
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 * 
 * @example
 * ```typescript
 * // Wait for 1 second
 * await delay(1000);
 * 
 * // Retry with exponential backoff
 * for (let attempt = 1; attempt <= 3; attempt++) {
 *   try {
 *     await someOperation();
 *     break;
 *   } catch (error) {
 *     await delay(Math.pow(2, attempt) * 1000);
 *   }
 * }
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a debounced version of a function
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(this, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Creates a throttled version of a function
 * 
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// =============================================================================
// 11. createError
// =============================================================================

/**
 * Creates a standardized AppError with proper configuration
 * 
 * Why this is useful:
 * - Centralizes error creation logic
 * - Ensures consistent error structure
 * - Provides type-safe error creation
 * 
 * @param options - Error configuration options
 * @returns AppError instance
 * 
 * @example
 * ```typescript
 * // Validation error
 * throw createError({
 *   message: 'Invalid email format',
 *   statusCode: 400,
 *   type: ErrorType.VALIDATION_ERROR
 * });
 * 
 * // Not found error
 * throw createError({
 *   message: 'User not found',
 *   statusCode: 404,
 *   type: ErrorType.NOT_FOUND_ERROR
 * });
 * ```
 */
export function createError(options: CustomErrorOptions): AppError {
  const {
    message,
    statusCode = 500,
    type = ErrorType.INTERNAL_ERROR,
    details,
    isOperational = true
  } = options;
  
  const error = new AppError(message, statusCode, isOperational, details);
  error.name = type;
  
  return error;
}

/**
 * Creates a validation error
 */
export function createValidationError(message: string, details?: unknown): AppError {
  return createError({
    message,
    statusCode: 400,
    type: ErrorType.VALIDATION_ERROR,
    details
  });
}

/**
 * Creates an authentication error
 */
export function createAuthenticationError(message: string = 'Authentication failed'): AppError {
  return createError({
    message,
    statusCode: 401,
    type: ErrorType.AUTHENTICATION_ERROR
  });
}

/**
 * Creates an authorization error
 */
export function createAuthorizationError(message: string = 'Not authorized'): AppError {
  return createError({
    message,
    statusCode: 403,
    type: ErrorType.AUTHORIZATION_ERROR
  });
}

/**
 * Creates a not found error
 */
export function createNotFoundError(resource: string = 'Resource'): AppError {
  return createError({
    message: `${resource} not found`,
    statusCode: 404,
    type: ErrorType.NOT_FOUND_ERROR
  });
}

/**
 * Creates a conflict error
 */
export function createConflictError(message: string = 'Resource conflict'): AppError {
  return createError({
    message,
    statusCode: 409,
    type: ErrorType.VALIDATION_ERROR
  });
}

// =============================================================================
// 12. safeJsonParse
// =============================================================================

/**
 * Safely parses JSON without throwing exceptions
 * 
 * Why this is useful:
 * - Prevents crashes from malformed JSON
 * - Returns default value on parse failure
 * - Useful for parsing data from external sources
 * 
 * @param jsonString - JSON string to parse
 * @param defaultValue - Value to return if parsing fails
 * @returns Parsed object or default value
 * 
 * @example
 * ```typescript
 * const data = safeJsonParse('{ invalid json }', {});
 * // Returns: {} (default value) instead of throwing
 * 
 * const config = safeJsonParse(process.env.CONFIG_JSON, { debug: false });
 * ```
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely stringifies an object
 * 
 * @param value - Value to stringify
 * @param defaultValue - Default value if stringification fails
 * @returns JSON string or default value
 */
export function safeJsonStringify<T>(
  value: T,
  defaultValue: string = 'null'
): string {
  try {
    return JSON.stringify(value);
  } catch {
    return defaultValue;
  }
}

/**
 * Parses JSON with type validation
 * 
 * @param jsonString - JSON string to parse
 * @param validator - Function to validate parsed value
 * @param defaultValue - Default value if parsing or validation fails
 */
export function safeJsonParseWithValidation<T>(
  jsonString: string,
  validator: (value: unknown) => value is T,
  defaultValue: T
): T {
  try {
    const parsed = JSON.parse(jsonString);
    if (validator(parsed)) {
      return parsed;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

// =============================================================================
// Additional Utility Functions
// =============================================================================

/**
 * Escapes HTML special characters to prevent XSS
 * 
 * @param str - String to escape
 * @returns Escaped string
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Truncates a string to a specified length
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - suffix.length)}${suffix}`;
}

/**
 * Generates a hash from a string
 * 
 * @param input - String to hash
 * @param algorithm - Hash algorithm (default: 'sha256')
 * @returns Hash string
 */
export function hashString(input: string, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(input).digest('hex');
}

/**
 * Checks if a string is a valid email format
 * 
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Checks if a string is a valid URL format
 * 
 * @param url - URL string to validate
 * @returns True if valid URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Deep clones an object
 * 
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Picks specific fields from an object
 * 
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns Object with only picked keys
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omits specific fields from an object
 * 
 * @param obj - Source object
 * @param keysToOmit - Keys to omit
 * @returns Object without omitted keys
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keysToOmit: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keysToOmit) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Groups array items by a key
 * 
 * @param array - Array to group
 * @param keyFn - Function to get grouping key
 * @returns Grouped object
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Removes duplicate values from an array
 * 
 * @param array - Array to deduplicate
 * @returns Array with unique values
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Flattens a nested array
 * 
 * @param array - Nested array
 * @param depth - Depth to flatten (default: 1)
 * @returns Flattened array
 */
export function flatten<T>(array: T[], depth: number = 1): T[] {
  return array.flat(depth) as T[];
}

// =============================================================================
// Export all functions
// =============================================================================

export default {
  // Username generation
  generateUniqueUsername,
  
  // Response formatting
  formatResponse,
  formatErrorResponse,
  
  // Pagination
  createPagination,
  calculatePaginationParams,
  
  // User sanitization
  sanitizeUser,
  sanitizeUsers,
  
  // Chat room ID generation
  generateChatRoomId,
  generateGroupRoomId,
  
  // Validation
  validateRequiredFields,
  validateWithCustomRules,
  
  // ID generation
  generateRandomId,
  generateUUID,
  
  // Timestamp formatting
  formatTimestamp,
  formatChatMessage,
  
  // Online status
  isUserOnline,
  getOnlineUserCount,
  addUserOnline,
  removeUserOnline,
  
  // Async utilities
  delay,
  debounce,
  throttle,
  
  // Error creation
  createError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  
  // JSON utilities
  safeJsonParse,
  safeJsonStringify,
  safeJsonParseWithValidation,
  
  // String utilities
  escapeHtml,
  truncateString,
  isValidEmail,
  isValidUrl,
  
  // Crypto utilities
  hashString,
  
  // Object utilities
  deepClone,
  pick,
  omit,
  
  // Array utilities
  groupBy,
  unique,
  flatten
};