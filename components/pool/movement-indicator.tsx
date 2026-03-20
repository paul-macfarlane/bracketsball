import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface MovementIndicatorProps {
  previousRank: number | null;
  currentRank: number;
  isNew: boolean;
}

export function MovementIndicator({
  previousRank,
  currentRank,
  isNew,
}: MovementIndicatorProps) {
  if (isNew) {
    return (
      <span className="text-xs font-medium text-muted-foreground">NEW</span>
    );
  }

  if (previousRank === null) {
    return null;
  }

  const diff = previousRank - currentRank;

  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
        <ArrowUp className="h-3 w-3" />
        {diff}
      </span>
    );
  }

  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-destructive">
        <ArrowDown className="h-3 w-3" />
        {Math.abs(diff)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />
    </span>
  );
}
