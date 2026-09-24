import { canAccessCms, canManageSite, readSessionUser } from "@/lib/auth";
import { readJsonBody } from "@/lib/http/body";
import { HttpError, isSameOrigin, jsonError } from "@/lib/http/errors";
import { MediaFailure, deleteMedia, getMedia, publicMedia, updateMediaMeta } from "@/lib/media/library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorized(request: Request, method: "GET" | "PATCH" | "DELETE") {
  if (method !== "GET" && !isSameOrigin(request)) {
    return { error: jsonError(403, "درخواست نامعتبر است.") } as const;
  }
  const user = await readSessionUser();
  if (!user) return { error: jsonError(401, "نشست نامعتبر است.") } as const;
  if (method === "DELETE" ? !canManageSite(user.role) : !canAccessCms(user.role)) {
    return { error: jsonError(403, method === "DELETE" ? "فقط مدیر وب‌سایت می‌تواند رسانه را حذف کند." : "به کتابخانه رسانه دسترسی ندارید.") } as const;
  }
  return { user } as const;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorized(request, "GET");
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  if (!UUID.test(id)) return jsonError(404, "رسانه پیدا نشد.");
  const asset = await getMedia(id);
  if (!asset) return jsonError(404, "رسانه پیدا نشد.");
  return Response.json({ ok: true, asset: publicMedia(asset) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorized(request, "PATCH");
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  if (!UUID.test(id)) return jsonError(404, "رسانه پیدا نشد.");

  let payload: unknown;
  try {
    payload = await readJsonBody(request, 8 * 1024);
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    return jsonError(400, "قالب درخواست نامعتبر است.");
  }
  const body = payload as { description?: unknown; altText?: unknown };
  if (typeof body.description !== "string" || typeof body.altText !== "string") {
    return jsonError(422, "توضیح رسانه کامل نیست.");
  }

  try {
    const asset = await updateMediaMeta(auth.user, id, {
      description: body.description,
      altText: body.altText,
    });
    return Response.json({ ok: true, asset });
  } catch (error) {
    if (error instanceof MediaFailure) return jsonError(422, error.message);
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    throw error;
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorized(request, "DELETE");
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  if (!UUID.test(id)) return jsonError(404, "رسانه پیدا نشد.");
  try {
    await deleteMedia(auth.user, id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    throw error;
  }
}
