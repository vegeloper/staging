import { readSessionUser } from "@/lib/auth";
import { readJsonBody } from "@/lib/http/body";
import { HttpError, isSameOrigin, jsonError } from "@/lib/http/errors";
import { isRemovableKind, removeRecords } from "@/lib/admin/remove-records";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "درخواست نامعتبر است.");
  const user = await readSessionUser();
  if (!user) return jsonError(401, "نشست نامعتبر است.");

  let payload: unknown;
  try {
    payload = await readJsonBody(request, 16 * 1024);
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    return jsonError(400, "قالب درخواست نامعتبر است.");
  }

  const body = payload as { kind?: unknown; ids?: unknown };
  if (!isRemovableKind(body.kind)) return jsonError(422, "نوع حذف نامعتبر است.");

  try {
    const deleted = await removeRecords(user, body.kind, body.ids);
    return Response.json({ ok: true, deleted });
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    throw error;
  }
}
