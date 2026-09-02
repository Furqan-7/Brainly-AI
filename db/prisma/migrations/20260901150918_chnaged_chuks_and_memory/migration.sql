-- CreateEnum
CREATE TYPE "Granularity" AS ENUM ('long_form', 'atomic');

-- AlterTable
ALTER TABLE "Chunks" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "token_count" INTEGER;

-- AlterTable
ALTER TABLE "Memories" ADD COLUMN     "granularity" "Granularity" NOT NULL DEFAULT 'long_form';

-- CreateIndex
CREATE INDEX "Chunks_MemoryId_idx" ON "Chunks"("MemoryId");
