-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('pdf', 'url', 'youtube', 'tweet', 'note', 'image');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'processing', 'ready', 'failed');

-- CreateTable
CREATE TABLE "Memories" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "source_url" TEXT,
    "file_path" TEXT,
    "status" "Status" NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chunks" (
    "id" SERIAL NOT NULL,
    "MemoryId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chunks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Memories" ADD CONSTRAINT "Memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chunks" ADD CONSTRAINT "Chunks_MemoryId_fkey" FOREIGN KEY ("MemoryId") REFERENCES "Memories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
