import { Badge } from "@/components/ui/badge";

export function EliminationBadge({ isEliminated }: { isEliminated: boolean }) {
  if (isEliminated) {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] leading-tight text-muted-foreground"
      >
        Eliminated
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-success/30 bg-success/10 text-[10px] leading-tight text-success"
    >
      Alive
    </Badge>
  );
}
