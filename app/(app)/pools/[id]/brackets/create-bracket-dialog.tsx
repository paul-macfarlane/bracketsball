"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  createBracketEntrySchema,
  type CreateBracketEntryFormValues,
} from "@/lib/validators/bracket-entry";
import { createBracketEntryAction } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateBracketDialogProps {
  poolId: string;
  canCreate: boolean;
  maxBrackets: number;
  currentCount: number;
}

export function CreateBracketDialog({
  poolId,
  canCreate,
  maxBrackets,
  currentCount,
}: CreateBracketDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CreateBracketEntryFormValues>({
    resolver: zodResolver(createBracketEntrySchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: CreateBracketEntryFormValues) {
    setIsPending(true);
    const result = await createBracketEntryAction(poolId, values);
    if (result?.error) {
      toast.error(result.error);
      setIsPending(false);
    }
    // On success, the action redirects
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canCreate}>
          Create Bracket ({currentCount}/{maxBrackets})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Bracket Entry</DialogTitle>
          <DialogDescription>
            Give your bracket a name to help you tell it apart from your other
            entries.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bracket Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Bracket" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creating..." : "Create Bracket"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
