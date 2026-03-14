CREATE TYPE "public"."pool_user_invite_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "pool_user_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"pool_id" text NOT NULL,
	"invited_by" text NOT NULL,
	"invited_user_id" text NOT NULL,
	"status" "pool_user_invite_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "pool_user_invite" ADD CONSTRAINT "pool_user_invite_pool_id_pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_user_invite" ADD CONSTRAINT "pool_user_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_user_invite" ADD CONSTRAINT "pool_user_invite_invited_user_id_user_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pool_user_invite_pool_id_idx" ON "pool_user_invite" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "pool_user_invite_invited_user_id_idx" ON "pool_user_invite" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "pool_user_invite_invited_by_idx" ON "pool_user_invite" USING btree ("invited_by");