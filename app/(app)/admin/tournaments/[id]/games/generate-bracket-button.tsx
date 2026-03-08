"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
import { generateBracketAction } from "./actions";

interface GenerateBracketButtonProps {
  tournamentId: string;
}

export function GenerateBracketButton({
  tournamentId,
}: GenerateBracketButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setIsPending(true);
    const result = await generateBracketAction(tournamentId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Bracket generated!");
      router.refresh();
    }
    setIsPending(false);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Generate Bracket</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate Bracket Structure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will create all 67 tournament games based on standard NCAA
            bracket seeding (1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15).
            First Four games are not included — their winners should be manually
            assigned to Round of 64 matchups.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Generating..." : "Generate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
