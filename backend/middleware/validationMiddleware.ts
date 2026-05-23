import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/error.types';

/**
 * Validation Rule Interface
 * Defines the structure for validation rules
 */
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null; // Returns error message or null if valid
  enum?: any[];
}

/**
 * Validation Error Interface
 */
export interface FieldValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validate Request Data Middleware
 * 
 * This middleware validates request data (body, params, query) against
 * specified validation rules and returns detailed error messages.
 * 
 * @param rules - Array of validation rules
 * @param location - Where to validate ('body', 'params', 'query')
 * @returns Express middleware function
 * 
 * @example
 * // Validate user creation
 * router.post('/users',
 *   validateRequest([
 *     { field: 'email', required: true, type: 'email' },
 *     { field: 'password', required: true, minLength: 8 },
 *     { field: 'name', required: true, minLength: 2, maxLength: 50 }
 *   ]),
 *   userController.createUser
 * );
 */
export const validateRequest = (
  rules: ValidationRule[],
  location: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: FieldValidationError[] = [];
    const data = req[location];

    for (const rule of rules) {
      const value = data[rule.field];

      // Check if required field is missing
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: rule.field,
          message: `${rule.field} is required`
        });
        continue;
      }

      // Skip further validation if field is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (rule.type) {
        const typeError = validateType(rule.field, value, rule.type);
        if (typeError) {
          errors.push(typeError);
          continue;
        }
      }

      // String length validation
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at least ${rule.minLength} characters long`,
            value
          });
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must not exceed ${rule.maxLength} characters`,
            value
          });
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push({
            field: rule.field,
            message: `${rule.field} format is invalid`,
            value
          });
        }
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be one of: ${rule.enum.join(', ')}`,
          value
        });
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors.push({
            field: rule.field,
            message: customError,
            value
          });
        }
      }
    }

    // If there are validation errors, return 400 Bad Request
    if (errors.length > 0) {
      const error = new AppError(
        'Validation failed',
        400,
        true,
        errors
      );
      return next(error);
    }

    next();
  };
};

/**
 * Validate type of a value
 */
const validateType = (
  field: string,
  value: any,
  expectedType: string
): FieldValidationError | null => {
  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          field,
          message: `${field} must be a string`,
          value
        };
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          field,
          message: `${field} must be a valid number`,
          value
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return {
          field,
          message: `${field} must be a boolean`,
          value
        };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return {
          field,
          message: `${field} must be an array`,
          value
        };
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        return {
          field,
          message: `${field} must be an object`,
          value
        };
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value !== 'string' || !emailRegex.test(value)) {
        return {
          field,
          message: `${field} must be a valid email address`,
          value
        };
      }
      break;
  }

  return null;
};

/**
 * Validate request body specifically
 * Shorthand for validateRequest with location='body'
 */
export const validateBody = (rules: ValidationRule[]) => {
  return validateRequest(rules, 'body');
};

/**
 * Validate request params specifically
 * Shorthand for validateRequest with location='params'
 */
export const validateParams = (rules: ValidationRule[]) => {
  return validateRequest(rules, 'params');
};

/**
 * Validate request query specifically
 * Shorthand for validateRequest with location='query'
 */
export const validateQuery = (rules: ValidationRule[]) => {
  return validateRequest(rules, 'query');
};

/**
 * Common validation rules for reuse
 */
export const commonRules = {
  email: {
    field: 'email',
    required: true,
    type: 'email' as const
  },
  password: {
    field: 'password',
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
      return null;
    }
  },
  name: {
    field: 'name',
    required: true,
    type: 'string' as const,
    minLength: 2,
    maxLength: 100
  },
  id: {
    field: 'id',
    required: true,
    type: 'string' as const
  }
};

export default {
  validateRequest,
  validateBody,
  validateParams,
  validateQuery,
  commonRules
};