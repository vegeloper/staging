export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 64 * 1024 * 1024;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const VIDEO_BRANDS = new Set([
  "isom",
  "iso2",
  "iso4",
  "iso5",
  "iso6",
  "mp41",
  "mp42",
  "avc1",
  "M4V ",
  "dash",
  "MSNV",
  "qt  ",
  "3gp4",
  "3gp5",
  "3gp6",
]);

export type MediaKind = "image" | "video";

export type InspectedMedia = {
  kind: MediaKind;
  mimeType: string;
  extension: "png" | "jpg" | "gif" | "webp" | "mp4" | "webm";
  width: number | null;
  height: number | null;
};

export class MediaReject extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaReject";
  }
}

function declaredExtension(filename: string) {
  const base = filename.split(/[/\\]/).pop() ?? "";
  if (!base || base.includes("\0") || /[\r\n]/.test(base)) {
    throw new MediaReject("نام فایل نامعتبر است.");
  }
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) {
    throw new MediaReject("پسوند فایل مشخص نیست.");
  }
  return base.slice(dot + 1).toLowerCase();
}

function looksExecutable(buffer: Buffer) {
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) return true;
  if (buffer.length >= 4 && buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return true;
  }
  if (buffer.length >= 2 && buffer[0] === 0x23 && buffer[1] === 0x21) return true;
  return false;
}

function extensionMatches(declared: string, detected: InspectedMedia["extension"]) {
  if (detected === "jpg") return declared === "jpg" || declared === "jpeg";
  return declared === detected;
}

function parsePng(buffer: Buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new MediaReject("محتوای فایل PNG نیست.");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let sawHeader = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (!/^[A-Za-z]{4}$/.test(type) || offset + 12 + length > buffer.length) {
      throw new MediaReject("ساختار PNG ناقص یا دستکاری شده است.");
    }
    if (!sawHeader && type !== "IHDR") {
      throw new MediaReject("ساختار PNG ناقص یا دستکاری شده است.");
    }
    if (type === "IHDR") {
      if (length < 13) throw new MediaReject("ساختار PNG ناقص یا دستکاری شده است.");
      width = buffer.readUInt32BE(offset + 8);
      height = buffer.readUInt32BE(offset + 12);
      if (width < 1 || height < 1 || width > 16_000 || height > 16_000) {
        throw new MediaReject("ابعاد تصویر قابل قبول نیست.");
      }
      sawHeader = true;
    }
    const next = offset + 12 + length;
    if (type === "IEND") {
      if (next !== buffer.length) {
        throw new MediaReject("بعد از پایان PNG داده اضافه وجود دارد.");
      }
      return { width, height };
    }
    offset = next;
  }
  throw new MediaReject("ساختار PNG ناقص یا دستکاری شده است.");
}

function skipJpegEntropy(buffer: Buffer, offset: number) {
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    let markerAt = offset;
    while (markerAt < buffer.length && buffer[markerAt] === 0xff) markerAt += 1;
    if (markerAt >= buffer.length) return buffer.length;
    if (buffer[markerAt] === 0x00) {
      offset = markerAt + 1;
      continue;
    }
    return offset;
  }
  return offset;
}

function parseJpeg(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
    throw new MediaReject("محتوای فایل JPEG نیست.");
  }
  let offset = 2;
  let width: number | null = null;
  let height: number | null = null;
  while (offset + 1 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      throw new MediaReject("ساختار JPEG ناقص یا دستکاری شده است.");
    }
    while (buffer[offset] === 0xff && offset < buffer.length) offset += 1;
    if (offset >= buffer.length) break;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9) {
      if (buffer.length - offset > 32) {
        throw new MediaReject("بعد از پایان JPEG داده اضافه وجود دارد.");
      }
      const trailing = buffer.subarray(offset);
      if (trailing.includes(0x4d) && trailing.includes(0x5a) && trailing[0] === 0x4d) {
        throw new MediaReject("بعد از پایان JPEG داده اضافه وجود دارد.");
      }
      return { width, height };
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) throw new MediaReject("ساختار JPEG ناقص یا دستکاری شده است.");
    const size = buffer.readUInt16BE(offset);
    if (size < 2 || offset + size > buffer.length) {
      throw new MediaReject("ساختار JPEG ناقص یا دستکاری شده است.");
    }
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      if (size < 7) throw new MediaReject("ساختار JPEG ناقص یا دستکاری شده است.");
      height = buffer.readUInt16BE(offset + 3);
      width = buffer.readUInt16BE(offset + 5);
    }
    offset += size;
    if (marker === 0xda) offset = skipJpegEntropy(buffer, offset);
  }
  throw new MediaReject("ساختار JPEG ناقص یا دستکاری شده است.");
}

function parseGif(buffer: Buffer) {
  const header = buffer.toString("ascii", 0, 6);
  if (header !== "GIF87a" && header !== "GIF89a") {
    throw new MediaReject("محتوای فایل GIF نیست.");
  }
  if (buffer[buffer.length - 1] !== 0x3b) {
    throw new MediaReject("ساختار GIF ناقص یا دستکاری شده است.");
  }
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  if (width < 1 || height < 1 || width > 16_000 || height > 16_000) {
    throw new MediaReject("ابعاد تصویر قابل قبول نیست.");
  }
  return { width, height };
}

