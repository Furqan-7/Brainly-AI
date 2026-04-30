/*
  Warnings:

  - Made the column `embedding` on table `Chunks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Chunks" ALTER COLUMN "embedding" SET NOT NULL;
