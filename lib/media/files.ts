import { spawn } from "node:child_process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { getEnv } from "@/lib/env";

const FILE_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|gif|webp|mp4|webm)$/i;
const THUMB_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.thumb\.jpg$/i;

export function mediaRoot() {
  return path.resolve(getEnv().MEDIA_ROOT);
}

export async function ensureMediaRoot() {
  await mkdir(mediaRoot(), { recursive: true });
}

export function resolveMediaKey(key: string) {
  if (!FILE_KEY.test(key) && !THUMB_KEY.test(key)) {
    throw new Error("invalid media key");
  }
  const root = mediaRoot();
  const full = path.resolve(root, key);
  if (full !== path.join(root, key)) {
    throw new Error("invalid media key");
  }
  return full;
}

export async function writeMediaFile(id: string, extension: string, buffer: Buffer) {
  const key = `${id}.${extension}`;
  if (!FILE_KEY.test(key)) throw new Error("invalid media key");
  await ensureMediaRoot();
  await writeFile(resolveMediaKey(key), buffer, { flag: "wx" });
  return key;
}

export async function removeMediaKeys(keys: Array<string | null | undefined>) {
  for (const key of keys) {
    if (!key) continue;
    try {
      await unlink(resolveMediaKey(key));
    } catch {
      // The file is already gone, or the key was never written.
    }
  }
}

export async function readMediaBytes(key: string) {
  return readFile(resolveMediaKey(key));
}

function run(command: string, args: string[], timeoutMs: number) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(command, args, { stdio: "ignore" });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, timeoutMs);
    child.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

function capture(command: string, args: string[], timeoutMs: number) {
  return new Promise<string | null>((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "ignore"] });
    let output = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout?.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0 ? output : null);
    });
  });
}

export async function writeThumbnail(id: string, sourceKey: string, kind: "image" | "video") {
  const source = resolveMediaKey(sourceKey);
  const key = `${id}.thumb.jpg`;
  const destination = resolveMediaKey(key);
  const args =
    kind === "video"
      ? ["-y", "-ss", "0.1", "-i", source, "-frames:v", "1", "-vf", "scale=320:-2", "-q:v", "6", destination]
      : ["-y", "-i", source, "-vf", "scale=320:-2", "-q:v", "6", destination];
  const ok = await run("ffmpeg", args, 30_000);
  if (!ok) {
    await removeMediaKeys([key]);
    return null;
  }
  return key;
}

export async function probeDurationMs(sourceKey: string) {
  const source = resolveMediaKey(sourceKey);
  const output = await capture(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", source],
    15_000,
  );
  if (!output) return null;
  const seconds = Number(output.trim());
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.round(seconds * 1000);
}
