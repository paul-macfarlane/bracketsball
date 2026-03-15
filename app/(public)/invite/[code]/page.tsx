import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  getPoolInviteByCode,
  redeemPoolInvite,
} from "@/lib/db/queries/pool-invites";
import {
  getPoolMemberCount,
  hasTournamentStarted,
} from "@/lib/db/queries/pools";
import { InviteAcceptCard } from "./invite-accept-card";
import { InvitePreviewCard } from "./invite-preview-card";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ autoJoin?: string }>;
}) {
  const { code } = await params;
  const { autoJoin } = await searchParams;

  const invite = await getPoolInviteByCode(code);

  if (!invite) {
    return (
      <div className="mx-auto max-w-md py-12">
        <ErrorCard
          title="Invalid Invite"
          message="This invite link is not valid or has been deleted."
        />
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="mx-auto max-w-md py-12">
        <ErrorCard
          title="Invite Expired"
          message="This invite link has expired. Please ask for a new one."
        />
      </div>
    );
  }

  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    return (
      <div className="mx-auto max-w-md py-12">
        <ErrorCard
          title="Invite Exhausted"
          message="This invite link has reached its maximum number of uses."
        />
      </div>
    );
  }

  const tournamentStarted = await hasTournamentStarted();
  if (tournamentStarted) {
    return (
      <div className="mx-auto max-w-md py-12">
        <ErrorCard
          title="Tournament Started"
          message="Pools cannot be joined after the tournament has started."
        />
      </div>
    );
  }

  const memberCount = await getPoolMemberCount(invite.poolId);
  if (memberCount >= invite.poolMaxParticipants) {
    return (
      <div className="mx-auto max-w-md py-12">
        <ErrorCard
          title="Pool Full"
          message="This pool has reached its maximum number of participants."
        />
      </div>
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Unauthed: show preview card with sign-in CTA
  if (!session) {
    return (
      <div className="mx-auto max-w-md py-12">
        <InvitePreviewCard
          code={code}
          poolName={invite.poolName}
          poolImageUrl={invite.poolImageUrl}
          role={invite.role}
          inviterName={invite.inviterName}
        />
      </div>
    );
  }

  // Authed + autoJoin: redeem invite server-side and redirect
  if (autoJoin === "true") {
    const result = await redeemPoolInvite(code, session.user.id);

    if (result.success) {
      redirect(`/pools/${result.poolId}`);
    }

    // Already a member — just redirect to the pool
    if (result.error === "You are already a member of this pool.") {
      redirect(`/pools/${invite.poolId}`);
    }

    // Other errors: show on page
    return (
      <div className="mx-auto max-w-md py-12">
        <ErrorCard title="Could Not Join" message={result.error} />
      </div>
    );
  }

  // Authed + no autoJoin: show manual accept card
  return (
    <div className="mx-auto max-w-md py-12">
      <InviteAcceptCard
        code={code}
        poolName={invite.poolName}
        poolImageUrl={invite.poolImageUrl}
        role={invite.role}
      />
    </div>
  );
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border p-6 text-center">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
