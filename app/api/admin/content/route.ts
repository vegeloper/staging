import { z } from "zod";

import { readSessionUser } from "@/lib/auth";
import { canAccessCms } from "@/lib/auth/rbac";
import { createManagedContent } from "@/lib/cms/service";
import { contentFormSchema } from "@/lib/cms/input";
import { readJsonBody } from "@/lib/http/body";
import { fieldErrorsFromZod, HttpError, isSameOrigin, jsonError } from "@/lib/http/errors";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  action: z.enum(["save", "submit", "publish"]),
  post: z.unknown(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "درخواست نامعتبر است.");
  }

  const user = await readSessionUser();
  if (!user) return jsonError(401, "نشست نامعتبر است.");
  if (!canAccessCms(user.role)) {
    return jsonError(403, "به بخش مطالب دسترسی ندارید.");
  }

  let payload: unknown;
  try {
    payload = await readJsonBody(request, 64 * 1024);
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    return jsonError(400, "قالب درخواست نامعتبر است.");
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(422, "اطلاعات مطلب کامل نیست.");
  }

  const post = contentFormSchema.safeParse(parsed.data.post);
  if (!post.success) {
    return jsonError(422, "اطلاعات مطلب کامل نیست.", {
      fields: fieldErrorsFromZod(post.error),
    });
  }

  try {
    const created = await createManagedContent(user, post.data, parsed.data.action);
    return Response.json({ ok: true, id: created.id, status: created.status });
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    throw error;
  }
}
