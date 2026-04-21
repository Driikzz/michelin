import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/auth';

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  const secret = process.env['JWT_SECRET'];
  if (!secret) return next();

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
  } catch {
    // Invalid token — continue without user
  }
  next();
}
