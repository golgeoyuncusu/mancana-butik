import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  console.error("DATABASE_URL (veya POSTGRES_URL) bulunamadı. .env.local dosyasını kontrol edin.");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });
const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");

try {
  await sql.unsafe(schema);
  console.log("Şema uygulandı.");
} catch (err) {
  console.error("Şema uygulanamadı:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 });
}
