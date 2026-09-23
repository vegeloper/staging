import { getStoredObject } from "@/lib/media/library";
import { mediaFileResponse } from "@/lib/media/stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID.test(id)) return new Response(null, { status: 404 });
  const stored = await getStoredObject(id, "file");
  if (!stored) return new Response(null, { status: 404 });
  return mediaFileResponse({
    key: stored.key,
    mimeType: stored.mimeType,
    downloadName: stored.name,
    request,
    cacheControl: "private, max-age=3600",
    allowRange: stored.kind === "video",
  });
}
