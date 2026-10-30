import { prisma } from "db";
import { processMemory } from "./processMemory";
import { log } from "./lib/logger";

/**
 * A small Postgres-backed job queue: memories with status "pending" are the jobs.
 * No Redis needed — `FOR UPDATE SKIP LOCKED` lets several server instances share the queue
 * safely, and failed jobs are retried with exponential backoff before being marked "failed".
 */

export const MAX_ATTEMPTS = 3;
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 2);
const POLL_MS = 2000;
const STALE_MINUTES = 10;

let running = 0;
let timer: NodeJS.Timeout | null = null;

export function backoffMs(attempts: number): number {
    return 30_000 * 2 ** Math.max(0, attempts - 1); // 30s, 60s, 120s…
}

async function claimJob(): Promise<any | null> {
    const rows = await prisma.$queryRaw<any[]>`
        UPDATE "Memories"
        SET status = 'processing', attempts = attempts + 1, "updatedAt" = now()
        WHERE id = (
            SELECT id FROM "Memories"
            WHERE status = 'pending' AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= now())
            ORDER BY id
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING *
    `;
    return rows[0] ?? null;
}

async function runJob(memory: any) {
    const start = Date.now();
    try {
        await processMemory(memory);
        log("info", "memory processed", { memoryId: memory.id, type: memory.type, ms: Date.now() - start });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const giveUp = memory.attempts >= MAX_ATTEMPTS;
        log(giveUp ? "error" : "warn", "memory processing failed", { memoryId: memory.id, attempt: memory.attempts, error: message });
        await prisma.memories.update({
            where: { id: memory.id },
            data: giveUp
                ? { status: "failed", error: message.slice(0, 500), nextAttemptAt: null }
                : { status: "pending", error: message.slice(0, 500), nextAttemptAt: new Date(Date.now() + backoffMs(memory.attempts)) },
        });
    }
}

async function tick() {
    while (running < CONCURRENCY) {
        let job: any;
        try {
            job = await claimJob();
        } catch (error) {
            log("error", "worker poll failed", { error: String(error) });
            return;
        }
        if (!job) return;
        running++;
        runJob(job).finally(() => {
            running--;
            // Pick up the next job right away instead of waiting for the poll
            void tick();
        });
    }
}

/** Jobs left "processing" by a crashed or restarted server go back into the queue. */
async function recoverStaleJobs() {
    const count = await prisma.$executeRaw`
        UPDATE "Memories" SET status = 'pending'
        WHERE status = 'processing' AND "updatedAt" < now() - make_interval(mins => ${STALE_MINUTES})
    `;
    if (count) log("warn", "requeued stale jobs", { count });
}

export function startWorker() {
    if (timer || process.env.DISABLE_WORKER === "true") return;
    const recover = () => recoverStaleJobs().catch((e) => log("error", "stale job recovery failed", { error: String(e) }));
    void recover();
    setInterval(recover, 60_000).unref();
    timer = setInterval(() => void tick(), POLL_MS);
    void tick();
    log("info", "worker started", { concurrency: CONCURRENCY });
}

/** Called after enqueueing so new memories start processing without waiting for the poll. */
export function wakeWorker() {
    void tick();
}
