import { randomBytes } from "node:crypto";

const hex = (bytes) => randomBytes(bytes).toString("hex");
const b64 = (bytes) => randomBytes(bytes).toString("base64");

process.stdout.write(`# Paste into the server .env — never commit these values
POSTGRES_PASSWORD=${hex(32)}
AUTH_PASSWORD_PEPPER=${b64(32)}
PII_ENCRYPTION_KEY=${b64(32)}
SEED_ADMIN_PASSWORD=${hex(12)}
SEED_OPERATOR_PASSWORD=${hex(12)}
SEED_CREATOR_PASSWORD=${hex(12)}
`);
