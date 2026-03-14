import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasTournamentStarted } from "@/lib/db/queries/pools";
import { CreatePoolForm } from "./create-pool-form";

export default async function CreatePoolPage() {
  const tournamentStarted = await hasTournamentStarted();

  return (
    <div className="mx-auto max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Create a Bracket Pool</CardTitle>
          <CardDescription>
            {tournamentStarted
              ? "Pool creation is locked because the tournament has started."
              : "Set up a pool for your friends to compete in. You'll be the pool leader."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournamentStarted ? (
            <p className="text-sm text-muted-foreground">
              New pools cannot be created after the tournament has started.
            </p>
          ) : (
            <CreatePoolForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
