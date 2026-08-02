import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  sub: string;   // user ID
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any,
    issuer: 'wa-platform',
    audience: 'wa-client',
  };
  return jwt.sign(payload as object, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'wa-platform',
    audience: 'wa-client',
  }) as JWTPayload;
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
