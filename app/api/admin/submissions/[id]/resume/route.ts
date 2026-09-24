import { readSessionUser } from "@/lib/auth";
import { canManageSubmissions } from "@/lib/auth/rbac";
import { jsonError } from "@/lib/http/errors";
import { getCareerResume } from "@/lib/submissions/service";
import {
  contentDispositionAttachment,
  isAllowedResumeMime,
  readResume,
} from "@/lib/storage/resumes";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await readSessionUser();
  if (!user) return jsonError(401, "نشست نامعتبر است.");
  if (!canManageSubmissions(user.role)) {
    return jsonError(403, "به صندوق درخواست‌ها دسترسی ندارید.");
  }

  const { id } = await context.params;
  const resume = await getCareerResume(id);
  if (!resume) return jsonError(404, "رزومه‌ای پیدا نشد.");

  const mimeType = isAllowedResumeMime(resume.resumeMimeType)
    ? resume.resumeMimeType
    : "application/octet-stream";

  try {
    const bytes = await readResume(resume.resumeStorageKey);
    return new Response(bytes, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": contentDispositionAttachment(
          resume.resumeOriginalName,
        ),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    const accept = _request.headers.get("accept") ?? "";
    if (accept.includes("text/html")) {
      const url = new URL("/admin/files/missing", _request.url);
      url.searchParams.set("name", resume.resumeOriginalName.slice(0, 180));
      return Response.redirect(url, 303);
    }
    return jsonError(404, "فایل رزومه در دسترس نیست.");
  }
}
