CREATE UNIQUE INDEX "team_espn_id_unique_idx" ON "team" USING btree ("espn_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_year_unique_idx" ON "tournament" USING btree ("year");