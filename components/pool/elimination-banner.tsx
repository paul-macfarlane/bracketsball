export interface EliminationInfo {
  isEliminated: boolean;
  leaderPoints: number;
  potentialPoints: number;
}

export function EliminationBanner({
  eliminationInfo,
  currentPoints,
}: {
  eliminationInfo: EliminationInfo;
  currentPoints: number;
}) {
  return (
    <div
      className={`mb-4 rounded-lg border p-3 text-sm ${
        eliminationInfo.isEliminated
          ? "border-border bg-muted text-muted-foreground"
          : "border-success/30 bg-success/10 text-success"
      }`}
    >
      {eliminationInfo.isEliminated
        ? `Mathematically eliminated — leader has ${eliminationInfo.leaderPoints} pts, your max possible is ${eliminationInfo.potentialPoints} pts`
        : `In contention — ${eliminationInfo.potentialPoints - currentPoints} potential pts remaining`}
    </div>
  );
}
