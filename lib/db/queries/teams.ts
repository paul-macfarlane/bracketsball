import { eq, ilike, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { team } from "@/lib/db/schema";

export async function getTeams(search?: string) {
  const query = db.select().from(team).orderBy(asc(team.name));

  if (search) {
    return query.where(ilike(team.name, `%${search}%`));
  }

  return query;
}

export async function getTeamById(id: string) {
  const [result] = await db.select().from(team).where(eq(team.id, id));
  return result ?? null;
}

export async function createTeam(data: {
  name: string;
  shortName: string;
  abbreviation: string;
  mascot?: string;
  logoUrl?: string;
  espnId?: string;
}) {
  const [result] = await db.insert(team).values(data).returning();
  return result;
}

export async function updateTeam(
  id: string,
  data: {
    name?: string;
    shortName?: string;
    abbreviation?: string;
    mascot?: string | null;
    logoUrl?: string | null;
    espnId?: string | null;
  },
) {
  const [result] = await db
    .update(team)
    .set(data)
    .where(eq(team.id, id))
    .returning();
  return result ?? null;
}

export async function deleteTeam(id: string) {
  await db.delete(team).where(eq(team.id, id));
}
