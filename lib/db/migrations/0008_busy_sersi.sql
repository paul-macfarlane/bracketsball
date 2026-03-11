ALTER TABLE "tournament_team" ADD COLUMN "overall_wins" integer;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "overall_losses" integer;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "conference_wins" integer;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "conference_losses" integer;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "conference_name" text;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "ppg" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "opp_ppg" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "fg_pct" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "three_pt_pct" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "ft_pct" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "rebounds_per_game" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "assists_per_game" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "steals_per_game" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "blocks_per_game" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "turnovers_per_game" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "ap_ranking" integer;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "strength_of_schedule" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN "stats_synced_at" timestamp;