import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";

import * as schema from "./schema";

function createDb() {
  if (process.env.VERCEL) {
    return drizzleNeon({ connection: process.env.DATABASE_URL!, schema });
  }
  return drizzlePg({ connection: process.env.DATABASE_URL!, schema });
}

export const db = createDb();

/**
 * Type that works for both `db` and transaction `tx` objects.
 * Uses the base PgDatabase type which both NodePgDatabase and PgTransaction extend.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbClient = PgDatabase<any, typeof schema>;
