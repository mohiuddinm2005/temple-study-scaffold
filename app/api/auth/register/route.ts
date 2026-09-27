import { randomUUID, scryptSync, randomBytes } from 'node:crypto';
import { sameOrigin, startSession } from '@/lib/auth/sessions';
import { getDb } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return Response.json({ error: 'Invalid input' }, { status: 400 });
  const { email, password } = input as Record<string, unknown>;
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' || password.length < 12 || password.length > 256) return Response.json({ error: 'Invalid registration details' }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();
  const db = getDb();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)) {
    return Response.json({ error: 'Account already exists' }, { status: 409 });
  }
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  const id = randomUUID();
  try {
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(id, normalizedEmail, `${salt}:${hash}`, new Date().toISOString());
  } catch { return Response.json({ error: 'Account already exists' }, { status: 409 }); }
  const response = Response.json({ id, email: normalizedEmail }, { status: 201 });
  startSession(id, request, response);
  return response;
}
