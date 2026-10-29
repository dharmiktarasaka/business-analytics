import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { repository } from '../db/repository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'stratiq_enterprise_secret_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name?: string;
    mobileNumber?: string;
    yearlyRevenue?: string;
    picture?: string;
  };
}

export function generateToken(payload: { uid: string; email: string; name?: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { uid: string; email: string; name?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const devUserIdHeader = req.headers['x-user-id'] as string;
  const devUserEmailHeader = req.headers['x-user-email'] as string;
  const devUserNameHeader = req.headers['x-user-name'] as string;

  // 1. Verify Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();

    // Check custom JWT
    const decoded = verifyToken(token);
    if (decoded) {
      const dbUser = await repository.getUserByUid(decoded.uid);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        name: dbUser?.displayName || decoded.name || 'Executive User',
        mobileNumber: dbUser?.mobileNumber,
        yearlyRevenue: dbUser?.yearlyRevenue,
        picture: dbUser?.photoURL
      };
      return next();
    }

    // Support dev tokens or legacy base64 tokens
    if (token.startsWith('dev_token_') || token.startsWith('eyJ')) {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
          req.user = {
            uid: payload.uid || payload.sub || 'dev_user_1',
            email: payload.email || 'developer@example.com',
            name: payload.name || 'Executive User'
          };
          return next();
        }
      } catch {
        // ignore
      }
    }
  }

  // 2. Fallback header for development
  if (devUserIdHeader) {
    const dbUser = await repository.getUserByUid(devUserIdHeader);
    req.user = {
      uid: devUserIdHeader,
      email: devUserEmailHeader || dbUser?.email || 'user@example.com',
      name: devUserNameHeader || dbUser?.displayName || 'Executive Leader',
      mobileNumber: dbUser?.mobileNumber,
      yearlyRevenue: dbUser?.yearlyRevenue
    };
    return next();
  }

  res.status(401).json({
    success: false,
    error: 'Authentication required. Please sign in.'
  });
}
