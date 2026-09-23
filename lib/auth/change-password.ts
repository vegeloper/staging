import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { HttpError } from "@/lib/http/errors";

import { hashPassword, verifyPassword } from "./password";
import { clearFailedLogins, hashSessionToken, registerFailedLogin } from "./session";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "رمز فعلی را وارد کنید.").max(200),
    newPassword: z.string().min(12, "رمز جدید حداقل ۱۲ نویسه است.").max(200),
    confirmPassword: z.string().min(1, "تکرار رمز را وارد کنید.").max(200),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "تکرار رمز با رمز جدید یکی نیست.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "رمز جدید باید با رمز فعلی فرق داشته باشد.",
    path: ["newPassword"],
  });

export async function changeOwnPassword(
  userId: string,
  input: z.infer<typeof changePasswordSchema>,
  currentToken: string | undefined,
) {
  const [user] = await getDb().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isActive) throw new HttpError(401, "نشست نامعتبر است.");
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new HttpError(423, "حساب به‌طور موقت قفل شده است. بعداً تلاش کنید.");
  }

  const currentOk = await verifyPassword(user.passwordHash, input.currentPassword);
  if (!currentOk) {
    await registerFailedLogin(user.id, user.failedLoginCount);
    throw new HttpError(401, "رمز فعلی نادرست است.");
  }

  await getDb()
    .update(users)
    .set({
      passwordHash: await hashPassword(input.newPassword),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  await clearFailedLogins(user.id);

  if (currentToken) {
    await getDb()
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, user.id), ne(sessions.tokenHash, hashSessionToken(currentToken))));
  }
}
