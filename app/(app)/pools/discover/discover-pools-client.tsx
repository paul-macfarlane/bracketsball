"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { searchPublicPools, joinPublicPoolAction } from "./actions";
import type { PublicPoolSortOption } from "@/lib/db/queries/pools";

interface PublicPool {
  id: string;
  name: string;
  imageUrl: string | null;
  maxBracketsPerUser: number;
  maxParticipants: number;
  scoringFirstFour: number;
  scoringRound64: number;
  scoringRound32: number;
  scoringSweet16: number;
  scoringElite8: number;
  scoringFinalFour: number;
  scoringChampionship: number;
  memberCount: number;
  availableSpots: number;
  isMember: boolean;
}

interface DiscoverPoolsClientProps {
  initialData: {
    pools: PublicPool[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  tournamentStarted: boolean;
}

const SORT_OPTIONS: { value: PublicPoolSortOption; label: string }[] = [
  { value: "most-members", label: "Most Members" },
  { value: "most-available", label: "Most Available" },
  { value: "fewest-brackets", label: "Fewest Brackets Per User" },
  { value: "most-brackets", label: "Most Brackets Per User" },
  { value: "alphabetical", label: "Alphabetical" },
];

export function DiscoverPoolsClient({
  initialData,
  tournamentStarted,
}: DiscoverPoolsClientProps) {
  const [pools, setPools] = useState(initialData.pools);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [currentPage, setCurrentPage] = useState(initialData.currentPage);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PublicPoolSortOption>("most-members");
  const [minBracketsPerUser, setMinBracketsPerUser] = useState("");
  const [maxBracketsPerUser, setMaxBracketsPerUser] = useState("");
  const [minParticipants, setMinParticipants] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [isSearching, startSearchTransition] = useTransition();
  const [isJoining, startJoinTransition] = useTransition();
  const [joinPoolId, setJoinPoolId] = useState<string | null>(null);
  const [joinPoolName, setJoinPoolName] = useState("");

  function doSearch(page = 1, sortOverride?: PublicPoolSortOption) {
    startSearchTransition(async () => {
      const result = await searchPublicPools({
        search: search || undefined,
        minBracketsPerUser: minBracketsPerUser
          ? Number(minBracketsPerUser)
          : undefined,
        maxBracketsPerUser: maxBracketsPerUser
          ? Number(maxBracketsPerUser)
          : undefined,
        minParticipants: minParticipants ? Number(minParticipants) : undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        sort: sortOverride ?? sort,
        page,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setPools(result.pools);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
    });
  }

  const hasFilters =
    !!minBracketsPerUser ||
    !!maxBracketsPerUser ||
    !!minParticipants ||
    !!maxParticipants ||
    sort !== "most-members";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(1);
  }

  function handleClearSearch() {
    setSearch("");
    startSearchTransition(async () => {
      const result = await searchPublicPools({
        minBracketsPerUser: minBracketsPerUser
          ? Number(minBracketsPerUser)
          : undefined,
        maxBracketsPerUser: maxBracketsPerUser
          ? Number(maxBracketsPerUser)
          : undefined,
        minParticipants: minParticipants ? Number(minParticipants) : undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        sort,
        page: 1,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setPools(result.pools);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
    });
  }

  function handleResetFilters() {
    setMinBracketsPerUser("");
    setMaxBracketsPerUser("");
    setMinParticipants("");
    setMaxParticipants("");
    setSort("most-members");
    startSearchTransition(async () => {
      const result = await searchPublicPools({
        search: search || undefined,
        sort: "most-members",
        page: 1,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setPools(result.pools);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
    });
  }

  function handleSortChange(value: PublicPoolSortOption) {
    setSort(value);
    doSearch(1, value);
  }

  function handleJoinClick(poolId: string, poolName: string) {
    setJoinPoolId(poolId);
    setJoinPoolName(poolName);
  }

  function handleJoinConfirm() {
    if (!joinPoolId) return;
    const poolId = joinPoolId;
    setJoinPoolId(null);

    startJoinTransition(async () => {
      const result = await joinPublicPoolAction(poolId);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {tournamentStarted && (
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          The tournament has started. Joining pools is no longer available.
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search pools by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </button>
            )}
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Brackets Per User
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Min"
                value={minBracketsPerUser}
                onChange={(e) => setMinBracketsPerUser(e.target.value)}
                className="w-20"
                min={1}
                max={10}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxBracketsPerUser}
                onChange={(e) => setMaxBracketsPerUser(e.target.value)}
                className="w-20"
                min={1}
                max={10}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Max Participants
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Min"
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
                className="w-20"
                min={2}
                max={100}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-20"
                min={2}
                max={100}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sort By</label>
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              disabled={isSearching}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </form>

      {pools.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No public pools found matching your criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pools.map((pool) => (
            <Card key={pool.id} className="flex flex-col overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pool.imageUrl || "/bracket.webp"}
                alt={pool.name}
                className="h-32 w-full object-cover"
              />
              <CardHeader>
                <CardTitle className="text-lg">{pool.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Members</span>
                    <span>
                      {pool.memberCount} / {pool.maxParticipants}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Spots</span>
                    <span>{pool.availableSpots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brackets Per User</span>
                    <span>{pool.maxBracketsPerUser}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scoring</span>
                    <span className="text-right">
                      {pool.scoringRound64}/{pool.scoringRound32}/
                      {pool.scoringSweet16}/{pool.scoringElite8}/
                      {pool.scoringFinalFour}/{pool.scoringChampionship}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {pool.isMember ? (
                  <Button className="w-full" variant="outline" disabled>
                    Already Joined
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleJoinClick(pool.id, pool.name)}
                    disabled={isJoining || tournamentStarted}
                  >
                    Join Pool
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isSearching}
            onClick={() => doSearch(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isSearching}
            onClick={() => doSearch(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <AlertDialog
        open={joinPoolId !== null}
        onOpenChange={(open) => {
          if (!open) setJoinPoolId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join Pool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to join &quot;{joinPoolName}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleJoinConfirm}>
              Join
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
