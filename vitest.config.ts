import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Türkiye saatinde çalışır; testler belirlenimli olsun diye saat dilimi sabitlenir.
process.env.TZ = "Europe/Istanbul";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: { TZ: "Europe/Istanbul" },
  },
});
