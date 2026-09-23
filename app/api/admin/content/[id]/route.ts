import { z } from "zod";

import { readSessionUser } from "@/lib/auth";
import { canAccessCms } from "@/lib/auth/rbac";
import { contentFormSchema } from "@/lib/cms/input";
import { updateManagedContent } from "@/lib/cms/service";
import { readJsonBody } from "@/lib/http/body";
import { fieldErrorsFromZod, HttpError, isSameOrigin, jsonError } from "@/lib/http/errors";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  action: z.enum([
    "save",
    "submit",
    "withdraw",
    "approve",
    "reject",
    "publish",
    "unpublish",
  ]),
  note: z.string().trim().max(500).optional(),
  post: z.unknown().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "درخواست نامعتبر است.");
  }

  const user = await readSessionUser();
  if (!user) return jsonError(401, "نشست نامعتبر است.");
  if (!canAccessCms(user.role)) {
    return jsonError(403, "به بخش مطالب دسترسی ندارید.");
  }

  const { id } = await context.params;
  let payload: unknown;
  try {
    payload = await readJsonBody(request, 64 * 1024);
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    return jsonError(400, "قالب درخواست نامعتبر است.");
  }

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(422, "اطلاعات مطلب کامل نیست.");
  }

  let post: z.infer<typeof contentFormSchema> | undefined;
  if (parsed.data.post !== undefined) {
    const parsedPost = contentFormSchema.safeParse(parsed.data.post);
    if (!parsedPost.success) {
      return jsonError(422, "اطلاعات مطلب کامل نیست.", {
        fields: fieldErrorsFromZod(parsedPost.error),
      });
    }
    post = parsedPost.data;
  }

  try {
    const updated = await updateManagedContent(
      user,
      id,
      post,
      parsed.data.action,
      parsed.data.note,
    );
    return Response.json({ ok: true, id: updated.id, status: updated.status });
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    throw error;
  }
}
