import postgres from "postgres";

declare global {
  var __mancanaSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }
  return postgres(connectionString, { ssl: "require", prepare: false });
}

export const sql = globalThis.__mancanaSql ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__mancanaSql = sql;
}
