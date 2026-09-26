ALTER TABLE "content_posts" ADD COLUMN IF NOT EXISTS "home_lead" boolean DEFAULT false NOT NULL;
