import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * AsyncHandler - Wrapper for async controller functions
 * 
 * This middleware eliminates the need for repetitive try-catch blocks
 * in async controller functions by automatically catching errors and
 * passing them to the next middleware (error handler).
 * 
 * @param fn - Async controller function to wrap
 * @returns Express RequestHandler
 * 
 * @example
 * // Without asyncHandler
 * const getUser = async (req: Request, res: Response, next: NextFunction) => {
 *   try {
 *     const user = await userService.findById(req.params.id);
 *     res.json(user);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 * 
 * // With asyncHandler
 * const getUser = asyncHandler(async (req: Request, res: Response) => {
 *   const user = await userService.findById(req.params.id);
 *   res.json(user);
 * });
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;