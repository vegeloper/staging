import { readdir } from "node:fs/promises";
import path from "node:path";

const roots = ["figma", "videos", "fonts", "uploads"];

export async function listThemeAssetPaths() {
  const publicDir = path.join(process.cwd(), "public");
  const found: string[] = [];

  async function walk(directory: string, prefix: string) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const relative = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) {
        if (relative.split("/").length > 4) continue;
        await walk(path.join(directory, entry.name), relative);
        continue;
      }
      if (/\.(png|jpe?g|webp|gif|svg|mp4|webm)$/i.test(entry.name)) {
        found.push(`/${relative}`);
      }
    }
  }

  for (const root of roots) {
    await walk(path.join(publicDir, root), root);
  }
  return found.sort((left, right) => left.localeCompare(right));
}
