import type { ArticleBlock } from "@/lib/articles";

export function parseBody(raw: string): ArticleBlock[] {
  return raw
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((text) => {
      if (text.startsWith("## ")) {
        return { type: "h2" as const, text: text.slice(3).trim() };
      }
      return {
        type: "p" as const,
        text: text.replace(/\s*\n\s*/g, " ").trim(),
      };
    })
    .filter((block) => block.text.length > 0);
}

export function serializeBody(blocks: ArticleBlock[]) {
  return blocks
    .map((block) => (block.type === "h2" ? `## ${block.text}` : block.text))
    .join("\n\n");
}
