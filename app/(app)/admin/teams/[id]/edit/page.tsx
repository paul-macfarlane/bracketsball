import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
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
      <PageBreadcrumbs
        crumbs={[
          { label: "Teams", href: "/admin/teams" },
          { label: `Edit ${team.name}` },
        ]}
        className="mb-4"
      />
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
              mascot: team.mascot ?? "",
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
