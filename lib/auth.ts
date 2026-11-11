import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'civicsense-secure-jwt-secret-key-2026';
export const AUTH_COOKIE_NAME = 'civicsense_token';

export interface TokenPayload {
  id: number;
  username: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(req?: NextRequest): Promise<TokenPayload | null> {
  // Check authorization header first if request provided
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verified = verifyToken(token);
      if (verified) return verified;
    }
  }

  // Check cookies
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      return verifyToken(token);
    }
  } catch {
    // If called outside request context
  }

  return null;
}

