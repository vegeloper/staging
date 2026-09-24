import { stat } from "node:fs/promises";

import { resolveMediaKey } from "@/lib/media/files";
import { getStoredObject } from "@/lib/media/library";
import { mediaFileResponse } from "@/lib/media/stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID.test(id)) return missingFile(request, "");
  const stored = await getStoredObject(id, "file");
  if (!stored) return missingFile(request, "");
  try {
    await stat(resolveMediaKey(stored.key));
  } catch {
    return missingFile(request, stored.name);
  }
  return mediaFileResponse({
    key: stored.key,
    mimeType: stored.mimeType,
    downloadName: stored.name,
    request,
    cacheControl: "private, max-age=3600",
    allowRange: stored.kind === "video",
  });
}

function missingFile(request: Request, name: string) {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    const url = new URL("/admin/files/missing", request.url);
    if (name) url.searchParams.set("name", name.slice(0, 180));
    return Response.redirect(url, 303);
  }
  return new Response(null, { status: 404 });
}
