import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync("tmp-starter-posts.json", "utf8").replace(/^\uFEFF/, "").trim();
const at = raw.indexOf("partnership-phase-two");
console.log(JSON.stringify(raw.slice(at - 40, at + 10)));
const fixed = raw.replace(/\},\s*\\n\s*\{/g, "},{");
const rows = JSON.parse(fixed);
writeFileSync(
  "tmp-starter-posts-fixed.json",
  JSON.stringify(rows, null, 2),
  "utf8",
);
console.log(rows.map((row) => `${row.slug} ${row.body.length}`).join("\n"));
