import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the profile data structure
export const profileDataSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  profilePicUrl: z.string(),
  postsCount: z.number(),
  followersCount: z.number(),
  followingCount: z.number(),
});

// Define the media stats structure
export const mediaStatsSchema = z.object({
  total: z.number(),
  images: z.number(),
  videos: z.number(),
  stories: z.number(),
});

export type ProfileData = z.infer<typeof profileDataSchema>;
export type MediaStats = z.infer<typeof mediaStatsSchema>;

export const downloadSessions = pgTable("download_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instagramUrl: text("instagram_url").notNull(),
  quality: text("quality").notNull().default("highest"),
  contentType: text("content_type").notNull().default("all"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").notNull().default(0),
  profileData: jsonb("profile_data").$type<ProfileData | null>(),
  mediaStats: jsonb("media_stats").$type<MediaStats | null>(),
  zipFilePath: text("zip_file_path"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at").notNull().default(sql`now() + interval '24 hours'`),
});

export const insertDownloadSessionSchema = createInsertSchema(downloadSessions).pick({
  instagramUrl: true,
  quality: true,
  contentType: true,
});

export type InsertDownloadSession = z.infer<typeof insertDownloadSessionSchema>;
export type DownloadSession = typeof downloadSessions.$inferSelect;

// Validation schemas
export const instagramUrlSchema = z.string().url().refine(
  (url) => url.includes('instagram.com'),
  { message: "Must be a valid Instagram URL" }
);

export const qualitySchema = z.enum(["highest", "high", "medium", "low"]);
export const contentTypeSchema = z.enum(["all", "images", "videos", "stories"]);
