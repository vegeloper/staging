import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { ArticleBlock } from "@/lib/articles";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "operator",
  "content_creator",
]);
export const contentKindEnum = pgEnum("content_kind", ["news", "article"]);
export const mediaKindEnum = pgEnum("media_kind", ["image", "video"]);
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "pending_review",
  "approved",
  "rejected",
]);
export const submissionTypeEnum = pgEnum("submission_type", [
  "contact",
  "driver",
  "career",
  "sponsorship",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "new",
  "in_review",
  "contacted",
  "closed",
]);
export const contactCategoryEnum = pgEnum("contact_category", [
  "general",
  "urgent",
  "enterprise",
  "car_ride",
  "other",
]);
export const sponsorshipDomainEnum = pgEnum("sponsorship_domain", [
  "tech",
  "real_estate",
  "finance",
  "retail",
  "transport",
  "media",
  "other",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("users_username_unique").on(table.username),
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  absoluteExpiresAt: timestamp("absolute_expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
  index("sessions_user_id_idx").on(table.userId),
  index("sessions_expires_at_idx").on(table.expiresAt),
]);

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: submissionTypeEnum("type").notNull(),
  status: submissionStatusEnum("status").notNull().default("new"),
  idempotencyKey: text("idempotency_key").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("submissions_idempotency_key_unique").on(table.idempotencyKey),
  index("submissions_type_created_at_idx").on(table.type, sql`${table.createdAt} DESC`),
  index("submissions_status_idx").on(table.status),
]);

export const contactSubmissions = pgTable("contact_submissions", {
  submissionId: uuid("submission_id")
    .primaryKey()
    .references(() => submissions.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  category: contactCategoryEnum("category").notNull(),
  message: text("message").notNull(),
});

export const driverApplications = pgTable("driver_applications", {
  submissionId: uuid("submission_id")
    .primaryKey()
    .references(() => submissions.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  nationalIdCipher: text("national_id_cipher").notNull(),
  nationalIdBlindIndex: text("national_id_blind_index").notNull(),
  province: text("province").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  description: text("description").notNull(),
}, (table) => [
  uniqueIndex("driver_applications_national_id_blind_index_unique").on(
    table.nationalIdBlindIndex,
  ),
]);

export const jobApplications = pgTable("job_applications", {
  submissionId: uuid("submission_id")
    .primaryKey()
    .references(() => submissions.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  resumeStorageKey: text("resume_storage_key").notNull(),
  resumeOriginalName: text("resume_original_name").notNull(),
  resumeMimeType: text("resume_mime_type").notNull(),
  resumeSize: integer("resume_size").notNull(),
});

export const sponsorshipRequests = pgTable("sponsorship_requests", {
  submissionId: uuid("submission_id")
    .primaryKey()
    .references(() => submissions.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  brandName: text("brand_name").notNull(),
  activityDomain: sponsorshipDomainEnum("activity_domain").notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  submissionId: uuid("submission_id").references(() => submissions.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_events_submission_id_idx").on(table.submissionId),
  index("audit_events_created_at_idx").on(table.createdAt),
]);

export const contentPosts = pgTable("content_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  kind: contentKindEnum("kind").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  displayDate: text("display_date").notNull(),
  commentsLabel: text("comments_label").notNull().default("۰"),
  likesLabel: text("likes_label").notNull().default("۰"),
  imageSrc: text("image_src").notNull(),
  imageAlt: text("image_alt").notNull(),
  imageObjectPosition: text("image_object_position"),
  body: jsonb("body").$type<ArticleBlock[]>().notNull(),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  status: contentStatusEnum("status").notNull().default("draft"),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  reviewerId: uuid("reviewer_id").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewNote: text("review_note"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("content_posts_slug_unique").on(table.slug),
  index("content_posts_status_kind_idx").on(table.status, table.kind),
  index("content_posts_author_id_idx").on(table.authorId),
  index("content_posts_published_at_idx").on(table.publishedAt),
]);

export const contentSettings = pgTable("content_settings", {
  id: text("id").primaryKey(),
  seededAt: timestamp("seeded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: mediaKindEnum("kind").notNull(),
  originalName: text("original_name").notNull(),
  description: text("description").notNull().default(""),
  altText: text("alt_text").notNull().default(""),
  mimeType: text("mime_type").notNull(),
  extension: text("extension").notNull(),
  byteSize: integer("byte_size").notNull(),
  width: integer("width"),
  height: integer("height"),
  durationMs: integer("duration_ms"),
  sha256: text("sha256").notNull(),
  storageKey: text("storage_key").notNull(),
  thumbnailKey: text("thumbnail_key"),
  scanEngine: text("scan_engine").notNull(),
  scanResult: text("scan_result").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => [
  uniqueIndex("media_assets_sha256_unique").on(table.sha256),
  index("media_assets_kind_created_at_idx").on(table.kind, sql`${table.createdAt} DESC`),
  index("media_assets_uploaded_by_idx").on(table.uploadedBy),
]);

export const siteDocuments = pgTable("site_documents", {
  key: text("key").primaryKey(),
  draft: jsonb("draft").notNull(),
  published: jsonb("published"),
  revision: integer("revision").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const contentEvents = pgTable("content_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => contentPosts.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("content_events_post_id_idx").on(table.postId),
  index("content_events_created_at_idx").on(table.createdAt),
]);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  auditEvents: many(auditEvents),
  authoredPosts: many(contentPosts, { relationName: "contentAuthor" }),
  reviewedPosts: many(contentPosts, { relationName: "contentReviewer" }),
  contentEvents: many(contentEvents, { relationName: "contentEventActor" }),
  siteDocuments: many(siteDocuments),
  mediaAssets: many(mediaAssets),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  contact: one(contactSubmissions, {
    fields: [submissions.id],
    references: [contactSubmissions.submissionId],
  }),
  driver: one(driverApplications, {
    fields: [submissions.id],
    references: [driverApplications.submissionId],
  }),
  career: one(jobApplications, {
    fields: [submissions.id],
    references: [jobApplications.submissionId],
  }),
  sponsorship: one(sponsorshipRequests, {
    fields: [submissions.id],
    references: [sponsorshipRequests.submissionId],
  }),
  auditEvents: many(auditEvents),
}));

export const contactSubmissionsRelations = relations(
  contactSubmissions,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [contactSubmissions.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const driverApplicationsRelations = relations(
  driverApplications,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [driverApplications.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const jobApplicationsRelations = relations(
  jobApplications,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [jobApplications.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const sponsorshipRequestsRelations = relations(
  sponsorshipRequests,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [sponsorshipRequests.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const contentPostsRelations = relations(contentPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [contentPosts.authorId],
    references: [users.id],
    relationName: "contentAuthor",
  }),
  reviewer: one(users, {
    fields: [contentPosts.reviewerId],
    references: [users.id],
    relationName: "contentReviewer",
  }),
  events: many(contentEvents),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  uploader: one(users, {
    fields: [mediaAssets.uploadedBy],
    references: [users.id],
  }),
}));

export const siteDocumentsRelations = relations(siteDocuments, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [siteDocuments.updatedBy],
    references: [users.id],
  }),
}));

export const contentEventsRelations = relations(contentEvents, ({ one }) => ({
  post: one(contentPosts, {
    fields: [contentEvents.postId],
    references: [contentPosts.id],
  }),
  actor: one(users, {
    fields: [contentEvents.actorUserId],
    references: [users.id],
    relationName: "contentEventActor",
  }),
}));
