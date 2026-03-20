import { cn } from "@/lib/utils";
import type { BracketGame } from "./types";

export type ConnectorColor = "success" | "failure" | "muted";

const BORDER_COLOR_CLASSES: Record<ConnectorColor, string> = {
  success: "border-success",
  failure: "border-failure",
  muted: "border-muted-foreground/40",
};

const BG_COLOR_CLASSES: Record<ConnectorColor, string> = {
  success: "bg-success",
  failure: "bg-failure",
  muted: "bg-muted-foreground/40",
};

/**
 * Compute connector line color based on pick correctness for a source game.
 * - Green: picked team won (correct)
 * - Red: picked team lost or was eliminated (incorrect)
 * - Gray: game pending or no pick
 */
export function getConnectorColor(
  game: BracketGame,
  picks: Map<string, string>,
  eliminatedTeamIds: Set<string>,
): ConnectorColor {
  const pickedTeamId = picks.get(game.id);
  if (!pickedTeamId) return "muted";

  if (game.status === "final" && game.winnerTeamId) {
    return pickedTeamId === game.winnerTeamId ? "success" : "failure";
  }

  if (eliminatedTeamIds.has(pickedTeamId)) {
    return "failure";
  }

  return "muted";
}

interface ConnectorPairProps {
  topColor: ConnectorColor;
  bottomColor: ConnectorColor;
  direction: "ltr" | "rtl";
}

/**
 * Renders a single bracket connector pair: two source games merging into one destination.
 *
 * For LTR:
 *   ──┐
 *     ├──
 *   ──┘
 *
 * For RTL (mirrored):
 *   ┌──
 *   ──┤
 *   └──
 *
 * Uses absolute positioning within a flex-1 container.
 * Arms are at 25% (top source) and 75% (bottom source) of the pair height.
 * Output arm is at 50% (destination game center).
 */
function ConnectorPair({
  topColor,
  bottomColor,
  direction,
}: ConnectorPairProps) {
  const isLTR = direction === "ltr";
  const topBorderClass = BORDER_COLOR_CLASSES[topColor];
  const bottomBorderClass = BORDER_COLOR_CLASSES[bottomColor];
  const outputBorderClass = BORDER_COLOR_CLASSES["muted"];

  return (
    <div className="relative min-h-0 flex-1">
      {/* Top horizontal stub */}
      <div
        className={cn(
          "absolute top-1/4 h-0 border-t-2",
          topBorderClass,
          isLTR ? "left-0 right-1/2" : "left-1/2 right-0",
        )}
      />
      {/* Vertical bar — top half (colored by top source) */}
      <div
        className={cn(
          "absolute top-1/4 bottom-1/2 w-0 border-l-2",
          topBorderClass,
          "left-1/2",
        )}
      />
      {/* Vertical bar — bottom half (colored by bottom source) */}
      <div
        className={cn(
          "absolute top-1/2 bottom-1/4 w-0 border-l-2",
          bottomBorderClass,
          "left-1/2",
        )}
      />
      {/* Bottom horizontal stub */}
      <div
        className={cn(
          "absolute bottom-1/4 h-0 border-t-2",
          bottomBorderClass,
          isLTR ? "left-0 right-1/2" : "left-1/2 right-0",
        )}
      />
      {/* Output horizontal stub (to destination game) */}
      <div
        className={cn(
          "absolute top-1/2 h-0 border-t-2",
          outputBorderClass,
          isLTR ? "left-1/2 right-0" : "left-0 right-1/2",
        )}
      />
    </div>
  );
}

interface BracketConnectorProps {
  /** Colors for each pair: [topSourceColor, bottomSourceColor] */
  colors: [ConnectorColor, ConnectorColor][];
  direction: "ltr" | "rtl";
}

/**
 * Column of bracket connector lines between two adjacent rounds.
 * Renders one ConnectorPair per pair of source games.
 */
