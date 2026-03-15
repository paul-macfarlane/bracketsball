"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserDisplay } from "@/components/user-display";
import { respondToInviteAction } from "./actions";

interface PendingInvite {
  id: string;
  poolId: string;
  poolName: string;
  poolImageUrl: string | null;
  senderName: string;
  senderImage: string | null;
  senderUsername: string | null;
  role: "leader" | "member";
  createdAt: Date;
}

interface InviteResponseListProps {
  invites: PendingInvite[];
}

export function InviteResponseList({ invites }: InviteResponseListProps) {
  const router = useRouter();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  async function handleRespond(
    inviteId: string,
    response: "accepted" | "declined",
  ) {
    setRespondingId(inviteId);
    const result = await respondToInviteAction(inviteId, response);
    setRespondingId(null);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    if (response === "accepted") {
      toast.success("Invite accepted! Redirecting to pool...");
      router.push(`/pools/${result.poolId}`);
    } else {
      toast.success("Invite declined");
      setDismissedIds((prev) => new Set(prev).add(inviteId));
      router.refresh();
    }
  }

  const visibleInvites = invites.filter((i) => !dismissedIds.has(i.id));

  if (visibleInvites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending invites. When someone invites you to a pool, it will appear
        here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visibleInvites.map((invite) => {
        const isResponding = respondingId === invite.id;

        return (
          <div
            key={invite.id}
            className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">{invite.poolName}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Invited by</span>
                <UserDisplay
                  name={invite.senderName}
                  image={invite.senderImage}
                  username={invite.senderUsername}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(invite.createdAt).toLocaleDateString()}
                </p>
                {invite.role === "leader" && (
                  <Badge variant="default" className="text-xs">
                    Leader
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="default"
                disabled={isResponding}
                onClick={() => handleRespond(invite.id, "accepted")}
              >
                {isResponding ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1 h-4 w-4" />
                )}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isResponding}
                onClick={() => handleRespond(invite.id, "declined")}
              >
                <X className="mr-1 h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
