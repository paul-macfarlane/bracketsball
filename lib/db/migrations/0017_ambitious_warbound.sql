CREATE TABLE "standings_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"bracket_entry_id" text NOT NULL,
	"pool_id" text NOT NULL,
	"tournament_id" text NOT NULL,
	"round" "tournament_round" NOT NULL,
	"rank" integer NOT NULL,
	"total_points" integer NOT NULL,
	"potential_points" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "standings_snapshot" ADD CONSTRAINT "standings_snapshot_bracket_entry_id_bracket_entry_id_fk" FOREIGN KEY ("bracket_entry_id") REFERENCES "public"."bracket_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings_snapshot" ADD CONSTRAINT "standings_snapshot_pool_id_pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings_snapshot" ADD CONSTRAINT "standings_snapshot_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "standings_snapshot_entry_round_idx" ON "standings_snapshot" USING btree ("bracket_entry_id","round");--> statement-breakpoint
CREATE INDEX "standings_snapshot_pool_tournament_round_idx" ON "standings_snapshot" USING btree ("pool_id","tournament_id","round");