// Applies pending Prisma migrations during a deploy's build (e.g. Render's `pnpm build`), so the
// database always matches the code. Without this, new tables and columns never reach production
// and every request that touches them fails with a 500.
//
// Skipped when DATABASE_URL is not set (CI and local builds without a database). A failure is
// reported loudly but does not fail the build, so a database problem never blocks a deploy.
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
    console.log("[migrate] DATABASE_URL is not set; skipping migrations.");
    process.exit(0);
}

const result = spawnSync("prisma", ["migrate", "deploy"], { stdio: "inherit", shell: process.platform === "win32" });
if (result.status !== 0) {
    console.error("\n[migrate] WARNING: `prisma migrate deploy` failed. The API will run against an out-of-date database.");
    console.error("[migrate] Fix the error above, then redeploy or run: pnpm --filter db exec prisma migrate deploy\n");
}
process.exit(0);
