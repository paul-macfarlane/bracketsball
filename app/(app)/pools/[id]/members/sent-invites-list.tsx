"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserDisplay } from "@/components/user-display";
import { InviteUserDialog } from "./invite-user-dialog";
import { cancelPoolUserInviteAction } from "./actions";

interface SentInvite {
  id: string;
  status: "pending" | "accepted" | "declined";
  role: "leader" | "member";
  createdAt: Date;
  respondedAt: Date | null;
  recipientName: string;
  recipientImage: string | null;
  recipientUsername: string | null;
}

interface SentInvitesListProps {
  poolId: string;
  invites: SentInvite[];
  tournamentStarted: boolean;
}

export function SentInvitesList({
  poolId,
  invites,
  tournamentStarted,
}: SentInvitesListProps) {
  const router = useRouter();

  async function handleCancel(inviteId: string) {
    const result = await cancelPoolUserInviteAction(poolId, inviteId);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Invite cancelled");
    router.refresh();
  }

  const statusVariant = (status: SentInvite["status"]) => {
    switch (status) {
      case "pending":
        return "secondary" as const;
      case "accepted":
        return "default" as const;
      case "declined":
        return "destructive" as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle>User Invites</CardTitle>
            <CardDescription>
              Direct invites sent to users for this pool
            </CardDescription>
          </div>
          {!tournamentStarted && (
            <InviteUserDialog
              poolId={poolId}
              onInviteSent={() => router.refresh()}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No user invites sent yet. Use the button above to invite users
            directly.
          </p>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-2 rounded-md border p-2 sm:gap-3 sm:p-3"
              >
                <UserDisplay
                  name={invite.recipientName}
                  image={invite.recipientImage}
                  username={invite.recipientUsername}
                  size="sm"
                />
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <Badge
                    variant={invite.role === "leader" ? "default" : "secondary"}
                  >
                    {invite.role}
                  </Badge>
                  <Badge variant={statusVariant(invite.status)}>
                    {invite.status}
                  </Badge>
                  {invite.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCancel(invite.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
