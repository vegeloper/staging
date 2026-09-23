import { crc32 } from "node:zlib";
import { describe, expect, it } from "vitest";

import { inspectMedia, MediaReject } from "@/lib/media/inspect";

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

function png(extra = Buffer.alloc(0)) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IEND", Buffer.alloc(0)), extra]);
}

describe("media inspection", () => {
  it("accepts a real png, jpeg, gif, webp, and mp4 container", () => {
    expect(inspectMedia(png(), "photo.png")).toMatchObject({ kind: "image", extension: "png", width: 1, height: 1 });
    expect(inspectMedia(Buffer.from([0xff, 0xd8, 0xff, 0xd9]), "photo.jpg")).toMatchObject({
      kind: "image",
      extension: "jpg",
    });
    expect(inspectMedia(Buffer.from([0xff, 0xd8, 0xff, 0xd9]), "photo.jpeg")).toMatchObject({ extension: "jpg" });

    const gif = Buffer.concat([
      Buffer.from("GIF89a", "ascii"),
      Buffer.from([0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x3b]),
    ]);
    expect(inspectMedia(gif, "anim.gif")).toMatchObject({ kind: "image", extension: "gif" });

    const webp = Buffer.alloc(12);
    webp.write("RIFF", 0, "ascii");
    webp.writeUInt32LE(4, 4);
    webp.write("WEBP", 8, "ascii");
    expect(inspectMedia(webp, "still.webp")).toMatchObject({ kind: "image", extension: "webp" });

    const mp4 = Buffer.alloc(20);
    mp4.writeUInt32BE(20, 0);
    mp4.write("ftyp", 4, "ascii");
    mp4.write("isom", 8, "ascii");
    mp4.write("isom", 16, "ascii");
    expect(inspectMedia(mp4, "clip.mp4")).toMatchObject({ kind: "video", extension: "mp4" });
  });

  it("rejects an executable, a trailing payload, and an extension that does not match the bytes", () => {
    expect(() => inspectMedia(Buffer.concat([Buffer.from("MZ"), Buffer.alloc(16)]), "photo.png")).toThrow(MediaReject);
    expect(() => inspectMedia(Buffer.concat([png(), Buffer.from("MZ-not-a-png")]), "photo.png")).toThrow(/داده اضافه/);
    expect(() => inspectMedia(png(), "clip.mp4")).toThrow(/پسوند/);
    expect(() => inspectMedia(Buffer.from("plain text"), "notes.png")).toThrow(MediaReject);
  });
});
