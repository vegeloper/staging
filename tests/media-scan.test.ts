import { existsSync } from "node:fs";
import { crc32 } from "node:zlib";
import { describe, expect, it } from "vitest";

import { inspectMedia } from "@/lib/media/inspect";
import { scanBuffer } from "@/lib/media/scan";

const EICAR = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

function pngWithText(text: string) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const payload = Buffer.concat([Buffer.from("Comment\0", "latin1"), Buffer.from(text, "latin1")]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("tEXt", payload), chunk("IEND", Buffer.alloc(0))]);
}

describe("virus scan", () => {
  const scannerReady = existsSync("/var/run/clamav/clamd.ctl") || Boolean(process.env.CLAMAV_HOST);

  it.skipIf(!scannerReady)("accepts a clean png and rejects the EICAR test string in memory", async () => {
    const clean = pngWithText("hello");
    expect(inspectMedia(clean, "clean.png").kind).toBe("image");
    await expect(scanBuffer(clean)).resolves.toMatchObject({ clean: true, engine: "ClamAV" });

    const result = await scanBuffer(Buffer.from(`${EICAR}\n`, "latin1"));
    expect(result.clean).toBe(false);
    expect(result.signature).toBeTruthy();
  });
});
