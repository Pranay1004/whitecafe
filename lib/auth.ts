// ============================================
// Auth Utilities — JWT + bcrypt
// ============================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { UserPayload, UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'iist-cafeteria-dev-secret-change-in-production';
const JWT_EXPIRY = '24h';
const BCRYPT_ROUNDS = 10;

// ---- PIN Hashing ----
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// ---- JWT ----
export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export function extractRole(token: string): UserRole | null {
  const payload = verifyToken(token);
  return payload?.role ?? null;
}

// ---- Request Helpers ----
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export function authenticateRequest(request: Request): UserPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(request: Request, role: UserRole): UserPayload {
  const user = authenticateRequest(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  if (user.role !== role && user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}

// ---- Code Generation ----
export function generateCode(): number {
  return Math.floor(Math.random() * 90) + 10; // 10-99
}

export function generateBookingId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I,O,0,1 to avoid confusion
  let id = 'BK-';
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
