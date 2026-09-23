import { z } from "zod";

import { readSessionUser } from "@/lib/auth";
import { canManagePositions } from "@/lib/auth/rbac";
import { positionFormSchema } from "@/lib/jobs/input";
import { createManagedPosition, proposePositionEdit } from "@/lib/jobs/service";
import { readJsonBody } from "@/lib/http/body";
import { fieldErrorsFromZod, HttpError, isSameOrigin, jsonError } from "@/lib/http/errors";

export const dynamic = "force-dynamic";

const createSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("propose"),
    sourceId: z.string().uuid(),
  }),
  z.object({
    action: z.enum(["save", "submit", "publish"]),
    position: z.unknown(),
  }),
]);

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "درخواست نامعتبر است.");
  }

  const user = await readSessionUser();
  if (!user) return jsonError(401, "نشست نامعتبر است.");
  if (!canManagePositions(user.role)) {
    return jsonError(403, "به بخش موقعیت‌های شغلی دسترسی ندارید.");
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
    return jsonError(422, "اطلاعات موقعیت کامل نیست.");
  }

  try {
    if (parsed.data.action === "propose") {
      const created = await proposePositionEdit(user, parsed.data.sourceId);
      return Response.json({ ok: true, id: created.id, status: created.status });
    }

    const position = positionFormSchema.safeParse(parsed.data.position);
    if (!position.success) {
      return jsonError(422, "اطلاعات موقعیت کامل نیست.", {
        fields: fieldErrorsFromZod(position.error),
      });
    }

    const created = await createManagedPosition(user, position.data, parsed.data.action);
    return Response.json({ ok: true, id: created.id, status: created.status });
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    throw error;
  }
}
