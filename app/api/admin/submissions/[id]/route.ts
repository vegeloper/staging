import { jsonError, HttpError, isSameOrigin } from "@/lib/http/errors";
import { readJsonBody } from "@/lib/http/body";
import { readSessionUser } from "@/lib/auth";
import { canManageSubmissions } from "@/lib/auth/rbac";
import { updateSubmissionStatus } from "@/lib/submissions/service";
import { submissionStatuses } from "@/lib/forms/shared";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(submissionStatuses),
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
  if (!canManageSubmissions(user.role)) {
    return jsonError(403, "به صندوق درخواست‌ها دسترسی ندارید.");
  }

  const { id } = await context.params;
  let payload: unknown;
  try {
    payload = await readJsonBody(request, 4 * 1024);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonError(error.status, error.message);
    }
    return jsonError(400, "قالب درخواست نامعتبر است.");
  }

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(422, "وضعیت نامعتبر است.");
  }

  const updated = await updateSubmissionStatus(id, parsed.data.status, user.id);
  if (!updated) return jsonError(404, "درخواست پیدا نشد.");

  return Response.json({ ok: true, status: updated.status });
}
