CREATE TYPE "public"."media_kind" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "media_kind" NOT NULL,
	"original_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"alt_text" text DEFAULT '' NOT NULL,
	"mime_type" text NOT NULL,
	"extension" text NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"sha256" text NOT NULL,
	"storage_key" text NOT NULL,
	"thumbnail_key" text,
	"scan_engine" text NOT NULL,
	"scan_result" text NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_sha256_unique" ON "media_assets" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "media_assets_kind_created_at_idx" ON "media_assets" USING btree ("kind","created_at" DESC);--> statement-breakpoint
CREATE INDEX "media_assets_uploaded_by_idx" ON "media_assets" USING btree ("uploaded_by");