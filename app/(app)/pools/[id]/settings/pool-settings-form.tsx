"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

import {
  buildUpdatePoolSchema,
  POOL_LIMITS,
  type UpdatePoolFormValues,
} from "@/lib/validators/pool";
import { updatePoolSettings } from "./actions";
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
import { Separator } from "@/components/ui/separator";
import { DEFAULT_SCORING } from "@/lib/scoring";

const SCORING_FIELDS = [
  { name: "scoringFirstFour" as const, label: "First Four" },
  { name: "scoringRound64" as const, label: "Round of 64" },
  { name: "scoringRound32" as const, label: "Round of 32" },
  { name: "scoringSweet16" as const, label: "Sweet 16" },
  { name: "scoringElite8" as const, label: "Elite 8" },
  { name: "scoringFinalFour" as const, label: "Final Four" },
  { name: "scoringChampionship" as const, label: "Championship" },
] as const;

interface PoolSettingsFormProps {
  poolId: string;
  defaultValues: {
    name: string;
    imageUrl: string;
    maxBracketsPerUser: number;
    maxParticipants: number;
    scoringFirstFour: number;
    scoringRound64: number;
    scoringRound32: number;
    scoringSweet16: number;
    scoringElite8: number;
    scoringFinalFour: number;
    scoringChampionship: number;
  };
  memberCount: number;
  maxBracketCountInPool: number;
}

export function PoolSettingsForm({
  poolId,
  defaultValues,
  memberCount,
  maxBracketCountInPool,
}: PoolSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [imageError, setImageError] = useState(false);

  const schema = buildUpdatePoolSchema(memberCount, maxBracketCountInPool);

  const form = useForm<UpdatePoolFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchedImageUrl = useWatch({
    control: form.control,
    name: "imageUrl",
  });

  async function onSubmit(values: UpdatePoolFormValues) {
    setIsPending(true);
    const result = await updatePoolSettings(poolId, values);
    if (result?.error) {
      toast.error(result.error);
    }
    setIsPending(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pool Name</FormLabel>
              <FormControl>
                <Input placeholder="My Bracket Pool" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/pool-image.jpg"
                  {...field}
                  onChange={(e) => {
                    setImageError(false);
                    field.onChange(e);
                  }}
                />
              </FormControl>
              <FormDescription>
                An image to represent your pool.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="overflow-hidden rounded-md border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              watchedImageUrl && !imageError ? watchedImageUrl : "/bracket.webp"
            }
            alt="Pool image preview"
            className="h-40 w-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
        {watchedImageUrl && imageError && (
          <p className="text-xs text-muted-foreground">
            Unable to load image preview. The default image will be used.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maxBracketsPerUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Brackets per User</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={Math.max(
                      POOL_LIMITS.bracketsPerUser.min,
                      maxBracketCountInPool,
                    )}
                    max={POOL_LIMITS.bracketsPerUser.max}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>
                  {maxBracketCountInPool > POOL_LIMITS.bracketsPerUser.min
                    ? `${maxBracketCountInPool}-${POOL_LIMITS.bracketsPerUser.max} (min set by existing brackets)`
                    : `${POOL_LIMITS.bracketsPerUser.min}-${POOL_LIMITS.bracketsPerUser.max}`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Participants</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={Math.max(POOL_LIMITS.participants.min, memberCount)}
                    max={POOL_LIMITS.participants.max}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>
                  {memberCount > POOL_LIMITS.participants.min
                    ? `${memberCount}-${POOL_LIMITS.participants.max} (min set by current members)`
                    : `${POOL_LIMITS.participants.min}-${POOL_LIMITS.participants.max}`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Scoring (points per round)</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                form.setValue("scoringFirstFour", DEFAULT_SCORING.firstFour);
                form.setValue("scoringRound64", DEFAULT_SCORING.round64);
                form.setValue("scoringRound32", DEFAULT_SCORING.round32);
                form.setValue("scoringSweet16", DEFAULT_SCORING.sweet16);
                form.setValue("scoringElite8", DEFAULT_SCORING.elite8);
                form.setValue("scoringFinalFour", DEFAULT_SCORING.finalFour);
                form.setValue(
                  "scoringChampionship",
                  DEFAULT_SCORING.championship,
                );
              }}
            >
              Reset to Defaults
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {SCORING_FIELDS.map(({ name, label }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={POOL_LIMITS.scoring.min}
                        max={POOL_LIMITS.scoring.max}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