function parseWebp(buffer: Buffer) {
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new MediaReject("محتوای فایل WebP نیست.");
  }
  const declared = buffer.readUInt32LE(4);
  if (declared + 8 !== buffer.length) {
    throw new MediaReject("ساختار WebP ناقص یا دستکاری شده است.");
  }
  return { width: null as number | null, height: null as number | null };
}

function parseMp4(buffer: Buffer) {
  let offset = 0;
  let sawFtyp = false;
  while (offset + 8 <= buffer.length) {
    const size32 = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (!/^[A-Za-z0-9 ]{4}$/.test(type)) {
      throw new MediaReject("ساختار ویدیو ناقص یا دستکاری شده است.");
    }
    let header = 8;
    let boxSize = size32;
    if (size32 === 1) {
      if (offset + 16 > buffer.length) throw new MediaReject("ساختار ویدیو ناقص یا دستکاری شده است.");
      const large = buffer.readBigUInt64BE(offset + 8);
      if (large <= BigInt(16) || large > BigInt(buffer.length - offset)) {
        throw new MediaReject("ساختار ویدیو ناقص یا دستکاری شده است.");
      }
      boxSize = Number(large);
      header = 16;
    } else if (size32 === 0) {
      boxSize = buffer.length - offset;
    }
    if (boxSize < header || offset + boxSize > buffer.length) {
      throw new MediaReject("ساختار ویدیو ناقص یا دستکاری شده است.");
    }
    if (offset === 0 && type !== "ftyp") {
      throw new MediaReject("محتوای فایل MP4 نیست.");
    }
    if (type === "ftyp") {
      const brand = buffer.toString("ascii", offset + header, offset + header + 4);
      if (!VIDEO_BRANDS.has(brand)) {
        throw new MediaReject("این MP4 یک ویدیوی قابل قبول نیست.");
      }
      sawFtyp = true;
    }
    offset += boxSize;
  }
  if (!sawFtyp || offset !== buffer.length) {
    throw new MediaReject("ساختار ویدیو ناقص یا دستکاری شده است.");
  }
}

function parseWebm(buffer: Buffer) {
  if (buffer.length < 32 || buffer[0] !== 0x1a || buffer[1] !== 0x45 || buffer[2] !== 0xdf || buffer[3] !== 0xa3) {
    throw new MediaReject("محتوای فایل WebM نیست.");
  }
  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString("latin1");
  if (!head.includes("webm")) {
    throw new MediaReject("محتوای فایل WebM نیست.");
  }
}

export function inspectMedia(buffer: Buffer, filename: string, limits?: { image?: number; video?: number }) {
  if (!buffer.length) throw new MediaReject("فایل خالی است.");
  if (looksExecutable(buffer)) {
    throw new MediaReject("محتوای فایل یک برنامه اجرایی است و پذیرفته نمی‌شود.");
  }
  const declared = declaredExtension(filename);
  const imageLimit = limits?.image ?? MAX_IMAGE_BYTES;
  const videoLimit = limits?.video ?? MAX_VIDEO_BYTES;

  let inspected: InspectedMedia;
  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    const size = parsePng(buffer);
    inspected = { kind: "image", mimeType: "image/png", extension: "png", ...size };
  } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    const size = parseJpeg(buffer);
    inspected = { kind: "image", mimeType: "image/jpeg", extension: "jpg", ...size };
  } else if (buffer.toString("ascii", 0, 6) === "GIF87a" || buffer.toString("ascii", 0, 6) === "GIF89a") {
    const size = parseGif(buffer);
    inspected = { kind: "image", mimeType: "image/gif", extension: "gif", ...size };
  } else if (buffer.toString("ascii", 0, 4) === "RIFF") {
    const size = parseWebp(buffer);
    inspected = { kind: "image", mimeType: "image/webp", extension: "webp", ...size };
  } else if (buffer.length > 8 && buffer.toString("ascii", 4, 8) === "ftyp") {
    parseMp4(buffer);
    inspected = { kind: "video", mimeType: "video/mp4", extension: "mp4", width: null, height: null };
  } else if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    parseWebm(buffer);
    inspected = { kind: "video", mimeType: "video/webm", extension: "webm", width: null, height: null };
  } else {
    throw new MediaReject("فقط تصویر PNG، JPEG، GIF، WebP و ویدیوی MP4 یا WebM پذیرفته می‌شود.");
  }

  if (!extensionMatches(declared, inspected.extension)) {
    throw new MediaReject("پسوند فایل با محتوای واقعی آن یکی نیست.");
  }
  const limit = inspected.kind === "image" ? imageLimit : videoLimit;
  if (buffer.length > limit) {
    throw new MediaReject(inspected.kind === "image" ? "حجم تصویر بیش از حد مجاز است." : "حجم ویدیو بیش از حد مجاز است.");
  }
  return inspected;
}
