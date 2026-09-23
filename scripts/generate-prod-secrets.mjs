import { randomBytes } from "node:crypto";

const hex = (bytes) => randomBytes(bytes).toString("hex");
const b64 = (bytes) => randomBytes(bytes).toString("base64");

process.stdout.write(`# Paste into the server .env — never commit these values.
# Do not add operator passwords here. After migrate, run:
#   npm run docker:bootstrap:prod
# That prints admin, operator, and creator passwords once and does not store them.
POSTGRES_PASSWORD=${hex(32)}
AUTH_PASSWORD_PEPPER=${b64(32)}
PII_ENCRYPTION_KEY=${b64(32)}
`);
