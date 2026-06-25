// POST /api/login — Authenticate user with ID + pre-hashed PIN
// Security model: client sends sha256(rawPin) via HTTPS.
// Server stores bcrypt(sha256(rawPin)) and compares with bcrypt.compare().
// The raw PIN never travels over the network.
export const runtime = 'nodejs';

import { createHash } from 'crypto';
import { hashPin, verifyPin, generateToken } from '@/lib/auth';
import { userStore, seedIfNeeded } from '@/lib/store';
import type { LoginRequest, ApiResponse, LoginResponse } from '@/lib/types';

/** Server-side SHA-256 used only for student auto-provision path */
function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export async function POST(request: Request) {
  try {
    await seedIfNeeded();
    const body = (await request.json()) as LoginRequest;

    if (!body.id || !body.pin) {
      return Response.json(
        { success: false, error: 'User ID and PIN are required' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Normalize ID to uppercase
    const userId = body.id.trim().toUpperCase();

    // Lookup user
    let user = userStore.get(userId);
    // Auto-provision: any SC2xxxxx student whose PIN equals sha256(userId)
    if (!user && userId.startsWith('SC2')) {
      const expectedHash = sha256(userId);
      if (body.pin.toLowerCase() === expectedHash) {
        const pinHash = await hashPin(expectedHash);
        const newUser = {
          id: userId,
          pin_hash: pinHash,
          role: 'student' as const,
          name: userId,
          email: `${userId.toLowerCase()}@iist.ac.in`,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          login_attempts: 0,
          locked_until: null,
        };
        userStore.set(userId, newUser);
        user = newUser;
      }
    }

    if (!user) {
      return Response.json(
        { success: false, error: 'Invalid credentials' } satisfies ApiResponse,
        { status: 401 }
      );
    }

    // Check lockout
    if (user.locked_until) {
      const lockExpiry = new Date(user.locked_until);
      if (lockExpiry > new Date()) {
        const remainSec = Math.ceil((lockExpiry.getTime() - Date.now()) / 1000);
        return Response.json(
          {
            success: false,
            error: `Account locked. Try again in ${remainSec}s`,
          } satisfies ApiResponse,
          { status: 429 }
        );
      }
      // Lock expired — reset
      userStore.update(userId, { login_attempts: 0, locked_until: null });
    }

    // Verify PIN — client already sent sha256(rawPin), bcrypt.compare handles the rest
    let valid = false;
    if (userId.startsWith('SC2')) {
      // Accept either auto-provision sha256 match OR stored bcrypt hash
      const expectedHash = sha256(userId);
      if (body.pin.toLowerCase() === expectedHash) {
        valid = true;
      } else {
        valid = await verifyPin(body.pin, user.pin_hash);
      }
    } else {
      valid = await verifyPin(body.pin, user.pin_hash);
    }

    if (!valid) {
      const attempts = (user.login_attempts || 0) + 1;
      const updates: Record<string, unknown> = { login_attempts: attempts };

      // Lock after 3 failures
      if (attempts >= 3) {
        updates.locked_until = new Date(
          Date.now() + 5 * 60 * 1000
        ).toISOString(); // 5 min lockout
      }

      userStore.update(userId, updates as Partial<typeof user>);

      return Response.json(
        {
          success: false,
          error: `Invalid credentials${attempts >= 2 ? ` (${3 - attempts} attempts remaining)` : ''}`,
        } satisfies ApiResponse,
        { status: 401 }
      );
    }

    // Success — reset attempts, update last login
    userStore.update(userId, {
      login_attempts: 0,
      locked_until: null,
      last_login: new Date().toISOString(),
    });

    // Generate JWT
    const token = generateToken({
      id: user.id,
      role: user.role,
      name: user.name,
    });

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          role: user.role,
          name: user.name,
        },
        expires_in: 3600,
      },
    };

    return Response.json(response);
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
