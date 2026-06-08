import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(ApiResponse.failure(err.message));
  }

  if (err instanceof ZodError) {
    const message = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json(ApiResponse.failure(`Validation Error: ${message}`));
  }

  console.error('Unexpected error:', err);
  return res.status(500).json(ApiResponse.failure('Internal server error'));
};
