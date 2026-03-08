CREATE TYPE "public"."app_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('scheduled', 'in_progress', 'final');--> statement-breakpoint
CREATE TYPE "public"."tournament_region" AS ENUM('south', 'east', 'west', 'midwest');--> statement-breakpoint
CREATE TYPE "public"."tournament_round" AS ENUM('first_four', 'round_of_64', 'round_of_32', 'sweet_16', 'elite_8', 'final_four', 'championship');--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"abbreviation" text NOT NULL,
	"logo_url" text,
	"espn_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_game" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"round" "tournament_round" NOT NULL,
	"region" "tournament_region",
	"game_number" integer NOT NULL,
	"team1_id" text,
	"team2_id" text,
	"team1_score" integer,
	"team2_score" integer,
	"winner_team_id" text,
	"status" "game_status" DEFAULT 'scheduled' NOT NULL,
	"start_time" timestamp,
	"venue_name" text,
	"venue_city" text,
	"venue_state" text,
	"espn_event_id" text,
	"source_game1_id" text,
	"source_game2_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_team" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"team_id" text NOT NULL,
	"seed" integer NOT NULL,
	"region" "tournament_region" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "app_role" "app_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_game" ADD CONSTRAINT "tournament_game_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_game" ADD CONSTRAINT "tournament_game_team1_id_team_id_fk" FOREIGN KEY ("team1_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_game" ADD CONSTRAINT "tournament_game_team2_id_team_id_fk" FOREIGN KEY ("team2_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_game" ADD CONSTRAINT "tournament_game_winner_team_id_team_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD CONSTRAINT "tournament_team_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_team" ADD CONSTRAINT "tournament_team_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tournament_game_tournament_id_idx" ON "tournament_game" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tournament_game_round_idx" ON "tournament_game" USING btree ("tournament_id","round");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_team_unique_idx" ON "tournament_team" USING btree ("tournament_id","team_id");--> statement-breakpoint
CREATE INDEX "tournament_team_tournament_id_idx" ON "tournament_team" USING btree ("tournament_id");