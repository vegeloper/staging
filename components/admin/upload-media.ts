"use client";

import type { MediaListItem } from "@/lib/media/types";

type ToastApi = {
  beginScan: () => number;
  finishScan: (id: number, tone: "success" | "error" | "warning", text: string) => void;
};

export async function uploadMediaFile(
  file: File,
  toast: ToastApi,
  meta?: { description?: string; altText?: string },
) {
  const id = toast.beginScan();
  try {
    const body = new FormData();
    body.set("file", file);
    body.set("description", meta?.description ?? "");
    body.set("altText", meta?.altText ?? "");
    const response = await fetch("/api/admin/media", { method: "POST", body });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      duplicate?: boolean;
      asset?: MediaListItem;
    };
    if (!response.ok || !data.asset) {
      toast.finishScan(id, "error", data.error || "فایل پذیرفته نشد.");
      return null;
    }
    toast.finishScan(
      id,
      "success",
      data.duplicate ? "این فایل از قبل در کتابخانه بود." : "فایل سالم است و به کتابخانه رسانه اضافه شد.",
    );
    return data.asset;
  } catch {
    toast.finishScan(id, "error", "ارتباط با سرور قطع شد. فایل ذخیره نشد.");
    return null;
  }
}
