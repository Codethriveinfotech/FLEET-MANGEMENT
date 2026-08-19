import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedException, ForbiddenException } from '../utils/errors';
import { UserRole } from '@fleettrack/shared';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Authentication token required');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'super-secret-access-token-key-change-in-production'
    ) as { id: string; email: string; role: UserRole };

    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedException('Invalid or expired authentication token');
  }
};

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedException('User session not found');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('Insufficient permissions to perform this action');
    }

    next();
  };
};
