-- The keyword-search column and the API usage table were in schema.prisma but were never
-- created by a migration (they were added with `db push`), so fresh databases lacked them.
-- Everything here is idempotent, so it is a no-op on databases that already have them.

-- AlterTable
-- A generated column (Postgres doesn't allow column references in DEFAULT); Prisma
-- introspects it as @default(dbgenerated(...)). It fills itself for existing rows.
ALTER TABLE "Chunks" ADD COLUMN IF NOT EXISTS "content_tsv" tsvector
    GENERATED ALWAYS AS (to_tsvector('english'::regconfig, content)) STORED;
ALTER TABLE "Chunks" ALTER COLUMN "embedding" DROP NOT NULL;
-- Older migrations fixed the column at vector(1536), but nomic-embed-text-v1.5 returns 768
-- dimensions and schema.prisma declares an unsized `vector`. No-op if it is already unsized.
ALTER TABLE "Chunks" ALTER COLUMN "embedding" TYPE vector;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApiUsage" (
    "id" SERIAL NOT NULL,
    "service" TEXT NOT NULL,
    "month_year" TEXT NOT NULL,
    "call_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ApiUsage_service_month_year_key" ON "ApiUsage"("service", "month_year");
CREATE INDEX IF NOT EXISTS "chunks_content_tsv_idx" ON "Chunks" USING GIN ("content_tsv");
