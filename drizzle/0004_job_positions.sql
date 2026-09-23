CREATE TABLE "job_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"desired_slug" text NOT NULL,
	"title" text NOT NULL,
	"employment_type" text NOT NULL,
	"department" text NOT NULL,
	"city" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"highlights" jsonb NOT NULL,
	"sections" jsonb NOT NULL,
	"meta" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"author_id" uuid,
	"reviewer_id" uuid,
	"review_note" text,
	"supersedes_id" uuid,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_position_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"seeded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_supersedes_id_job_positions_id_fk" FOREIGN KEY ("supersedes_id") REFERENCES "public"."job_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_position_events" ADD CONSTRAINT "job_position_events_position_id_job_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."job_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_position_events" ADD CONSTRAINT "job_position_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_positions_slug_unique" ON "job_positions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "job_positions_status_idx" ON "job_positions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_positions_author_id_idx" ON "job_positions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "job_positions_supersedes_id_idx" ON "job_positions" USING btree ("supersedes_id");--> statement-breakpoint
CREATE INDEX "job_positions_published_at_idx" ON "job_positions" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "job_position_events_position_id_idx" ON "job_position_events" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "job_position_events_created_at_idx" ON "job_position_events" USING btree ("created_at");