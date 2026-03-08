import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamById } from "@/lib/db/queries/teams";
import { TeamForm } from "../../team-form";
import { updateTeamAction } from "../../actions";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getTeamById(id);

  if (!team) {
    notFound();
  }

  async function handleSubmit(values: Parameters<typeof updateTeamAction>[1]) {
    "use server";
    return updateTeamAction(id, values);
  }

  return (
    <div>
      <Link
        href="/admin/teams"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Teams
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Edit {team.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamForm
            defaultValues={{
              name: team.name,
              shortName: team.shortName,
              abbreviation: team.abbreviation,
              logoUrl: team.logoUrl ?? "",
              espnId: team.espnId ?? "",
            }}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
