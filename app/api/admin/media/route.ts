import { canAccessCms, readSessionUser } from "@/lib/auth";
import { isSameOrigin, jsonError } from "@/lib/http/errors";
import { MediaFailure, ingestMedia, listMedia } from "@/lib/media/library";
import type { MediaKind } from "@/lib/media/types";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function kindParam(value: string | null): MediaKind | "" {
  return value === "image" || value === "video" ? value : "";
}

function sortParam(value: string | null) {
  if (value === "oldest" || value === "name" || value === "size" || value === "type") return value;
  return "newest" as const;
}

export async function GET(request: Request) {
  const user = await readSessionUser();
  if (!user) return jsonError(401, "نشست نامعتبر است.");
  if (!canAccessCms(user.role)) return jsonError(403, "به کتابخانه رسانه دسترسی ندارید.");

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  try {
    const result = await listMedia({
      q: url.searchParams.get("q") ?? "",
      kind: kindParam(url.searchParams.get("kind")),
      sort: sortParam(url.searchParams.get("sort")),
      from: url.searchParams.get("from") ?? "",
      to: url.searchParams.get("to") ?? "",
      page: Number.isFinite(page) ? page : 1,
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return jsonError(500, "فهرست رسانه بارگذاری نشد.");
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "درخواست نامعتبر است.");
  const user = await readSessionUser();
  if (!user) return jsonError(401, "نشست نامعتبر است.");
  if (!canAccessCms(user.role)) return jsonError(403, "به کتابخانه رسانه دسترسی ندارید.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "قالب بارگذاری نامعتبر است.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return jsonError(422, "فایلی انتخاب نشده است.", { scan: { status: "rejected" } });
  }
  const limit = Math.max(getEnv().MAX_MEDIA_IMAGE_BYTES, getEnv().MAX_MEDIA_VIDEO_BYTES);
  if (file.size > limit) {
    return jsonError(422, "حجم فایل بیش از حد مجاز است.", { scan: { status: "rejected" } });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await ingestMedia({
      buffer,
      filename: file.name || "upload.bin",
      description: String(form.get("description") ?? ""),
      altText: String(form.get("altText") ?? ""),
      userId: user.id,
    });
    return Response.json(
      {
        ok: true,
        duplicate: saved.duplicate,
        scan: { status: "clean", engine: "ClamAV" },
        asset: saved.asset,
      },
      { status: saved.duplicate ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof MediaFailure) {
      return jsonError(422, error.message, { scan: { status: error.code } });
    }
    console.error(error);
    return jsonError(500, "ذخیره رسانه ناموفق بود.");
  }
}
