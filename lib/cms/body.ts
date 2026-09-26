import type { ArticleBlock } from "@/lib/articles";

const headingMarks = [
  ["##### ", "h5"],
  ["#### ", "h4"],
  ["### ", "h3"],
  ["## ", "h2"],
  ["# ", "title"],
] as const;

const headingPrefix: Record<Exclude<ArticleBlock["type"], "p">, string> = {
  title: "# ",
  h2: "## ",
  h3: "### ",
  h4: "#### ",
  h5: "##### ",
};

function headingFor(line: string) {
  return headingMarks.find(([mark]) => line.startsWith(mark));
}

export function expandBlocks(blocks: ArticleBlock[]): ArticleBlock[] {
  const expanded: ArticleBlock[] = [];
  for (const block of blocks) {
    const lines = block.text
      .split(/\r?\n|\\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    if (block.type === "p") {
      expanded.push({ type: "p", text: lines.join(" ") });
      continue;
    }
    expanded.push({ type: block.type, text: lines[0] });
    for (const line of lines.slice(1)) {
      const heading = headingFor(line);
      if (heading) {
        const text = line.slice(heading[0].length).trim();
        if (text) expanded.push({ type: heading[1], text });
      } else {
        expanded.push({ type: "p", text: line });
      }
    }
  }
  return expanded;
}

export function parseBody(raw: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(" ").replace(/\s+/g, " ").trim();
    paragraph = [];
    if (text) blocks.push({ type: "p", text });
  };

  for (const line of raw.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    const heading = headingFor(trimmed);
    if (heading) {
      flushParagraph();
      const text = trimmed.slice(heading[0].length).trim();
      if (text) blocks.push({ type: heading[1], text });
      continue;
    }
    paragraph.push(trimmed);
  }

  flushParagraph();
  return blocks;
}

export function serializeBody(blocks: ArticleBlock[]) {
  return expandBlocks(blocks)
    .map((block) =>
      block.type === "p" ? block.text : `${headingPrefix[block.type]}${block.text}`,
    )
    .join("\n\n");
}
