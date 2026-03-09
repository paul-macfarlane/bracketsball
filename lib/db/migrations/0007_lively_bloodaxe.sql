ALTER TABLE "bracket_entry" ADD COLUMN "total_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bracket_entry" ADD COLUMN "potential_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_game_espn_event_id_unique_idx" ON "tournament_game" USING btree ("espn_event_id");