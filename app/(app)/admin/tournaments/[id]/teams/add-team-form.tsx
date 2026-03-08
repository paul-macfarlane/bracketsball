"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

import {
  addTournamentTeamSchema,
  type AddTournamentTeamFormValues,
  TOURNAMENT_REGIONS,
  REGION_DISPLAY_NAMES,
} from "@/lib/validators/tournament";
import { addTeamToTournamentAction } from "../../actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTeamFormProps {
  tournamentId: string;
  availableTeams: { id: string; name: string }[];
}

export function AddTeamForm({
  tournamentId,
  availableTeams,
}: AddTeamFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<AddTournamentTeamFormValues>({
    resolver: zodResolver(addTournamentTeamSchema),
    defaultValues: {
      teamId: "",
      seed: 1,
      region: "south",
    },
  });

  async function onSubmit(values: AddTournamentTeamFormValues) {
    setIsPending(true);
    const result = await addTeamToTournamentAction(tournamentId, values);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Team added");
      form.reset();
    }
    setIsPending(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-3"
      >
        <FormField
          control={form.control}
          name="teamId"
          render={({ field }) => (
            <FormItem className="min-w-[200px] flex-1">
              <FormLabel>Team</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem className="w-[140px]">
              <FormLabel>Region</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TOURNAMENT_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {REGION_DISPLAY_NAMES[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="seed"
          render={({ field }) => (
            <FormItem className="w-[80px]">
              <FormLabel>Seed</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={16}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add"}
        </Button>
      </form>
    </Form>
  );
}
