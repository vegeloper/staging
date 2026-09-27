import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";

export async function askPath(label) {
  if (!input.isTTY) {
    console.error("Run this from a terminal so it can ask for a path.");
    process.exit(1);
  }
  const rl = createInterface({ input, output });
  try {
    let kind = "";
    while (kind !== "absolute" && kind !== "relative") {
      const answer = (
        await rl.question(`${label}\n  1) absolute path\n  2) relative path\nChoice [1]: `)
      )
        .trim()
        .toLowerCase();
      if (answer === "" || answer === "1" || answer === "absolute") kind = "absolute";
      else if (answer === "2" || answer === "relative") kind = "relative";
      else console.error("Enter 1 for an absolute path, or 2 for a path relative to this directory.");
    }
    if (kind === "relative") {
      console.log(`Relative paths start from ${process.cwd()}`);
    }
    let entered = "";
    while (!entered) {
      entered = (await rl.question(kind === "absolute" ? "Absolute path: " : "Relative path: ")).trim();
      if (!entered) console.error("Enter a path.");
    }
    const resolved = kind === "absolute" ? path.resolve(entered) : path.resolve(process.cwd(), entered);
    return resolved;
  } finally {
    rl.close();
  }
}

export async function confirm(question) {
  if (!input.isTTY) return false;
  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question(question)).trim().toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}
