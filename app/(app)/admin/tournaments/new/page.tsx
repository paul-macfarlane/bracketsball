import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentForm } from "./tournament-form";

export default function NewTournamentPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/tournaments"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Tournaments
      </Link>
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
