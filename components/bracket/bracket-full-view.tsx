"use client";

import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MatchupCard } from "./matchup-card";
import {
  BracketConnector,
  CrossRegionConnector,
  HorizontalConnector,
  getConnectorColor,
  type ConnectorColor,
} from "./bracket-connector";
import type { BracketGame, BracketTeam } from "./types";
import { ROUND_LABELS } from "./types";

export interface RoundPointsSummary {
  earned: number;
  remaining: number;
  lost: number;
}

export interface BracketPositions {
  topLeft: string;
  bottomLeft: string;
  topRight: string;
  bottomRight: string;
}

const DEFAULT_BRACKET_POSITIONS: BracketPositions = {
  topLeft: "south",
  bottomLeft: "east",
  topRight: "west",
  bottomRight: "midwest",
};

interface BracketFullViewProps {
  games: BracketGame[];
  picks: Map<string, string>;
  getTeamsForGame: (gameId: string) => [BracketTeam | null, BracketTeam | null];
  getTeamById?: (teamId: string) => BracketTeam | null;
  onPick: (gameId: string, teamId: string) => void;
  disabled?: boolean;
  bracketPositions?: BracketPositions;
  roundPointsMap?: Map<string, number>;
  tiebreakerScore?: number | null;
}

// Bracket converges from both sides toward the center:
// [TopLeft    FF→R64→E8] ─┐
//                          ├─ FF1 ─┐
// [BottomLeft FF→R64→E8] ─┘       ├─ CHAMP
// [TopRight   E8←R64←FF] ─┐       │
//                          ├─ FF2 ─┘
// [BottomRight E8←R64←FF]─┘
const REGION_ROUNDS = [
  "round_of_64",
  "round_of_32",
  "sweet_16",
  "elite_8",
] as const;

