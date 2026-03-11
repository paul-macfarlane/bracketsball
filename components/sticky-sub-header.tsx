import { cn } from "@/lib/utils";

interface StickySubHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function StickySubHeader({ children, className }: StickySubHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-14 z-40 -mx-4 mb-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      {children}
    </div>
  );
}
