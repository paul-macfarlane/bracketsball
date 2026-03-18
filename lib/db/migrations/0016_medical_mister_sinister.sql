ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "strength_of_schedule_rank" integer;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "strength_of_record" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "strength_of_record_rank" integer;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "bpi" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "bpi_offense" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "bpi_defense" real;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "bpi_rank" integer;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "bpi_offense_rank" integer;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD COLUMN IF NOT EXISTS "bpi_defense_rank" integer;