import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local");
}

// Reuse the client across hot reloads in development.
const globalForDb = globalThis as unknown as {
  _sql?: ReturnType<typeof postgres>;
};

// `prepare: false` is required for Supabase's transaction-mode pooler (port 6543).
export const sql =
  globalForDb._sql ??
  postgres(connectionString, {
    prepare: false,
    ssl: "require",
    idle_timeout: 20,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._sql = sql;
}
