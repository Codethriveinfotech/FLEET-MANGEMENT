import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof HttpException) {
    logger.warn(`HttpException [${req.method} ${req.path}] - Status: ${error.statusCode} - Message: ${error.message}`);
    return sendError(res, error.message, error.errors, error.statusCode);
  }

  logger.error(`Unhandled Internal Error: ${error.message} \nStack: ${error.stack}`);
  
  return sendError(
    res,
    'Internal server error occurred',
    process.env.NODE_ENV === 'development' ? [error.message] : undefined,
    500
  );
};
