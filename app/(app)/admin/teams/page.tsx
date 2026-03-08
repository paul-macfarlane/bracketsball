import Link from "next/link";

import { getTeams } from "@/lib/db/queries/teams";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteTeamButton } from "./delete-team-button";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const teams = await getTeams(search);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams ({teams.length})</h1>
        <Button asChild>
          <Link href="/admin/teams/new">Add Team</Link>
        </Button>
      </div>

      <div className="mb-4">
        <form>
          <input
            name="search"
            type="text"
            placeholder="Search teams..."
            defaultValue={search}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </form>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Short Name</TableHead>
              <TableHead>Abbr</TableHead>
              <TableHead>ESPN ID</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No teams found.
                </TableCell>
              </TableRow>
            ) : (
              teams.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {t.logoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.logoUrl} alt={t.name} className="h-6 w-6" />
                      )}
                      {t.name}
                    </div>
                  </TableCell>
                  <TableCell>{t.shortName}</TableCell>
                  <TableCell>{t.abbreviation}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.espnId || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/teams/${t.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteTeamButton teamId={t.id} teamName={t.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