export function BracketFullView({
  games,
  picks,
  getTeamsForGame,
  getTeamById,
  onPick,
  disabled = false,
  bracketPositions = DEFAULT_BRACKET_POSITIONS,
  roundPointsMap,
  tiebreakerScore,
}: BracketFullViewProps) {
  // Compute eliminated team IDs: any team that lost a completed game
  const eliminatedTeamIds = useMemo(() => {
    const eliminated = new Set<string>();
    for (const game of games) {
      if (game.status === "final" && game.winnerTeamId) {
        if (game.team1Id && game.team1Id !== game.winnerTeamId) {
          eliminated.add(game.team1Id);
        }
        if (game.team2Id && game.team2Id !== game.winnerTeamId) {
          eliminated.add(game.team2Id);
        }
      }
    }
    return eliminated;
  }, [games]);

  const LEFT_REGIONS = useMemo(
    () => [bracketPositions.topLeft, bracketPositions.bottomLeft],
    [bracketPositions.topLeft, bracketPositions.bottomLeft],
  );
  const RIGHT_REGIONS = useMemo(
    () => [bracketPositions.topRight, bracketPositions.bottomRight],
    [bracketPositions.topRight, bracketPositions.bottomRight],
  );

  const gamesByRegionAndRound = useMemo(() => {
    const map = new Map<string, BracketGame[]>();

    for (const game of games) {
      const key = `${game.region ?? "final"}-${game.round}`;
      const list = map.get(key) ?? [];
      list.push(game);
      map.set(key, list);
    }

    // Sort games within each round by gameNumber — this is set correctly
    // at tournament seeding time based on standard bracket order
    // (1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15).
    for (const list of map.values()) {
      list.sort((a, b) => a.gameNumber - b.gameNumber);
    }
    return map;
  }, [games]);

  const firstFourByR64Game = useMemo(() => {
    const map = new Map<string, BracketGame>();
    const firstFourGames = games.filter((g) => g.round === "first_four");
    const r64Games = games.filter((g) => g.round === "round_of_64");

    for (const ffGame of firstFourGames) {
      const r64Game = r64Games.find(
        (g) => g.sourceGame1Id === ffGame.id || g.sourceGame2Id === ffGame.id,
      );
      if (r64Game) {
        map.set(r64Game.id, ffGame);
      }
    }
    return map;
  }, [games]);

  const finalFourGames = useMemo(
    () =>
      games
        .filter((g) => g.round === "final_four")
        .sort((a, b) => a.gameNumber - b.gameNumber),
    [games],
  );

  const championshipGame = useMemo(
    () => games.find((g) => g.round === "championship") ?? null,
    [games],
  );

  // Match FF games to the correct side by checking which Elite 8 regions feed into them.
  // A FF game belongs to the left if BOTH its source E8 games are from left-side regions.
  const { leftFinalFour, rightFinalFour } = useMemo(() => {
    const leftRegionSet = new Set(LEFT_REGIONS);
    const elite8Games = games.filter((g) => g.round === "elite_8");
    const elite8ById = new Map(elite8Games.map((g) => [g.id, g]));

    let left: BracketGame | null = null;
    let right: BracketGame | null = null;

    for (const ffGame of finalFourGames) {
      const source1 = ffGame.sourceGame1Id
        ? elite8ById.get(ffGame.sourceGame1Id)
        : null;
      const source2 = ffGame.sourceGame2Id
        ? elite8ById.get(ffGame.sourceGame2Id)
        : null;

      const s1Left = source1?.region
        ? leftRegionSet.has(source1.region)
        : false;
      const s2Left = source2?.region
        ? leftRegionSet.has(source2.region)
        : false;

      if (s1Left && s2Left) {
        left = ffGame;
      } else if (!s1Left && !s2Left) {
        right = ffGame;
      } else {
        // Mixed sources (data mismatch) — fall back to game number
        if (!left) left = ffGame;
        else right = ffGame;
      }
    }

    return { leftFinalFour: left, rightFinalFour: right };
  }, [finalFourGames, games, LEFT_REGIONS]);

  // Compute per-round points summary: earned, remaining potential, lost
  const roundSummaries = useMemo(() => {
    const summaries = new Map<string, RoundPointsSummary>();
    if (!roundPointsMap) return summaries;

    // Group games by round
    const gamesByRound = new Map<string, BracketGame[]>();
    for (const game of games) {
      const list = gamesByRound.get(game.round) ?? [];
      list.push(game);
      gamesByRound.set(game.round, list);
    }

    for (const [round, roundGames] of gamesByRound) {
      const pts = roundPointsMap.get(round) ?? 0;
      if (pts === 0) {
        summaries.set(round, { earned: 0, remaining: 0, lost: 0 });
        continue;
      }

      let earned = 0;
      let remaining = 0;
      let lost = 0;

      for (const game of roundGames) {
        const pickedTeamId = picks.get(game.id);
        if (!pickedTeamId) continue;

        if (game.status === "final" && game.winnerTeamId) {
          if (pickedTeamId === game.winnerTeamId) {
            earned += pts;
          } else {
            lost += pts;
          }
        } else {
          // Game not decided yet
          if (eliminatedTeamIds.has(pickedTeamId)) {
            lost += pts;
          } else {
            remaining += pts;
          }
        }
      }

      summaries.set(round, { earned, remaining, lost });
    }

    return summaries;
  }, [games, picks, roundPointsMap, eliminatedTeamIds]);

  // Check if any region on each side has First Four games, so we can reserve
  // placeholder space on regions that don't (keeping round columns aligned).
  const sideHasFirstFour = useMemo(() => {
    const check = (regions: string[]) =>
      regions.some((region) => {
        const r64Games =
          gamesByRegionAndRound.get(`${region}-round_of_64`) ?? [];
        return r64Games.some((g) => firstFourByR64Game.has(g.id));
      });
    return { left: check(LEFT_REGIONS), right: check(RIGHT_REGIONS) };
  }, [gamesByRegionAndRound, firstFourByR64Game, LEFT_REGIONS, RIGHT_REGIONS]);

  function renderMatchup(game: BracketGame) {
    const [team1, team2] = getTeamsForGame(game.id);
    const pickedTeamId = picks.get(game.id) ?? null;
    // Resolve picked team data even if it's not one of the displayed teams
    // (e.g., user predicted an eliminated team that didn't make it to this game)
    const pickedTeamData = pickedTeamId
      ? team1?.id === pickedTeamId
        ? team1
        : team2?.id === pickedTeamId
          ? team2
          : (getTeamById?.(pickedTeamId) ?? null)
      : null;
    return (
      <MatchupCard
        gameId={game.id}
        team1={team1}
        team2={team2}
        pickedTeamId={pickedTeamId}
        pickedTeamData={pickedTeamData}
        onPick={onPick}
        disabled={disabled}
        winnerTeamId={game.winnerTeamId}
        gameStatus={game.status}
        statusDetail={game.statusDetail}
        roundPoints={roundPointsMap?.get(game.round) ?? 0}
        team1Score={game.team1Score}
        team2Score={game.team2Score}
        startTime={game.startTime}
        venueName={game.venueName}
        venueCity={game.venueCity}
        venueState={game.venueState}
        eliminatedTeamIds={eliminatedTeamIds}
        actualTeam1Id={game.team1Id}
        actualTeam2Id={game.team2Id}
      />
    );
  }

  // Compute cross-region connector colors (E8 → Final Four)
  const leftE8Colors = useMemo((): [ConnectorColor, ConnectorColor] => {
    const topE8Games =
      gamesByRegionAndRound.get(`${bracketPositions.topLeft}-elite_8`) ?? [];
    const bottomE8Games =
      gamesByRegionAndRound.get(`${bracketPositions.bottomLeft}-elite_8`) ?? [];
    return [
      topE8Games[0]
        ? getConnectorColor(topE8Games[0], picks, eliminatedTeamIds)
        : "muted",
      bottomE8Games[0]
        ? getConnectorColor(bottomE8Games[0], picks, eliminatedTeamIds)
        : "muted",
    ];
  }, [gamesByRegionAndRound, bracketPositions, picks, eliminatedTeamIds]);

  const rightE8Colors = useMemo((): [ConnectorColor, ConnectorColor] => {
    const topE8Games =
      gamesByRegionAndRound.get(`${bracketPositions.topRight}-elite_8`) ?? [];
    const bottomE8Games =
      gamesByRegionAndRound.get(`${bracketPositions.bottomRight}-elite_8`) ??
      [];
    return [
      topE8Games[0]
        ? getConnectorColor(topE8Games[0], picks, eliminatedTeamIds)
        : "muted",
      bottomE8Games[0]
        ? getConnectorColor(bottomE8Games[0], picks, eliminatedTeamIds)
        : "muted",
    ];
  }, [gamesByRegionAndRound, bracketPositions, picks, eliminatedTeamIds]);

  // FF → Championship connector colors
  const leftFFColor = useMemo(
    (): ConnectorColor =>
      leftFinalFour
        ? getConnectorColor(leftFinalFour, picks, eliminatedTeamIds)
        : "muted",
    [leftFinalFour, picks, eliminatedTeamIds],
  );
  const rightFFColor = useMemo(
    (): ConnectorColor =>
      rightFinalFour
        ? getConnectorColor(rightFinalFour, picks, eliminatedTeamIds)
        : "muted",
    [rightFinalFour, picks, eliminatedTeamIds],
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-[1700px] items-stretch gap-0">
        {/* Left regions */}
        <div className="flex flex-col">
          {LEFT_REGIONS.map((region, i) => (
            <Fragment key={region}>
              {i > 0 && <div className="h-8" />}
              <RegionBracket
                region={region}
                rounds={REGION_ROUNDS}
                gamesByRegionAndRound={gamesByRegionAndRound}
                firstFourByR64Game={firstFourByR64Game}
                picks={picks}
                getTeamsForGame={getTeamsForGame}
                getTeamById={getTeamById}
                onPick={onPick}
                disabled={disabled}
                direction="ltr"
                sideHasFirstFour={sideHasFirstFour.left}
                roundPointsMap={roundPointsMap}
                eliminatedTeamIds={eliminatedTeamIds}
                roundSummaries={roundSummaries}
              />
            </Fragment>
          ))}
        </div>

        {/* Connector: left E8 → left Final Four */}
        <CrossRegionConnector
          topColor={leftE8Colors[0]}
          bottomColor={leftE8Colors[1]}
          direction="ltr"
        />

        {/* Center section: Final Four + Connectors + Championship.
            RoundHeaders are absolutely positioned above cards so that
            items-center aligns connectors to the card center, not
            the header+card group center. */}
        <div className="flex items-center">
          {leftFinalFour && (
            <div className="relative px-1">
              <div className="absolute bottom-full left-0 right-0">
                <RoundHeader
                  round="final_four"
                  summary={roundSummaries.get("final_four")}
                />
              </div>
              {renderMatchup(leftFinalFour)}
            </div>
          )}

          <HorizontalConnector color={leftFFColor} />

          {championshipGame && (
            <div className="relative px-1">
              <div className="absolute bottom-full left-0 right-0">
                <RoundHeader
                  round="championship"
                  summary={roundSummaries.get("championship")}
                />
              </div>
              {renderMatchup(championshipGame)}
              {tiebreakerScore != null && (
                <div className="mt-2 text-center text-xs text-muted-foreground">
                  <span className="font-medium">Tiebreaker:</span>{" "}
                  {tiebreakerScore}
                </div>
              )}
            </div>
          )}

          <HorizontalConnector color={rightFFColor} />

          {rightFinalFour && (
            <div className="relative px-1">
              <div className="absolute bottom-full left-0 right-0">
                <RoundHeader
                  round="final_four"
                  summary={roundSummaries.get("final_four")}
                />
              </div>
              {renderMatchup(rightFinalFour)}
            </div>
          )}
        </div>

        {/* Connector: right E8 → right Final Four */}
        <CrossRegionConnector
          topColor={rightE8Colors[0]}
          bottomColor={rightE8Colors[1]}
          direction="rtl"
        />

        {/* Right regions */}
        <div className="flex flex-col">
          {RIGHT_REGIONS.map((region, i) => (
            <Fragment key={region}>
              {i > 0 && <div className="h-8" />}
              <RegionBracket
                region={region}
                rounds={REGION_ROUNDS}
                gamesByRegionAndRound={gamesByRegionAndRound}
                firstFourByR64Game={firstFourByR64Game}
                picks={picks}
                getTeamsForGame={getTeamsForGame}
                getTeamById={getTeamById}
                onPick={onPick}
                disabled={disabled}
                direction="rtl"
                sideHasFirstFour={sideHasFirstFour.right}
                roundPointsMap={roundPointsMap}
                eliminatedTeamIds={eliminatedTeamIds}
                roundSummaries={roundSummaries}
              />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoundHeader({
  round,
  summary,
}: {
  round: string;
  summary?: RoundPointsSummary;
}) {
  const hasActivity =
    summary &&
    (summary.earned > 0 || summary.remaining > 0 || summary.lost > 0);
  return (
    <div className="mb-1 text-center">
      <div className="text-[10px] font-medium text-muted-foreground">
        {ROUND_LABELS[round] ?? round}
      </div>
      {hasActivity && (
        <div className="flex items-center justify-center gap-1.5 text-[9px]">
          {summary.earned > 0 && (
            <span className="font-medium text-success">{summary.earned}</span>
          )}
          {summary.remaining > 0 && (
            <span className="font-medium text-muted-foreground">
              +{summary.remaining}
            </span>
          )}
          {summary.lost > 0 && (
            <span className="font-medium text-failure line-through">
              {summary.lost}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface RegionBracketProps {
  region: string;
  rounds: readonly string[];
  gamesByRegionAndRound: Map<string, BracketGame[]>;
  firstFourByR64Game: Map<string, BracketGame>;
  picks: Map<string, string>;
  getTeamsForGame: (gameId: string) => [BracketTeam | null, BracketTeam | null];
  getTeamById?: (teamId: string) => BracketTeam | null;
  onPick: (gameId: string, teamId: string) => void;
  disabled: boolean;
  direction: "ltr" | "rtl";
  sideHasFirstFour: boolean;
  roundPointsMap?: Map<string, number>;
  eliminatedTeamIds: Set<string>;
  roundSummaries: Map<string, RoundPointsSummary>;
}

function RegionBracket({
  region,
  rounds,
  gamesByRegionAndRound,
  firstFourByR64Game,
  picks,
  getTeamsForGame,
  getTeamById,
  onPick,
  disabled,
  direction,
  sideHasFirstFour,
  roundPointsMap,
  eliminatedTeamIds,
  roundSummaries,
}: RegionBracketProps) {
  const orderedRounds = direction === "rtl" ? [...rounds].reverse() : rounds;

  const r64Games = gamesByRegionAndRound.get(`${region}-round_of_64`) ?? [];
  const hasFirstFour = r64Games.some((g) => firstFourByR64Game.has(g.id));
  const showFirstFourColumn = hasFirstFour || sideHasFirstFour;

  // Compute connector colors between each pair of adjacent rounds
  const connectorData = useMemo(() => {
    const data: [ConnectorColor, ConnectorColor][][] = [];
    for (let i = 0; i < orderedRounds.length - 1; i++) {
      // Source round is the one with more games (earlier tournament round)
      const sourceRoundKey =
        direction === "ltr" ? orderedRounds[i] : orderedRounds[i + 1];
      const sourceGames =
        gamesByRegionAndRound.get(`${region}-${sourceRoundKey}`) ?? [];
      const pairCount = Math.floor(sourceGames.length / 2);
      const colors: [ConnectorColor, ConnectorColor][] = [];
      for (let j = 0; j < pairCount; j++) {
        const topGame = sourceGames[j * 2];
        const bottomGame = sourceGames[j * 2 + 1];
        colors.push([
          topGame
            ? getConnectorColor(topGame, picks, eliminatedTeamIds)
            : "muted",
          bottomGame
            ? getConnectorColor(bottomGame, picks, eliminatedTeamIds)
            : "muted",
        ]);
      }
      data.push(colors);
    }
    return data;
  }, [
    orderedRounds,
    direction,
    region,
    gamesByRegionAndRound,
    picks,
    eliminatedTeamIds,
  ]);

  return (
    <div className="flex-1">
      <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {region}
      </div>
      <div className="flex items-stretch gap-0">
        {orderedRounds.map((round, i) => {
          const roundGames =
            gamesByRegionAndRound.get(`${region}-${round}`) ?? [];

          return (
            <Fragment key={round}>
              {round === "round_of_64" ? (
                <R64WithFirstFour
                  r64Games={roundGames}
                  firstFourByR64Game={firstFourByR64Game}
                  picks={picks}
                  getTeamsForGame={getTeamsForGame}
                  getTeamById={getTeamById}
                  onPick={onPick}
                  disabled={disabled}
                  direction={direction}
                  showFirstFourColumn={showFirstFourColumn}
                  roundPointsMap={roundPointsMap}
                  eliminatedTeamIds={eliminatedTeamIds}
                  roundSummaries={roundSummaries}
                />
              ) : (
                <RoundColumn
                  round={round}
                  games={roundGames}
                  picks={picks}
                  getTeamsForGame={getTeamsForGame}
                  getTeamById={getTeamById}
                  onPick={onPick}
                  disabled={disabled}
                  roundPointsMap={roundPointsMap}
                  eliminatedTeamIds={eliminatedTeamIds}
                  roundSummary={roundSummaries.get(round)}
                />
              )}
              {i < orderedRounds.length - 1 && connectorData[i] && (
                <BracketConnector
                  colors={connectorData[i]}
                  direction={direction}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

interface R64WithFirstFourProps {
  r64Games: BracketGame[];
  firstFourByR64Game: Map<string, BracketGame>;
  picks: Map<string, string>;
  getTeamsForGame: (gameId: string) => [BracketTeam | null, BracketTeam | null];
  getTeamById?: (teamId: string) => BracketTeam | null;
  onPick: (gameId: string, teamId: string) => void;
  disabled: boolean;
  direction: "ltr" | "rtl";
  showFirstFourColumn: boolean;
  roundPointsMap?: Map<string, number>;
  eliminatedTeamIds: Set<string>;
  roundSummaries: Map<string, RoundPointsSummary>;
}

/** Resolve picked team data, looking up by ID if not one of the displayed teams */
function resolvePickedTeam(
  pickedTeamId: string | null,
  team1: BracketTeam | null,
  team2: BracketTeam | null,
  getTeamById?: (teamId: string) => BracketTeam | null,
): BracketTeam | null {
  if (!pickedTeamId) return null;
  if (team1?.id === pickedTeamId) return team1;
  if (team2?.id === pickedTeamId) return team2;
  return getTeamById?.(pickedTeamId) ?? null;
}

/**
 * Renders R64 games paired with their First Four play-in games in rows,
 * ensuring each FF game is vertically aligned with its R64 game.
 */
function R64WithFirstFour({
  r64Games,
  firstFourByR64Game,
  picks,
  getTeamsForGame,
  getTeamById,
  onPick,
  disabled,
  direction,
  showFirstFourColumn,
  roundPointsMap,
  eliminatedTeamIds,
  roundSummaries,
}: R64WithFirstFourProps) {
  const hasAnyFirstFour = r64Games.some((g) => firstFourByR64Game.has(g.id));

  return (
    <div className="flex flex-1 flex-col items-center px-1">
      {/* Column headers */}
      <div className="mb-1 flex gap-0">
        {showFirstFourColumn && (
          <div
            className={cn("px-1", direction === "rtl" ? "order-3" : "order-1")}
          >
            <div className="w-44">
              {hasAnyFirstFour ? (
                <RoundHeader
                  round="first_four"
                  summary={roundSummaries.get("first_four")}
                />
              ) : (
                <div className="text-center text-[10px] font-medium text-muted-foreground">
                  &nbsp;
                </div>
              )}
            </div>
          </div>
        )}
        {/* FF→R64 connector header spacer */}
        {showFirstFourColumn && <div className="order-2 w-10" />}
        <div
          className={cn("px-1", direction === "rtl" ? "order-1" : "order-3")}
        >
          <div className="w-44">
            <RoundHeader
              round="round_of_64"
              summary={roundSummaries.get("round_of_64")}
            />
          </div>
        </div>
      </div>
      {/* Game rows */}
      <div className="flex flex-1 flex-col">
        {r64Games.map((r64Game) => {
          const ffGame = firstFourByR64Game.get(r64Game.id);
          const [r64Team1, r64Team2] = getTeamsForGame(r64Game.id);

          // Resolve FF game teams if present
          const ffTeams = ffGame ? getTeamsForGame(ffGame.id) : null;
          const ffPickedId = ffGame ? (picks.get(ffGame.id) ?? null) : null;

          // FF→R64 connector color
          const ffConnectorColor: ConnectorColor = ffGame
            ? getConnectorColor(ffGame, picks, eliminatedTeamIds)
            : "muted";

          return (
            <div
              key={r64Game.id}
              className="flex flex-1 items-center gap-0 py-1"
            >
              {showFirstFourColumn && (
                <div
                  className={cn(
                    "px-1",
                    direction === "rtl" ? "order-3" : "order-1",
                  )}
                >
                  {ffGame && ffTeams ? (
                    <MatchupCard
                      gameId={ffGame.id}
                      team1={ffTeams[0]}
                      team2={ffTeams[1]}
                      pickedTeamId={ffPickedId}
                      pickedTeamData={resolvePickedTeam(
                        ffPickedId,
                        ffTeams[0],
                        ffTeams[1],
                        getTeamById,
                      )}
                      onPick={onPick}
                      disabled={disabled}
                      winnerTeamId={ffGame.winnerTeamId}
                      gameStatus={ffGame.status}
                      statusDetail={ffGame.statusDetail}
                      roundPoints={roundPointsMap?.get("first_four") ?? 0}
                      team1Score={ffGame.team1Score}
                      team2Score={ffGame.team2Score}
                      startTime={ffGame.startTime}
                      venueName={ffGame.venueName}
                      venueCity={ffGame.venueCity}
                      venueState={ffGame.venueState}
                      eliminatedTeamIds={eliminatedTeamIds}
                      actualTeam1Id={ffGame.team1Id}
                      actualTeam2Id={ffGame.team2Id}
                    />
                  ) : (
                    <div className="w-44" />
                  )}
                </div>
              )}
              {/* FF→R64 horizontal connector */}
              {showFirstFourColumn && ffGame && (
                <div className="order-2">
                  <HorizontalConnector color={ffConnectorColor} />
                </div>
              )}
              {showFirstFourColumn && !ffGame && (
                <div className="order-2 w-10" />
              )}
              <div
                className={cn(
                  "px-1",
                  direction === "rtl" ? "order-1" : "order-3",
                )}
              >
                <MatchupCard
                  gameId={r64Game.id}
                  team1={r64Team1}
                  team2={r64Team2}
                  pickedTeamId={picks.get(r64Game.id) ?? null}
                  pickedTeamData={resolvePickedTeam(
                    picks.get(r64Game.id) ?? null,
                    r64Team1,
                    r64Team2,
                    getTeamById,
                  )}
                  onPick={onPick}
                  disabled={disabled}
                  winnerTeamId={r64Game.winnerTeamId}
                  gameStatus={r64Game.status}
                  statusDetail={r64Game.statusDetail}
                  roundPoints={roundPointsMap?.get("round_of_64") ?? 0}
                  team1Score={r64Game.team1Score}
                  team2Score={r64Game.team2Score}
                  startTime={r64Game.startTime}
                  venueName={r64Game.venueName}
                  venueCity={r64Game.venueCity}
                  venueState={r64Game.venueState}
                  eliminatedTeamIds={eliminatedTeamIds}
                  actualTeam1Id={r64Game.team1Id}
                  actualTeam2Id={r64Game.team2Id}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RoundColumnProps {
  round: string;
  games: BracketGame[];
  picks: Map<string, string>;
  getTeamsForGame: (gameId: string) => [BracketTeam | null, BracketTeam | null];
  getTeamById?: (teamId: string) => BracketTeam | null;
  onPick: (gameId: string, teamId: string) => void;
  disabled: boolean;
  roundPointsMap?: Map<string, number>;
  eliminatedTeamIds: Set<string>;
  roundSummary?: RoundPointsSummary;
}

function RoundColumn({
  round,
  games,
  picks,
  getTeamsForGame,
  getTeamById,
  onPick,
  disabled,
  roundPointsMap,
  eliminatedTeamIds,
  roundSummary,
}: RoundColumnProps) {
  return (
    <div className="flex flex-1 flex-col px-1">
      <RoundHeader round={round} summary={roundSummary} />
      <div className="flex flex-1 flex-col">
        {games.map((game) => {
          const [team1, team2] = getTeamsForGame(game.id);
          const pickedId = picks.get(game.id) ?? null;
          return (
            <div
              key={game.id}
              className="flex flex-1 items-center justify-center py-1"
            >
              <MatchupCard
                gameId={game.id}
                team1={team1}
                team2={team2}
                pickedTeamId={pickedId}
                pickedTeamData={resolvePickedTeam(
                  pickedId,
                  team1,
                  team2,
                  getTeamById,
                )}
                onPick={onPick}
                disabled={disabled}
                winnerTeamId={game.winnerTeamId}
                gameStatus={game.status}
                statusDetail={game.statusDetail}
                roundPoints={roundPointsMap?.get(round) ?? 0}
                team1Score={game.team1Score}
                team2Score={game.team2Score}
                startTime={game.startTime}
                venueName={game.venueName}
                venueCity={game.venueCity}
                venueState={game.venueState}
                eliminatedTeamIds={eliminatedTeamIds}
                actualTeam1Id={game.team1Id}
                actualTeam2Id={game.team2Id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
