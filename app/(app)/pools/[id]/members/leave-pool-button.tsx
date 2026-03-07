"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { leavePoolAction } from "./actions";

interface LeavePoolButtonProps {
  poolId: string;
  currentMembershipId: string;
  isLeader: boolean;
  isSoleMember: boolean;
  leaderCount: number;
}

export function LeavePoolButton({
  poolId,
  isLeader,
  isSoleMember,
  leaderCount,
}: LeavePoolButtonProps) {
  const router = useRouter();

  const isLastLeader = isLeader && leaderCount <= 1 && !isSoleMember;

  async function handleLeave() {
    const result = await leavePoolAction(poolId);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.poolDeleted ? "Pool deleted" : "You have left the pool",
    );
    router.replace("/pools");
  }

  function getDescription() {
    if (isSoleMember) {
      return "You are the only member. Leaving will permanently delete this pool.";
    }
    return "Are you sure you want to leave this pool? All of your bracket entries will be permanently deleted.";
  }

  if (isLastLeader) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Promote another member to leader before leaving"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Leave Pool
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Leave Pool
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave pool</AlertDialogTitle>
          <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeave}>
            {isSoleMember ? "Leave & Delete Pool" : "Leave Pool"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
