"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

import {
  createPoolSchema,
  POOL_LIMITS,
  POOL_VISIBILITY_OPTIONS,
  type CreatePoolFormValues,
} from "@/lib/validators/pool";
import { createPool } from "./actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_SCORING } from "@/lib/scoring";

export function CreatePoolForm() {
  const [isPending, setIsPending] = useState(false);
  const [imageError, setImageError] = useState(false);

  const form = useForm<CreatePoolFormValues>({
    resolver: zodResolver(createPoolSchema),
    defaultValues: {
      name: "",
      visibility: "private",
      imageUrl: "",
      maxBracketsPerUser: POOL_LIMITS.bracketsPerUser.default,
      maxParticipants: POOL_LIMITS.participants.default,
    },
  });

  const watchedImageUrl = useWatch({ control: form.control, name: "imageUrl" });

  async function onSubmit(values: CreatePoolFormValues) {
    setIsPending(true);
    const result = await createPool(values);
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
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POOL_VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "private" ? "Private" : "Public"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === "public"
                  ? "Anyone can find and join this pool."
                  : "Only people with an invite link can join."}
              </FormDescription>
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
                    min={POOL_LIMITS.bracketsPerUser.min}
                    max={POOL_LIMITS.bracketsPerUser.max}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>
                  {POOL_LIMITS.bracketsPerUser.min}-
                  {POOL_LIMITS.bracketsPerUser.max}
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
                    min={POOL_LIMITS.participants.min}
                    max={POOL_LIMITS.participants.max}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>
                  {POOL_LIMITS.participants.min}-{POOL_LIMITS.participants.max}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-medium">Default Scoring</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">First Four</span>
              <span>{DEFAULT_SCORING.firstFour} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Round of 64</span>
              <span>{DEFAULT_SCORING.round64} pt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Round of 32</span>
              <span>{DEFAULT_SCORING.round32} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sweet 16</span>
              <span>{DEFAULT_SCORING.sweet16} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Elite 8</span>
              <span>{DEFAULT_SCORING.elite8} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Final Four</span>
              <span>{DEFAULT_SCORING.finalFour} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Championship</span>
              <span>{DEFAULT_SCORING.championship} pts</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating..." : "Create Pool"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
