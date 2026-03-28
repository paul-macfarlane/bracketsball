import { describe, it, expect } from "vitest";
import { computeWhatINeed } from "./what-i-need";
import type { PoolScoring } from "./scoring";

const defaultScoring: PoolScoring = {
  scoringFirstFour: 0,
  scoringRound64: 1,
  scoringRound32: 2,
  scoringSweet16: 4,
  scoringElite8: 8,
  scoringFinalFour: 16,
  scoringChampionship: 32,
};

function makeTeamMap(teamIds: string[]) {
  const map = new Map<
    string,
    {
      name: string;
      shortName: string;
      abbreviation: string;
      logoUrl: string | null;
      darkLogoUrl: string | null;
      seed: number;
    }
  >();
  teamIds.forEach((id, i) => {
    map.set(id, {
      name: `Team ${id}`,
      shortName: `T${id}`,
      abbreviation: id.toUpperCase(),
      logoUrl: null,
      darkLogoUrl: null,
      seed: i + 1,
    });
  });
  return map;
}

describe("computeWhatINeed", () => {
  it("shows root for team when single team is picked in upcoming game", () => {
    const games = [
      {
        id: "g1",
        round: "sweet_16",
        status: "scheduled",
        startTime: null,
        team1Id: "a",
        team2Id: "b",
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
    ];
    const picks = [{ tournamentGameId: "g1", pickedTeamId: "a" }];
    const teamMap = makeTeamMap(["a", "b"]);

    const result = computeWhatINeed(games, picks, defaultScoring, teamMap);

    expect(result).toHaveLength(1);
    expect(result[0].round).toBe("sweet_16");
    expect(result[0].games).toHaveLength(1);
    expect(result[0].games[0].rootFor).toBe("team1");
    expect(result[0].games[0].team1Impact).toBe(4); // sweet_16 = 4
    expect(result[0].games[0].team2Impact).toBe(0);
  });

  it("shows 'both' when both teams are picked in same game", () => {
    const games = [
      {
        id: "g1",
        round: "round_of_32",
        status: "scheduled",
        startTime: null,
        team1Id: "a",
        team2Id: "b",
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
    ];
    const picks = [
      { tournamentGameId: "g1", pickedTeamId: "a" },
      { tournamentGameId: "g1", pickedTeamId: "b" },
    ];
    const teamMap = makeTeamMap(["a", "b"]);

    const result = computeWhatINeed(games, picks, defaultScoring, teamMap);

    expect(result[0].games[0].rootFor).toBe("both");
    expect(result[0].games[0].team1Impact).toBe(2);
    expect(result[0].games[0].team2Impact).toBe(2);
  });

  it("excludes games when neither team is picked (no stake)", () => {
    const games = [
      {
        id: "g1",
        round: "round_of_64",
        status: "scheduled",
        startTime: null,
        team1Id: "a",
        team2Id: "b",
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
    ];
    const picks: { tournamentGameId: string; pickedTeamId: string }[] = [];
    const teamMap = makeTeamMap(["a", "b"]);

    const result = computeWhatINeed(games, picks, defaultScoring, teamMap);

    expect(result).toHaveLength(0);
  });

  it("excludes game when only picked team is eliminated (no stake)", () => {
    const games = [
      // Completed game where team 'a' lost
      {
        id: "g0",
        round: "round_of_64",
        status: "final",
        startTime: null,
        team1Id: "a",
        team2Id: "c",
        team1Score: 60,
        team2Score: 70,
        winnerTeamId: "c",
      },
      // Upcoming game - user had picked 'a' to win here too
      {
        id: "g1",
        round: "round_of_32",
        status: "scheduled",
        startTime: null,
        team1Id: "a",
        team2Id: "b",
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
    ];
    const picks = [
      { tournamentGameId: "g0", pickedTeamId: "a" },
      { tournamentGameId: "g1", pickedTeamId: "a" },
    ];
    const teamMap = makeTeamMap(["a", "b", "c"]);

    const result = computeWhatINeed(games, picks, defaultScoring, teamMap);

    // Game is excluded because the only picked team (a) is eliminated, so rootFor would be "none"
    expect(result).toHaveLength(0);
  });

  it("computes cumulative impact through multiple rounds", () => {
    const games = [
      {
        id: "g1",
        round: "sweet_16",
        status: "scheduled",
        startTime: null,
        team1Id: "a",
        team2Id: "b",
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
      {
        id: "g2",
        round: "elite_8",
        status: "scheduled",
        startTime: null,
        team1Id: null,
        team2Id: null,
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
      {
        id: "g3",
        round: "final_four",
        status: "scheduled",
        startTime: null,
        team1Id: null,
        team2Id: null,
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
    ];
    // User picked team 'a' to win sweet 16, elite 8, and final four
    const picks = [
      { tournamentGameId: "g1", pickedTeamId: "a" },
      { tournamentGameId: "g2", pickedTeamId: "a" },
      { tournamentGameId: "g3", pickedTeamId: "a" },
    ];
    const teamMap = makeTeamMap(["a", "b"]);

    const result = computeWhatINeed(games, picks, defaultScoring, teamMap);

    // For the sweet_16 game (g1), cumulative = sweet_16(4) + elite_8(8) + final_four(16) = 28
    expect(result[0].games[0].team1Impact).toBe(28);
    // Winning final_four game means advancing to championship
    expect(result[0].games[0].team1FurthestRound).toBe("championship");
  });

  it("groups by round and sorts within round by totalImpact desc", () => {
    const games = [
      {
        id: "g1",
        round: "sweet_16",
        status: "scheduled",
        startTime: null,
        team1Id: "a",
        team2Id: "b",
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
      {
        id: "g2",
        round: "sweet_16",
        status: "scheduled",
        startTime: null,
        team1Id: "c",
        team2Id: "d",
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
      {
        id: "g3",
        round: "elite_8",
        status: "scheduled",
        startTime: null,
        team1Id: "e",
        team2Id: "f",
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
    ];
    // Pick team 'c' in multiple rounds for higher impact, team 'a' in just one, team 'e' in elite_8 for stake
    const picks = [
      { tournamentGameId: "g1", pickedTeamId: "a" },
      { tournamentGameId: "g2", pickedTeamId: "c" },
      { tournamentGameId: "g3", pickedTeamId: "c" },
      { tournamentGameId: "g3", pickedTeamId: "e" },
    ];
    const teamMap = makeTeamMap(["a", "b", "c", "d", "e", "f"]);

    const result = computeWhatINeed(games, picks, defaultScoring, teamMap);

    expect(result).toHaveLength(2);
    expect(result[0].round).toBe("sweet_16");
    expect(result[1].round).toBe("elite_8");
    // Within sweet_16, g2 (c has impact 4+8=12) should be before g1 (a has impact 4)
    expect(result[0].games[0].gameId).toBe("g2");
    expect(result[0].games[1].gameId).toBe("g1");
  });

  it("includes score data for in-progress games", () => {
    const games = [
      {
        id: "g1",
        round: "round_of_64",
        status: "in_progress",
        startTime: "2026-03-20T12:00:00Z",
        team1Id: "a",
        team2Id: "b",
        team1Score: 35,
        team2Score: 28,
        winnerTeamId: null,
      },
    ];
    const picks = [{ tournamentGameId: "g1", pickedTeamId: "a" }];
    const teamMap = makeTeamMap(["a", "b"]);

    const result = computeWhatINeed(games, picks, defaultScoring, teamMap);

    expect(result[0].games[0].status).toBe("in_progress");
    expect(result[0].games[0].team1?.score).toBe(35);
    expect(result[0].games[0].team2?.score).toBe(28);
    expect(result[0].games[0].startTime).toBe("2026-03-20T12:00:00Z");
  });

  it("excludes games with null teams (TBD matchups)", () => {
    const games = [
      {
        id: "g1",
        round: "elite_8",
        status: "scheduled",
        startTime: null,
        team1Id: "a",
        team2Id: null,
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
      {
        id: "g2",
        round: "elite_8",
        status: "scheduled",
        startTime: null,
        team1Id: null,
        team2Id: null,
        team1Score: null,
        team2Score: null,
        winnerTeamId: null,
      },
    ];
    const picks = [{ tournamentGameId: "g1", pickedTeamId: "a" }];
    const teamMap = makeTeamMap(["a"]);

    const result = computeWhatINeed(games, picks, defaultScoring, teamMap);

    expect(result).toHaveLength(0);
  });

  it("excludes completed games", () => {
    const games = [
      {
        id: "g1",
        round: "round_of_64",
        status: "final",
        startTime: null,
        team1Id: "a",
        team2Id: "b",
        team1Score: 70,
        team2Score: 65,
        winnerTeamId: "a",
      },
    ];
    const picks = [{ tournamentGameId: "g1", pickedTeamId: "a" }];
    const teamMap = makeTeamMap(["a", "b"]);

    const result = computeWhatINeed(games, picks, defaultScoring, teamMap);

    expect(result).toHaveLength(0);
  });

  it("returns empty when no games provided", () => {
    const result = computeWhatINeed([], [], defaultScoring, makeTeamMap([]));
    expect(result).toHaveLength(0);
  });
});
