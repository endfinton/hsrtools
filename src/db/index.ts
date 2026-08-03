import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error("Missing Turso environment variables: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured.");
}

const client = createClient({
  url: databaseUrl,
  authToken,
});

export const db = drizzle({ client, schema });
