"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { teamSchema } from "@/lib/validators/team";
import { createTeam, updateTeam, deleteTeam } from "@/lib/db/queries/teams";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || session.user.appRole !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createTeamAction(formData: unknown) {
  await requireAdmin();
  const parsed = teamSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { logoUrl, darkLogoUrl, espnId, mascot, ...rest } = parsed.data;

  await createTeam({
    ...rest,
    mascot: mascot || undefined,
    logoUrl: logoUrl || undefined,
    darkLogoUrl: darkLogoUrl || undefined,
    espnId: espnId || undefined,
  });

  redirect("/admin/teams");
}

export async function updateTeamAction(id: string, formData: unknown) {
  await requireAdmin();
  const parsed = teamSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { logoUrl, darkLogoUrl, espnId, mascot, ...rest } = parsed.data;

  const result = await updateTeam(id, {
    ...rest,
    mascot: mascot || null,
    logoUrl: logoUrl || null,
    darkLogoUrl: darkLogoUrl || null,
    espnId: espnId || null,
  });

  if (!result) {
    return { error: "Team not found" };
  }

  redirect("/admin/teams");
}

export async function deleteTeamAction(id: string) {
  await requireAdmin();
  await deleteTeam(id);
  revalidatePath("/admin/teams");
}
