import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface UserDisplayProps {
  name: string;
  image: string | null;
  username: string | null;
  size?: "sm" | "md";
}

export function UserDisplay({
  name,
  image,
  username,
  size = "md",
}: UserDisplayProps) {
  const avatarSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";

  return (
    <div className="flex items-center gap-2">
      <Avatar className={avatarSize}>
        <AvatarImage src={image ?? undefined} alt={name} />
        <AvatarFallback className={size === "sm" ? "text-xs" : undefined}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{name}</div>
        {username && (
          <div className="truncate text-xs text-muted-foreground">
            @{username}
          </div>
        )}
      </div>
    </div>
  );
}
