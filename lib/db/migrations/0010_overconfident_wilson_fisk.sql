CREATE TYPE "public"."pool_visibility" AS ENUM('private', 'public');--> statement-breakpoint
ALTER TABLE "pool" ADD COLUMN "visibility" "pool_visibility" DEFAULT 'private' NOT NULL;