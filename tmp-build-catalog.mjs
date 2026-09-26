import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";

const rows = JSON.parse(readFileSync("tmp-starter-posts-fixed.json", "utf8"));
const order = ["monitor-inside-car", "cars-navy", "partnership-phase-two"];
const images = {
  "monitor-inside-car": "/news/monitor-inside-car.png",
  "cars-navy": "/news/cars-navy.png",
  "partnership-phase-two": "/news/partnership-phase-two.png",
};
const sources = {
  "monitor-inside-car": "data/media/671560d8-080f-404b-90ad-b6ba089fa785.png",
  "cars-navy": "data/media/85c41183-9c9e-4868-baa7-0d9d1cca13f5.png",
  "partnership-phase-two": "data/media/2e5c7ba2-1eda-45b0-995e-88868cbef7aa.png",
};

mkdirSync("public/news", { recursive: true });
for (const slug of order) copyFileSync(sources[slug], `public${images[slug]}`);

function splitBlock(block) {
  const lines = String(block.text)
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) return [block];
  return [
    { type: block.type, text: lines[0] },
    ...lines.slice(1).map((text) => ({ type: "p", text })),
  ];
}

const posts = order.map((slug) => {
  const row = rows.find((item) => item.slug === slug);
  return {
    slug,
    kind: row.kind,
    category: row.category,
    title: row.title,
    displayDate: row.displayDate,
    commentsLabel: row.commentsLabel,
    likesLabel: row.likesLabel,
    imageSrc: images[slug],
    imageAlt: row.imageAlt,
    imageObjectPosition: row.imageObjectPosition || null,
    body: row.body.flatMap(splitBlock),
    featured: false,
    homeLead: slug === "partnership-phase-two",
    sortOrder: slug === "partnership-phase-two" ? 0 : slug === "cars-navy" ? 1 : 2,
  };
});

writeFileSync(
  "lib/cms/extra-catalog.ts",
  `import type { ArticleBlock } from "@/lib/articles";

import type { CatalogSeed } from "./catalog";

export const extraCatalog: CatalogSeed[] = ${JSON.stringify(posts, null, 2)};
`,
);
console.log("wrote", posts.map((post) => post.slug).join(", "));
