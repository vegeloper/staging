import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { getEnv } from "@/lib/env";
import type { UserRole } from "./rbac";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };

const IDLE_MS = 12 * 60 * 60 * 1000;
const ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;
const LOCKOUT_AFTER = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
};

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function cookieOptions() {
  const { APP_ORIGIN } = getEnv();
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: APP_ORIGIN.startsWith("https://"),
    path: "/",
    maxAge: IDLE_MS / 1000,
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await getDb().insert(sessions).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(now + IDLE_MS),
    absoluteExpiresAt: new Date(now + ABSOLUTE_MS),
  });
  return token;
}

export async function readSessionUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const [row] = await getDb()
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      absoluteExpiresAt: sessions.absoluteExpiresAt,
      revokedAt: sessions.revokedAt,
      userId: users.id,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.revokedAt || !row.isActive) return null;

  const now = new Date();
  if (row.expiresAt <= now || row.absoluteExpiresAt <= now) return null;

  const nextIdleExpiry = new Date(now.getTime() + IDLE_MS);
  const cappedExpiry =
    nextIdleExpiry < row.absoluteExpiresAt
      ? nextIdleExpiry
      : row.absoluteExpiresAt;

  await getDb()
    .update(sessions)
    .set({ expiresAt: cappedExpiry })
    .where(eq(sessions.id, row.sessionId));

  return {
    id: row.userId,
    username: row.username,
    role: row.role,
  };
}

export async function revokeCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;

  await getDb()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, hashSessionToken(token)));
}

export async function registerFailedLogin(userId: string, failedCount: number) {
  const nextCount = failedCount + 1;
  await getDb()
    .update(users)
    .set({
      failedLoginCount: nextCount,
      lockedUntil:
        nextCount >= LOCKOUT_AFTER ? new Date(Date.now() + LOCKOUT_MS) : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function clearFailedLogins(userId: string) {
  await getDb()
    .update(users)
    .set({
      failedLoginCount: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export function tokensEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export { LOCKOUT_AFTER, LOCKOUT_MS };
