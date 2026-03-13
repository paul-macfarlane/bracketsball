import { describe, it, expect } from "vitest";
import {
  calculateBracketScores,
  getPointsForRound,
  type PoolScoring,
} from "./scoring";

const DEFAULT_SCORING: PoolScoring = {
  scoringFirstFour: 0,
  scoringRound64: 1,
  scoringRound32: 2,
  scoringSweet16: 4,
  scoringElite8: 8,
  scoringFinalFour: 16,
  scoringChampionship: 32,
};

// Helper to create a game
function makeGame(
  overrides: Partial<{
    id: string;
    round: string;
    winnerTeamId: string | null;
    status: string;
    team1Id: string | null;
    team2Id: string | null;
  }> = {},
) {
  return {
    id: "game-1",
    round: "round_of_64",
    winnerTeamId: null,
    status: "scheduled",
    team1Id: "team-a",
    team2Id: "team-b",
    ...overrides,
  };
}

describe("getPointsForRound", () => {
  it("returns correct points for each round", () => {
    expect(getPointsForRound("first_four", DEFAULT_SCORING)).toBe(0);
    expect(getPointsForRound("round_of_64", DEFAULT_SCORING)).toBe(1);
    expect(getPointsForRound("round_of_32", DEFAULT_SCORING)).toBe(2);
    expect(getPointsForRound("sweet_16", DEFAULT_SCORING)).toBe(4);
    expect(getPointsForRound("elite_8", DEFAULT_SCORING)).toBe(8);
    expect(getPointsForRound("final_four", DEFAULT_SCORING)).toBe(16);
    expect(getPointsForRound("championship", DEFAULT_SCORING)).toBe(32);
  });

  it("returns 0 for unknown round", () => {
    expect(getPointsForRound("unknown_round", DEFAULT_SCORING)).toBe(0);
  });

  it("uses custom scoring values", () => {
    const custom: PoolScoring = {
      ...DEFAULT_SCORING,
      scoringRound64: 10,
      scoringChampionship: 100,
    };
    expect(getPointsForRound("round_of_64", custom)).toBe(10);
    expect(getPointsForRound("championship", custom)).toBe(100);
  });
});

