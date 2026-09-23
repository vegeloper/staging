import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomUUID } from "node:crypto";

import argon2 from "argon2";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const pepper = process.env.AUTH_PASSWORD_PEPPER;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}
if (!pepper) {
  throw new Error("AUTH_PASSWORD_PEPPER is required");
}

async function readOptionalPassword(label) {
  const fromEnv = process.env[label];
  if (fromEnv && fromEnv.length >= 10) return fromEnv;
  if (!input.isTTY) {
    console.log(`Skipping ${label}; set it to seed the content creator.`);
    return null;
  }

  const rl = createInterface({ input, output });
  const value = await rl.question(
    "Password for content creator (min 10 chars, empty to skip): ",
  );
  rl.close();
  if (!value.trim()) return null;
  if (value.trim().length < 10) {
    throw new Error("Password must be at least 10 characters.");
  }
  return value.trim();
}

async function readPassword(label) {
  const fromEnv = process.env[label];
  if (fromEnv && fromEnv.length >= 10) return fromEnv;

  if (!input.isTTY) {
    throw new Error(
      `${label} must be set for non-interactive seed, or run this command in a terminal.`,
    );
  }

  const rl = createInterface({ input, output });
  const value = await rl.question(`Password for ${label.replace("SEED_", "").replace("_PASSWORD", "").toLowerCase()} (min 10 chars): `);
  rl.close();
  if (value.trim().length < 10) {
    throw new Error("Password must be at least 10 characters.");
  }
  return value.trim();
}

async function hashPassword(password) {
  return argon2.hash(`${password}:${pepper}`, { type: argon2.argon2id });
}

const sql = postgres(databaseUrl, { max: 1 });

try {
  const adminPassword = await readPassword("SEED_ADMIN_PASSWORD");
  const operatorPassword = await readPassword("SEED_OPERATOR_PASSWORD");
  const creatorPassword = await readOptionalPassword("SEED_CREATOR_PASSWORD");

  const accounts = [
    { username: "admin", role: "admin", password: adminPassword },
    { username: "operator", role: "operator", password: operatorPassword },
  ];
  if (creatorPassword) {
    accounts.push({
      username: "creator",
      role: "content_creator",
      password: creatorPassword,
    });
  }

  for (const account of accounts) {
    const passwordHash = await hashPassword(account.password);
    await sql`
      insert into users (id, username, password_hash, role, is_active, failed_login_count)
      values (${randomUUID()}, ${account.username}, ${passwordHash}, ${account.role}, true, 0)
      on conflict (username) do update
      set password_hash = excluded.password_hash,
          is_active = true,
          failed_login_count = 0,
          locked_until = null,
          updated_at = now()
    `;
    console.log(`Seeded ${account.username}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
