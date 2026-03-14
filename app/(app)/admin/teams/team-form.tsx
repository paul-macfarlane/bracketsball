"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

import { teamSchema, type TeamFormValues } from "@/lib/validators/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TeamFormProps {
  defaultValues?: TeamFormValues;
  onSubmit: (values: TeamFormValues) => Promise<{ error?: string } | undefined>;
  submitLabel: string;
}

export function TeamForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: TeamFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: defaultValues ?? {
      name: "",
      shortName: "",
      abbreviation: "",
      mascot: "",
      logoUrl: "",
      espnId: "",
    },
  });

  async function handleSubmit(values: TeamFormValues) {
    setIsPending(true);
    const result = await onSubmit(values);
    if (result?.error) {
      toast.error(result.error);
    }
    setIsPending(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="University of Connecticut" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shortName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Name</FormLabel>
                <FormControl>
                  <Input placeholder="UConn" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="abbreviation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abbreviation</FormLabel>
                <FormControl>
                  <Input placeholder="CONN" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="mascot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mascot / Nickname (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Huskies" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://a.espncdn.com/i/teamlogos/ncaa/500/41.png"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="espnId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ESPN ID (optional)</FormLabel>
              <FormControl>
                <Input placeholder="41" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
