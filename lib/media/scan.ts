import { lookup } from "node:dns/promises";
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

const LOOKUP_ATTEMPTS = 3;

async function lookupIPv4(host: string): Promise<string> {
  let last: unknown;
  for (let attempt = 0; attempt < LOOKUP_ATTEMPTS; attempt += 1) {
    try {
      const { address } = await lookup(host, { family: 4 });
      if (!address) break;
      return address;
    } catch (error) {
      last = error;
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
      if (code !== "EAI_AGAIN" || attempt === LOOKUP_ATTEMPTS - 1) break;
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  throw last instanceof Error ? last : new Error("virus scanner unavailable");
}

async function openScanSocket(target: ScanTarget): Promise<net.Socket> {
  if ("path" in target) return net.connect({ path: target.path });
  const address = await lookupIPv4(target.host);
  return net.connect(target.port, address);
}

export async function scanBuffer(buffer: Buffer): Promise<VirusScan> {
  const target = scanTarget();
  let socket: net.Socket;
  try {
    socket = await openScanSocket(target);
  } catch {
    throw new Error("virus scanner unavailable");
  }
  const response = await new Promise<string>((resolve, reject) => {
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
