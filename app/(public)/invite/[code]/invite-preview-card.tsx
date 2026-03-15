import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InvitePreviewCardProps {
  code: string;
  poolName: string;
  poolImageUrl: string | null;
  role: "leader" | "member";
  inviterName: string;
}

export function InvitePreviewCard({
  code,
  poolName,
  poolImageUrl,
  role,
  inviterName,
}: InvitePreviewCardProps) {
  const callbackUrl = encodeURIComponent(`/invite/${code}?autoJoin=true`);

  return (
    <Card className="overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poolImageUrl || "/bracket.webp"}
        alt={poolName}
        className="h-32 w-full object-cover"
      />
      <CardHeader className="text-center">
        <CardTitle>You&apos;ve been invited!</CardTitle>
        <CardDescription>
          <span className="font-semibold">{inviterName}</span> invited you to
          join <span className="font-semibold">{poolName}</span> as a{" "}
          <Badge variant={role === "leader" ? "default" : "secondary"}>
            {role}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" asChild>
          <Link href={`/login?callbackUrl=${callbackUrl}`}>
            Sign in to Join
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
