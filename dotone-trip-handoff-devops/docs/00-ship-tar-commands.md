# LOCAL
Copy-Item .env.example .env
npm run ops:secrets
docker compose --profile full up --build -d
docker compose --profile seed run --rm --no-deps seed
docker save -o "$env:USERPROFILE\OneDrive\Desktop\project\dotone-trip-images.tar" dotone-trip-app:latest dotone-trip-migrate:latest

# USB (change E: to the flash-drive letter) — tar next to the handoff zip
New-Item -ItemType Directory -Force -Path E:\dotone-trip | Out-Null
Copy-Item "$env:USERPROFILE\OneDrive\Desktop\project\dotone-trip-handoff-devops.zip" E:\dotone-trip\
Copy-Item "$env:USERPROFILE\OneDrive\Desktop\project\dotone-trip-images.tar" E:\dotone-trip\
scp E:\dotone-trip\dotone-trip-handoff-devops.zip E:\dotone-trip\dotone-trip-images.tar root@VPS_IP:/tmp/

# VPS — replace HOST; leave RESUME_HOST_PATH unset
mkdir -p /opt/dotone-trip
unzip -o /tmp/dotone-trip-handoff-devops.zip -d /opt/dotone-trip
cp /opt/dotone-trip/.env.example /opt/dotone-trip/.env
cd /opt/dotone-trip
docker run --rm -v /opt/dotone-trip:/app -w /app node:22-bookworm-slim node scripts/generate-prod-secrets.mjs
docker load -i /tmp/dotone-trip-images.tar
docker tag dotone-trip-migrate:latest dotone-trip-seed:latest
rm -f /tmp/dotone-trip-images.tar /tmp/dotone-trip-handoff-devops.zip
docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --no-build
docker compose -f compose.yaml -f compose.prod.yaml --profile seed run --rm --no-deps seed
curl -fsS https://HOST/api/health
curl -fsS https://HOST/api/ready
