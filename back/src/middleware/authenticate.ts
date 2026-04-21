import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/auth';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env['JWT_SECRET'];

  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const payload = decoded as JwtPayload;
    if (!UUID_RE.test(payload.userId)) {
      res.status(401).json({ error: 'Token issued before UUID migration — please log in again' });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
