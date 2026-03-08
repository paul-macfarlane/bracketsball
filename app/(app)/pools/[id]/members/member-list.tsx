"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { changeMemberRoleAction, removeMemberAction } from "./actions";
import { LeavePoolButton } from "./leave-pool-button";

interface Member {
  id: string;
  userId: string;
  role: "leader" | "member";
  joinedAt: Date;
  userName: string;
  userImage: string | null;
  userUsername: string | null;
}

interface MemberListProps {
  poolId: string;
  members: Member[];
  currentUserId: string;
  isLeader: boolean;
  currentMembershipId: string;
}

export function MemberList({
  poolId,
  members,
  currentUserId,
  isLeader,
  currentMembershipId,
}: MemberListProps) {
  const router = useRouter();

  async function handleRoleChange(
    memberId: string,
    newRole: "leader" | "member",
  ) {
    const result = await changeMemberRoleAction(poolId, memberId, newRole);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  async function handleRemove(memberId: string) {
    const result = await removeMemberAction(poolId, memberId);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Member removed");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? "s" : ""} in this
              pool
            </CardDescription>
          </div>
          <LeavePoolButton
            poolId={poolId}
            currentMembershipId={currentMembershipId}
            isLeader={isLeader}
            isSoleMember={members.length === 1}
            leaderCount={members.filter((m) => m.role === "leader").length}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <UserDisplay
                    name={member.userName + (isCurrentUser ? " (you)" : "")}
                    image={member.userImage}
                    username={member.userUsername}
                  />
                  {!isLeader && (
                    <Badge
                      variant={
                        member.role === "leader" ? "default" : "secondary"
                      }
                    >
                      {member.role}
                    </Badge>
                  )}
                </div>
                {isLeader && !isCurrentUser && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value: "leader" | "member") =>
                        handleRoleChange(member.id, value)
                      }
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leader">Leader</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.userName}{" "}
                            from this pool? All of their bracket entries will be
                            permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(member.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                {isLeader && isCurrentUser && (
                  <Badge
                    variant={member.role === "leader" ? "default" : "secondary"}
                  >
                    {member.role}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
