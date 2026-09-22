import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";

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

function generatePassword() {
  return randomBytes(18).toString("base64url");
}

async function hashPassword(password) {
  return argon2.hash(`${password}:${pepper}`, { type: argon2.argon2id });
}

const accounts = [
  { username: "admin", role: "admin", password: generatePassword() },
  { username: "operator", role: "operator", password: generatePassword() },
  { username: "creator", role: "content_creator", password: generatePassword() },
];

const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql.begin(async (tx) => {
    for (const account of accounts) {
      const passwordHash = await hashPassword(account.password);
      await tx`
        insert into users (id, username, password_hash, role, is_active, failed_login_count)
        values (${randomUUID()}, ${account.username}, ${passwordHash}, ${account.role}, true, 0)
        on conflict (username) do update
        set password_hash = excluded.password_hash,
            role = excluded.role,
            is_active = true,
            failed_login_count = 0,
            locked_until = null,
            updated_at = now()
      `;
    }
  });

  console.log("Bootstrap complete. These passwords are shown once and were not written to a file.");
  console.log("Store them in a password manager. Running this command again replaces all three.");
  for (const account of accounts) {
    console.log(`${account.username} ${account.password}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
