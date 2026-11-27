import type { NextFunction, Request, Response } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';
import { findActiveApiKeyWithUser } from '../db/repositories.ts';

export interface AuthenticatedContext {
  userId: number;
  uid: string;
  email: string;
  displayName: string;
  planTier: string;
  authMethod: 'firebase' | 'api_key';
  apiKeyId: string | null;
  scopes: string[];
}

export interface AuthRequest extends Request {
  auth?: AuthenticatedContext;
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(bucketKey: string, maxPerMin: number): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const existing = rateBuckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(bucketKey, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, remaining: Math.max(0, maxPerMin - 1), retryAfterSec: 60 };
  }

  if (existing.count >= maxPerMin) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxPerMin - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

function extractCredential(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string' && apiKeyHeader.trim()) {
    return apiKeyHeader.trim();
  }
  return null;
}

async function authenticateToken(
  token: string,
): Promise<{ auth: AuthenticatedContext; limitPerMin: number; bucketKey: string }> {
  if (token.startsWith('pm_live_')) {
    const match = await findActiveApiKeyWithUser(token);
    if (!match) {
      throw new Error('Invalid or revoked API key.');
    }
    const scopes = String(match.apiKey.scopes || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      auth: {
        userId: match.user.id,
        uid: match.user.uid,
        email: match.user.email,
        displayName: match.user.displayName || '',
        planTier: match.user.planTier,
        authMethod: 'api_key',
        apiKeyId: match.apiKey.id,
        scopes,
      },
      limitPerMin: match.apiKey.rateLimitPerMin || 60,
      bucketKey: `key:${match.apiKey.id}`,
    };
  }

  const decoded = await adminAuth.verifyIdToken(token);
  const dbUser = await getOrCreateUser(
    decoded.uid,
    decoded.email || `${decoded.uid}@users.premarks.local`,
    decoded.name || '',
  );

  return {
    auth: {
      userId: dbUser.id,
      uid: dbUser.uid,
      email: dbUser.email,
      displayName: dbUser.displayName || '',
      planTier: dbUser.planTier,
      authMethod: 'firebase',
      apiKeyId: null,
      scopes: ['decks:read', 'decks:write', 'mcp', 'ai'],
    },
    limitPerMin: 120,
    bucketKey: `user:${dbUser.id}`,
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractCredential(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required (Bearer token or X-API-Key).' });
  }

  try {
    const resolved = await authenticateToken(token);
    const rate = checkRateLimit(resolved.bucketKey, resolved.limitPerMin);
    res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return res.status(429).json({ error: 'Rate limit exceeded. Retry shortly.' });
    }
    req.auth = resolved.auth;
    return next();
  } catch (err) {
    console.warn('Auth rejection:', (err as Error).message);
    return res.status(401).json({ error: 'Unauthorized: invalid or expired credentials.' });
  }
};

export const requireMcpAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Per MCP security guidance: never authenticate via cookies or mcp-session-id.
  const token = extractCredential(req);
  if (!token) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="premarks-mcp"');
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized: Bearer API key or Firebase token required.' },
      id: null,
    });
  }

  try {
    const resolved = await authenticateToken(token);
    if (!resolved.auth.scopes.includes('mcp')) {
      return res.status(403).json({
        jsonrpc: '2.0',
        error: { code: -32003, message: 'Forbidden: API key lacks mcp scope.' },
        id: null,
      });
    }
    const rate = checkRateLimit(resolved.bucketKey, resolved.limitPerMin);
    res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      return res.status(429).json({
        jsonrpc: '2.0',
        error: { code: -32029, message: 'Rate limit exceeded.' },
        id: null,
      });
    }
    req.auth = resolved.auth;
    return next();
  } catch (err) {
    res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token"');
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: (err as Error).message || 'Invalid token.' },
      id: null,
    });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractCredential(req);
  if (!token) return next();
  try {
    const resolved = await authenticateToken(token);
    const rate = checkRateLimit(resolved.bucketKey, resolved.limitPerMin);
    res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
    if (rate.allowed) {
      req.auth = resolved.auth;
    }
  } catch {
    // Ignore optional auth parse failure for public routes
  }
  return next();
};
