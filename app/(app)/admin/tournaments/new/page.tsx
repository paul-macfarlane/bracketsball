import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { TournamentForm } from "./tournament-form";

export default function NewTournamentPage() {
  return (
    <div>
      <PageBreadcrumbs
        crumbs={[
          { label: "Tournaments", href: "/admin/tournaments" },
          { label: "New Tournament" },
        ]}
        className="mb-4"
      />
      <Card>
        <CardHeader>
          <CardTitle>Create Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentForm />
        </CardContent>
      </Card>
    </div>
  );
}
