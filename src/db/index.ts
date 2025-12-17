import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres-js client for Drizzle
const client = postgres(connectionString, {
  prepare: false, // Disable prepared statements for Supabase connection pooling
});

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

export type Database = typeof db;
