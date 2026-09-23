import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { resolveMediaKey } from "./files";

function parseRange(header: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || size <= 0) return null;
  const [, startText, endText] = match;
  if (startText === "" && endText === "") return null;
  if (startText === "") {
    const suffix = Number(endText);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(startText);
  const end = endText === "" ? size - 1 : Number(endText);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

function contentDisposition(name: string) {
  const ascii = name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "file";
  return `inline; filename="${ascii}"`;
}

export async function mediaFileResponse(input: {
  key: string;
  mimeType: string;
  downloadName: string;
  request: Request;
  cacheControl: string;
  allowRange: boolean;
}) {
  let filePath: string;
  try {
    filePath = resolveMediaKey(input.key);
  } catch {
    return new Response(null, { status: 404 });
  }

  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    return new Response(null, { status: 404 });
  }

  const shared = {
    "Content-Type": input.mimeType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": input.cacheControl,
    "Content-Disposition": contentDisposition(input.downloadName),
    "Accept-Ranges": input.allowRange ? "bytes" : "none",
  };

  const rangeHeader = input.allowRange ? input.request.headers.get("range") : null;
  if (rangeHeader) {
    const range = parseRange(rangeHeader, size);
    if (!range) {
      return new Response(null, {
        status: 416,
        headers: { ...shared, "Content-Range": `bytes */${size}` },
      });
    }
    const node = createReadStream(filePath, range);
    return new Response(Readable.toWeb(node) as ReadableStream, {
      status: 206,
      headers: {
        ...shared,
        "Content-Length": String(range.end - range.start + 1),
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
      },
    });
  }

  const node = createReadStream(filePath);
  return new Response(Readable.toWeb(node) as ReadableStream, {
    status: 200,
    headers: { ...shared, "Content-Length": String(size) },
  });
}
