"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

import {
  createTournamentSchema,
  type CreateTournamentFormValues,
} from "@/lib/validators/tournament";
import { createTournamentAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function TournamentForm() {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CreateTournamentFormValues>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      year: new Date().getFullYear(),
      isActive: false,
    },
  });

  async function onSubmit(values: CreateTournamentFormValues) {
    setIsPending(true);
    const result = await createTournamentAction(values);
    if (result?.error) {
      toast.error(result.error);
    }
    setIsPending(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name</FormLabel>
              <FormControl>
                <Input placeholder="NCAA Tournament 2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4"
                />
              </FormControl>
              <FormLabel className="!mt-0">Set as active tournament</FormLabel>
              <FormDescription className="!mt-0">
                Only one tournament can be active at a time.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating..." : "Create Tournament"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