export function BracketConnector({ colors, direction }: BracketConnectorProps) {
  return (
    <div className="flex w-8 flex-col">
      {/* Header spacer to align with RoundHeader in adjacent columns */}
      <div className="mb-1 h-3.5" />
      <div className="flex flex-1 flex-col">
        {colors.map((pair, i) => (
          <ConnectorPair
            key={i}
            topColor={pair[0]}
            bottomColor={pair[1]}
            direction={direction}
          />
        ))}
      </div>
    </div>
  );
}

interface HorizontalConnectorProps {
  color: ConnectorColor;
}

/**
 * Simple horizontal connector line (used for 1:1 connections like FF→R64).
 * Renders a solid 2px bar. Relies on the parent container for vertical centering
 * (e.g., items-center on parent flex).
 */
export function HorizontalConnector({ color }: HorizontalConnectorProps) {
  return <div className={cn("h-0.5 w-10", BG_COLOR_CLASSES[color])} />;
}

interface CrossRegionConnectorProps {
  topColor: ConnectorColor;
  bottomColor: ConnectorColor;
  direction: "ltr" | "rtl";
}

/**
 * Connector between two region E8 games and a Final Four game.
 * Uses the same flex-col structure (with h-8 spacer) as the regions container
 * to ensure vertical alignment.
 */
export function CrossRegionConnector({
  topColor,
  bottomColor,
  direction,
}: CrossRegionConnectorProps) {
  const isLTR = direction === "ltr";
  const topBg = BG_COLOR_CLASSES[topColor];
  const bottomBg = BG_COLOR_CLASSES[bottomColor];
  const outputBg = BG_COLOR_CLASSES["muted"];

  return (
    <div className="relative flex w-20 flex-col">
      {/* Top region half */}
      <div className="flex flex-1 flex-col">
        {/* Region header spacer (matches RegionBracket region name height) */}
        <div className="mb-2 h-4" />
        {/* Round header spacer (matches RoundHeader in adjacent columns) */}
        <div className="mb-1 h-3.5" />
        {/* Top half of game area (above E8 center) */}
        <div className="flex-1" />
        {/* Horizontal stub at E8 game center */}
        <div className={cn("flex h-0.5", isLTR ? "mr-[50%]" : "ml-[50%]")}>
          <div className={cn("flex-1", topBg)} />
        </div>
        {/* Bottom half of game area (below E8 center) — vertical bar */}
        <div className="flex flex-1 justify-center">
          <div className={cn("w-0.5", topBg)} />
        </div>
      </div>
      {/* Spacer matching the gap between regions (h-8 = 32px) */}
      <div className="flex h-8 justify-center">
        <div className={cn("w-0.5", outputBg)} />
      </div>
      {/* Bottom region half */}
      <div className="flex flex-1 flex-col">
        {/* Region header spacer with vertical bar bridging the gap */}
        <div className="mb-2 flex h-4 justify-center">
          <div className={cn("w-0.5", outputBg)} />
        </div>
        {/* Round header spacer with vertical bar bridging the gap */}
        <div className="mb-1 flex h-3.5 justify-center">
          <div className={cn("w-0.5", bottomBg)} />
        </div>
        {/* Top half of game area (above E8 center) — vertical bar */}
        <div className="flex flex-1 justify-center">
          <div className={cn("w-0.5", bottomBg)} />
        </div>
        {/* Horizontal stub at E8 game center */}
        <div className={cn("flex h-0.5", isLTR ? "mr-[50%]" : "ml-[50%]")}>
          <div className={cn("flex-1", bottomBg)} />
        </div>
        {/* Bottom half of game area (below E8 center) */}
        <div className="flex-1" />
      </div>
      {/* Output horizontal stub at 50% of total height */}
      <div
        className={cn(
          "absolute top-1/2 h-0.5",
          outputBg,
          isLTR ? "left-1/2 right-0" : "left-0 right-1/2",
        )}
      />
    </div>
  );
}
