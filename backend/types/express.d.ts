import { Request } from 'express';
import { User } from './user.types';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};