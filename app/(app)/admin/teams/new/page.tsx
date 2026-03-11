import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { TeamForm } from "../team-form";
import { createTeamAction } from "../actions";

export default function NewTeamPage() {
  async function handleSubmit(values: Parameters<typeof createTeamAction>[0]) {
    "use server";
    return createTeamAction(values);
  }

  return (
    <div>
      <PageBreadcrumbs
        crumbs={[
          { label: "Teams", href: "/admin/teams" },
          { label: "New Team" },
        ]}
        className="mb-4"
      />
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
