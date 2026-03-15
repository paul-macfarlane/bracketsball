"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { UserPlus, Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserDisplay } from "@/components/user-display";
import {
  searchUsersForInviteAction,
  sendPoolUserInviteAction,
} from "./actions";

interface SearchResult {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

interface InviteUserDialogProps {
  poolId: string;
  onInviteSent: () => void;
}

export function InviteUserDialog({
  poolId,
  onInviteSent,
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [role, setRole] = useState<"member" | "leader">("member");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length === 0) {
        return;
      }

      setSearching(true);
      const result = await searchUsersForInviteAction(poolId, searchQuery);
      setSearching(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setResults(result.users);
    },
    [poolId],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length === 0) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  // Derive displayed results — clear when query is empty
  const displayedResults = query.length === 0 ? [] : results;

  async function handleInvite(userId: string) {
    setSendingId(userId);
    const result = await sendPoolUserInviteAction(poolId, userId, role);
    setSendingId(null);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success("Invite sent");
    setInvitedIds((prev) => new Set(prev).add(userId));
    onInviteSent();
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery("");
      setResults([]);
      setInvitedIds(new Set());
      setRole("member");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Invite User</span>
          <span className="sm:hidden">Invite</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Search for a user by username to invite them to this pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Invite as:</label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "member" | "leader")}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="leader">Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-64 min-h-[100px] overflow-y-auto">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : displayedResults.length > 0 ? (
              <div className="space-y-2">
                {displayedResults.map((user) => {
                  const isInvited = invitedIds.has(user.id);
                  const isSending = sendingId === user.id;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <UserDisplay
                        name={user.name}
                        image={user.image}
                        username={user.username}
                        size="sm"
                      />
                      <Button
                        size="sm"
                        variant={isInvited ? "secondary" : "default"}
                        disabled={isInvited || isSending}
                        onClick={() => handleInvite(user.id)}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isInvited ? (
                          "Invited"
                        ) : (
                          "Invite"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : query.length > 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No users found
              </p>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Start typing to search for users
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
