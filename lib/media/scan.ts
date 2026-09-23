import { existsSync } from "node:fs";
import net from "node:net";

import { getEnv } from "@/lib/env";

export type VirusScan = {
  engine: string;
  clean: boolean;
  signature: string | null;
};

const LOCAL_SOCKET = "/var/run/clamav/clamd.ctl";

type ScanTarget = { path: string } | { host: string; port: number };

function scanTarget(): ScanTarget {
  const env = getEnv();
  if (env.CLAMAV_SOCKET) return { path: env.CLAMAV_SOCKET };
  if (env.CLAMAV_HOST) return { host: env.CLAMAV_HOST, port: env.CLAMAV_PORT };
  if (existsSync(LOCAL_SOCKET)) return { path: LOCAL_SOCKET };
  return { host: "127.0.0.1", port: env.CLAMAV_PORT };
}

export async function scanBuffer(buffer: Buffer): Promise<VirusScan> {
  const target = scanTarget();
  const response = await new Promise<string>((resolve, reject) => {
    const socket = "path" in target ? net.connect({ path: target.path }) : net.connect(target.port, target.host);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("ClamAV timed out"));
    }, 60_000);
    let text = "";
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      text += chunk;
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    socket.on("end", () => {
      clearTimeout(timer);
      resolve(text.trim());
    });
    socket.on("connect", () => {
      socket.write("nINSTREAM\n");
      const chunkSize = 64 * 1024;
      let offset = 0;
      const writeChunk = () => {
        if (offset >= buffer.length) {
          const end = Buffer.alloc(4);
          if (!socket.write(end)) socket.once("drain", () => socket.end());
          else socket.end();
          return;
        }
        const next = Math.min(offset + chunkSize, buffer.length);
        const header = Buffer.alloc(4);
        header.writeUInt32BE(next - offset);
        const piece = buffer.subarray(offset, next);
        offset = next;
        const ok = socket.write(Buffer.concat([header, piece]));
        if (!ok) socket.once("drain", writeChunk);
        else writeChunk();
      };
      writeChunk();
    });
  }).catch(() => null);

  if (!response) {
    throw new Error("virus scanner unavailable");
  }
  if (response.endsWith("OK")) {
    return { engine: "ClamAV", clean: true, signature: null };
  }
  const found = response.match(/:\s(.+)\sFOUND$/);
  if (found) {
    return { engine: "ClamAV", clean: false, signature: found[1] };
  }
  throw new Error("virus scanner unavailable");
}
