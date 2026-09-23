import { cookies } from "next/headers";

import { changeOwnPassword, changePasswordSchema } from "@/lib/auth/change-password";
import { readSessionUser, SESSION_COOKIE } from "@/lib/auth";
import { readJsonBody } from "@/lib/http/body";
import { fieldErrorsFromZod, HttpError, isSameOrigin, jsonError } from "@/lib/http/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "درخواست نامعتبر است.");
  const user = await readSessionUser();
  if (!user) return jsonError(401, "نشست نامعتبر است.");

  let payload: unknown;
  try {
    payload = await readJsonBody(request, 8 * 1024);
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    return jsonError(400, "قالب درخواست نامعتبر است.");
  }

  const parsed = changePasswordSchema.safeParse(payload);
  if (!parsed.success) {
    const fields = fieldErrorsFromZod(parsed.error);
    const message = Object.values(fields)[0] || "رمز عبور نامعتبر است.";
    return jsonError(422, message, { fields });
  }

  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    await changeOwnPassword(user.id, parsed.data, token);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    console.error(error);
    return jsonError(500, "تغییر رمز ناموفق بود.");
  }
}
