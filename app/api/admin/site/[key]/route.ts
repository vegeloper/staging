import { readSessionUser } from "@/lib/auth";
import { readJsonBody } from "@/lib/http/body";
import { HttpError, isSameOrigin, jsonError } from "@/lib/http/errors";
import { invalidatePublishedSite } from "@/lib/site/public";
import { saveSiteDocument, siteDocumentKeys, type SiteDocumentKey } from "@/lib/site/store";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "درخواست نامعتبر است.");
  }

  const user = await readSessionUser();
  if (!user) return jsonError(401, "نشست نامعتبر است.");

  const { key } = await context.params;
  if (!siteDocumentKeys.includes(key as SiteDocumentKey)) {
    return jsonError(404, "این بخش وجود ندارد.");
  }

  let payload: unknown;
  try {
    payload = await readJsonBody(request, 64 * 1024);
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.status, error.message);
    return jsonError(400, "قالب درخواست نامعتبر است.");
  }

  const body = payload as { action?: unknown; document?: unknown };
  if (body.action !== "save" && body.action !== "publish") {
    return jsonError(422, "عملیات نامعتبر است.");
  }

  try {
    const saved = await saveSiteDocument(user, key as SiteDocumentKey, body.document, body.action);
    if (body.action === "publish") invalidatePublishedSite();
    return Response.json({ ok: true, ...saved });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonError(error.status, error.message, error.payload);
    }
    throw error;
  }
}
