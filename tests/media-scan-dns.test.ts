import { lookup } from "node:dns/promises";
import net from "node:net";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetEnvCache } from "@/lib/env";
import { scanBuffer } from "@/lib/media/scan";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

vi.mock("node:net", () => ({
  default: {
    connect: vi.fn(),
  },
}));

function listeningSocket(response: string) {
  const handlers = new Map<string, Array<(value?: unknown) => void>>();
  const socket = {
    setEncoding() {},
    destroy() {},
    once(event: string, callback: () => void) {
      const list = handlers.get(event) ?? [];
      list.push(callback);
      handlers.set(event, list);
    },
    on(event: string, callback: (value?: unknown) => void) {
      const list = handlers.get(event) ?? [];
      list.push(callback);
      handlers.set(event, list);
      if (event === "connect") queueMicrotask(() => callback());
      return socket;
    },
    end() {
      for (const callback of handlers.get("data") ?? []) callback(response);
      for (const callback of handlers.get("end") ?? []) callback();
    },
    write(chunk: Buffer | string) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (bytes.length === 4 && bytes.every((byte) => byte === 0)) this.end();
      return true;
    },
  };
  return socket;
}

describe("ClamAV name lookup", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://dotone_app:password@postgres:5432/dotone_trip";
    process.env.APP_ORIGIN = "http://localhost:3000";
    process.env.UPLOAD_ROOT = "data/resumes";
    process.env.CLAMAV_HOST = "clamav";
    process.env.CLAMAV_PORT = "3310";
    delete process.env.CLAMAV_SOCKET;
    resetEnvCache();
    vi.mocked(lookup).mockReset();
    vi.mocked(net.connect).mockReset();
  });

  it("connects to the IPv4 address of clamav", async () => {
    vi.mocked(lookup).mockResolvedValue({ address: "172.18.0.2", family: 4 });
    vi.mocked(net.connect).mockReturnValue(listeningSocket("stream: OK") as never);

    await expect(scanBuffer(Buffer.from("png"))).resolves.toMatchObject({ clean: true, engine: "ClamAV" });

    expect(lookup).toHaveBeenCalledWith("clamav", { family: 4 });
    expect(net.connect).toHaveBeenCalledWith(3310, "172.18.0.2");
  });

  it("retries a temporary DNS failure once", async () => {
    let calls = 0;
    vi.mocked(lookup).mockImplementation(async () => {
      calls += 1;
      if (calls === 1) {
        const again = new Error("getaddrinfo EAI_AGAIN clamav") as NodeJS.ErrnoException;
        again.code = "EAI_AGAIN";
        throw again;
      }
      return { address: "10.0.0.8", family: 4 };
    });
    vi.mocked(net.connect).mockReturnValue(listeningSocket("stream: OK") as never);

    await expect(scanBuffer(Buffer.from("png"))).resolves.toMatchObject({ clean: true });
    expect(calls).toBe(2);
    expect(net.connect).toHaveBeenCalledWith(3310, "10.0.0.8");
  });

  it("does not keep retrying when the name does not exist", async () => {
    const missing = Object.assign(new Error("getaddrinfo ENOTFOUND clamav"), { code: "ENOTFOUND" });
    vi.mocked(lookup).mockRejectedValue(missing);

    await expect(scanBuffer(Buffer.from("png"))).rejects.toThrow("virus scanner unavailable");
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(net.connect).not.toHaveBeenCalled();
  });
});
