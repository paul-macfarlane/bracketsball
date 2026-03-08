import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamForm } from "../team-form";
import { createTeamAction } from "../actions";

export default function NewTeamPage() {
  async function handleSubmit(values: Parameters<typeof createTeamAction>[0]) {
    "use server";
    return createTeamAction(values);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/teams"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Teams
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Add Team</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamForm onSubmit={handleSubmit} submitLabel="Create Team" />
        </CardContent>
      </Card>
    </div>
  );
}
