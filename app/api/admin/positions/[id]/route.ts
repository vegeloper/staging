import { z } from "zod";

import { readSessionUser } from "@/lib/auth";
import { canManagePositions } from "@/lib/auth/rbac";
import { positionFormSchema } from "@/lib/jobs/input";
import { updateManagedPosition } from "@/lib/jobs/service";
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
  position: z.unknown().optional(),
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
  if (!canManagePositions(user.role)) {
    return jsonError(403, "به بخش موقعیت‌های شغلی دسترسی ندارید.");
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
    return jsonError(422, "اطلاعات موقعیت کامل نیست.");
  }

  let position: z.infer<typeof positionFormSchema> | undefined;
  if (parsed.data.position !== undefined) {
    const parsedPosition = positionFormSchema.safeParse(parsed.data.position);
    if (!parsedPosition.success) {
      return jsonError(422, "اطلاعات موقعیت کامل نیست.", {
        fields: fieldErrorsFromZod(parsedPosition.error),
      });
    }
    position = parsedPosition.data;
  }

  try {
    const updated = await updateManagedPosition(
      user,
      id,
      position,
      parsed.data.action,
      parsed.data.note,
    );
    return Response.json({ ok: true, id: updated.id, status: updated.status });
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    throw error;
  }
}
