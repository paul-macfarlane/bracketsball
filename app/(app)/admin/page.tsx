import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/teams">
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                Manage NCAA teams — names, abbreviations, and logos.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/tournaments">
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>Tournaments</CardTitle>
              <CardDescription>
                Manage tournaments, assign teams, and update game results.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
