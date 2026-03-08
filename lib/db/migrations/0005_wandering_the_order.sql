CREATE TYPE "public"."bracket_entry_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TABLE "bracket_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"pool_id" text NOT NULL,
	"user_id" text NOT NULL,
	"tournament_id" text NOT NULL,
	"name" text NOT NULL,
	"tiebreaker_score" integer,
	"status" "bracket_entry_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bracket_pick" (
	"id" text PRIMARY KEY NOT NULL,
	"bracket_entry_id" text NOT NULL,
	"tournament_game_id" text NOT NULL,
	"picked_team_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bracket_entry" ADD CONSTRAINT "bracket_entry_pool_id_pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_entry" ADD CONSTRAINT "bracket_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_entry" ADD CONSTRAINT "bracket_entry_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_pick" ADD CONSTRAINT "bracket_pick_bracket_entry_id_bracket_entry_id_fk" FOREIGN KEY ("bracket_entry_id") REFERENCES "public"."bracket_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_pick" ADD CONSTRAINT "bracket_pick_tournament_game_id_tournament_game_id_fk" FOREIGN KEY ("tournament_game_id") REFERENCES "public"."tournament_game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_pick" ADD CONSTRAINT "bracket_pick_picked_team_id_team_id_fk" FOREIGN KEY ("picked_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bracket_entry_pool_id_idx" ON "bracket_entry" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "bracket_entry_user_id_idx" ON "bracket_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bracket_entry_pool_user_idx" ON "bracket_entry" USING btree ("pool_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bracket_pick_entry_game_idx" ON "bracket_pick" USING btree ("bracket_entry_id","tournament_game_id");--> statement-breakpoint
CREATE INDEX "bracket_pick_entry_id_idx" ON "bracket_pick" USING btree ("bracket_entry_id");