describe("calculateBracketScores", () => {
  describe("correct picks", () => {
    it("awards points for a correct R64 pick", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      expect(result.potentialPoints).toBe(1);
    });

    it("awards points for a correct championship pick", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "championship",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(32);
      expect(result.potentialPoints).toBe(32);
    });

    it("accumulates points across multiple correct picks in different rounds", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
        }),
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "final",
          winnerTeamId: "team-c",
          team1Id: "team-c",
          team2Id: "team-d",
        }),
        makeGame({
          id: "g3",
          round: "sweet_16",
          status: "final",
          winnerTeamId: "team-e",
          team1Id: "team-e",
          team2Id: "team-f",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "g2", pickedTeamId: "team-c" },
        { tournamentGameId: "g3", pickedTeamId: "team-e" },
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      // 1 + 2 + 4 = 7
      expect(result.totalPoints).toBe(7);
      expect(result.potentialPoints).toBe(7);
    });
  });

  describe("incorrect picks", () => {
    it("awards 0 points for an incorrect pick", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-b",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });

    it("awards 0 potential for incorrect pick even in later rounds", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "championship",
          status: "final",
          winnerTeamId: "team-b",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });
  });

  describe("pending games and potential points", () => {
    it("includes potential points for pending games with alive teams", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "scheduled",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(1);
    });

    it("excludes potential points when picked team is eliminated", () => {
      const games = [
        // Game where team-a lost (eliminated)
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-b",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
        // Future game where user picked team-a
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "scheduled",
          team1Id: null,
          team2Id: null,
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "g2", pickedTeamId: "team-a" },
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      // g1: incorrect (0 potential), g2: team-a eliminated (0 potential)
      expect(result.potentialPoints).toBe(0);
    });

    it("includes potential for in-progress games", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "elite_8",
          status: "in_progress",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(8);
    });
  });

  describe("mixed scenario: correct, incorrect, and pending", () => {
    it("correctly computes a realistic bracket scenario", () => {
      const games = [
        // R64: correct pick
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
        // R64: incorrect pick (team-c eliminated)
        makeGame({
          id: "g2",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-d",
          team1Id: "team-c",
          team2Id: "team-d",
        }),
        // R32: pending, picked team-a (alive) → potential
        makeGame({
          id: "g3",
          round: "round_of_32",
          status: "scheduled",
          team1Id: "team-a",
          team2Id: "team-d",
        }),
        // S16: pending, picked team-c (eliminated) → no potential
        makeGame({
          id: "g4",
          round: "sweet_16",
          status: "scheduled",
          team1Id: null,
          team2Id: null,
        }),
        // E8: pending, picked team-a (alive) → potential
        makeGame({
          id: "g5",
          round: "elite_8",
          status: "scheduled",
          team1Id: null,
          team2Id: null,
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" }, // correct: +1
        { tournamentGameId: "g2", pickedTeamId: "team-c" }, // incorrect: +0
        { tournamentGameId: "g3", pickedTeamId: "team-a" }, // pending, alive: potential +2
        { tournamentGameId: "g4", pickedTeamId: "team-c" }, // pending, eliminated: potential +0
        { tournamentGameId: "g5", pickedTeamId: "team-a" }, // pending, alive: potential +8
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      // 1 (correct g1) + 2 (g3 potential) + 8 (g5 potential) = 11
      expect(result.potentialPoints).toBe(11);
    });
  });

  describe("edge cases", () => {
    it("returns 0/0 with no picks", () => {
      const games = [
        makeGame({ id: "g1", status: "final", winnerTeamId: "team-a" }),
      ];
      const result = calculateBracketScores(games, [], DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });

    it("returns 0/0 with no games", () => {
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];
      const result = calculateBracketScores([], picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });

    it("ignores picks for games that don't exist", () => {
      const games = [
        makeGame({
          id: "g1",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "nonexistent", pickedTeamId: "team-x" },
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      expect(result.potentialPoints).toBe(1);
    });

    it("handles games with no picks gracefully", () => {
      const games = [
        makeGame({
          id: "g1",
          status: "final",
          winnerTeamId: "team-a",
        }),
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "final",
          winnerTeamId: "team-c",
          team1Id: "team-c",
          team2Id: "team-d",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      expect(result.potentialPoints).toBe(1);
    });

    it("first four games score 0 points even when correct", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "first_four",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      expect(result.potentialPoints).toBe(0);
    });
  });

  describe("custom scoring", () => {
    it("uses custom points per round", () => {
      const customScoring: PoolScoring = {
        scoringFirstFour: 5,
        scoringRound64: 10,
        scoringRound32: 20,
        scoringSweet16: 40,
        scoringElite8: 80,
        scoringFinalFour: 160,
        scoringChampionship: 320,
      };

      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
        }),
        makeGame({
          id: "g2",
          round: "final_four",
          status: "final",
          winnerTeamId: "team-c",
          team1Id: "team-c",
          team2Id: "team-d",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "g2", pickedTeamId: "team-c" },
      ];

      const result = calculateBracketScores(games, picks, customScoring);
      expect(result.totalPoints).toBe(170); // 10 + 160
      expect(result.potentialPoints).toBe(170);
    });

    it("awards first four points when scoring is non-zero", () => {
      const customScoring: PoolScoring = {
        ...DEFAULT_SCORING,
        scoringFirstFour: 3,
      };

      const games = [
        makeGame({
          id: "g1",
          round: "first_four",
          status: "final",
          winnerTeamId: "team-a",
        }),
      ];
      const picks = [{ tournamentGameId: "g1", pickedTeamId: "team-a" }];

      const result = calculateBracketScores(games, picks, customScoring);
      expect(result.totalPoints).toBe(3);
      expect(result.potentialPoints).toBe(3);
    });
  });

  describe("elimination tracking", () => {
    it("a team eliminated in one game loses potential in all future games", () => {
      const games = [
        // team-x loses in R64
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-y",
          team1Id: "team-x",
          team2Id: "team-y",
        }),
        // team-x picked in R32 (pending)
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "scheduled",
        }),
        // team-x picked in Sweet 16 (pending)
        makeGame({
          id: "g3",
          round: "sweet_16",
          status: "scheduled",
        }),
        // team-x picked in championship (pending)
        makeGame({
          id: "g4",
          round: "championship",
          status: "scheduled",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-x" },
        { tournamentGameId: "g2", pickedTeamId: "team-x" },
        { tournamentGameId: "g3", pickedTeamId: "team-x" },
        { tournamentGameId: "g4", pickedTeamId: "team-x" },
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(0);
      // All 0 because team-x is eliminated
      expect(result.potentialPoints).toBe(0);
    });

    it("only the losing team is eliminated, not the winner", () => {
      const games = [
        makeGame({
          id: "g1",
          round: "round_of_64",
          status: "final",
          winnerTeamId: "team-a",
          team1Id: "team-a",
          team2Id: "team-b",
        }),
        makeGame({
          id: "g2",
          round: "round_of_32",
          status: "scheduled",
        }),
      ];
      const picks = [
        { tournamentGameId: "g1", pickedTeamId: "team-a" },
        { tournamentGameId: "g2", pickedTeamId: "team-a" }, // alive
      ];

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(1);
      // 1 (correct) + 2 (potential for g2, team-a alive) = 3
      expect(result.potentialPoints).toBe(3);
    });
  });

  describe("perfect bracket scenario", () => {
    it("calculates max possible score with default scoring", () => {
      // Simulate a perfect bracket: all 63 games correct with default scoring
      // R64: 32 games × 1 = 32
      // R32: 16 games × 2 = 32
      // S16: 8 games × 4 = 32
      // E8: 4 games × 8 = 32
      // F4: 2 games × 16 = 32
      // Championship: 1 game × 32 = 32
      // Total: 192

      const rounds = [
        { round: "round_of_64", count: 32 },
        { round: "round_of_32", count: 16 },
        { round: "sweet_16", count: 8 },
        { round: "elite_8", count: 4 },
        { round: "final_four", count: 2 },
        { round: "championship", count: 1 },
      ];

      const games: ReturnType<typeof makeGame>[] = [];
      const picks: { tournamentGameId: string; pickedTeamId: string }[] = [];
      let gameIdx = 0;

      for (const { round, count } of rounds) {
        for (let i = 0; i < count; i++) {
          const id = `g${gameIdx++}`;
          const winnerId = `team-${id}`;
          games.push(
            makeGame({
              id,
              round,
              status: "final",
              winnerTeamId: winnerId,
              team1Id: winnerId,
              team2Id: `loser-${id}`,
            }),
          );
          picks.push({ tournamentGameId: id, pickedTeamId: winnerId });
        }
      }

      const result = calculateBracketScores(games, picks, DEFAULT_SCORING);
      expect(result.totalPoints).toBe(192);
      expect(result.potentialPoints).toBe(192);
    });
  });
});
