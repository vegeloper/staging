CREATE TYPE "public"."content_kind" AS ENUM('news', 'article');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'content_creator';--> statement-breakpoint
CREATE TABLE "content_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" "content_kind" NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"display_date" text NOT NULL,
	"comments_label" text DEFAULT '۰' NOT NULL,
	"likes_label" text DEFAULT '۰' NOT NULL,
	"image_src" text NOT NULL,
	"image_alt" text NOT NULL,
	"image_object_position" text,
	"body" jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"author_id" uuid,
	"reviewer_id" uuid,
	"review_note" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"seeded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_events" ADD CONSTRAINT "content_events_post_id_content_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."content_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_events" ADD CONSTRAINT "content_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_events_post_id_idx" ON "content_events" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "content_events_created_at_idx" ON "content_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_posts_slug_unique" ON "content_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_posts_status_kind_idx" ON "content_posts" USING btree ("status","kind");--> statement-breakpoint
CREATE INDEX "content_posts_author_id_idx" ON "content_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "content_posts_published_at_idx" ON "content_posts" USING btree ("published_at");