import { prisma } from "db";

const COHERE_MONTHLY_LIMIT = 1000;
// The monthly count is read from the database at most this often, not on every answer
const REFRESH_MS = 5 * 60 * 1000;

function getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

let known: { month: string; count: number; at: number } | null = null;

export async function canUseCohere(): Promise<boolean> {
    const month = getCurrentMonthKey();
    if (!known || known.month !== month || Date.now() - known.at > REFRESH_MS) {
        const usage = await prisma.apiUsage.findUnique({
            where: { service_month_year: { service: "cohere_rerank", month_year: month } },
        });
        known = { month, count: usage?.call_count ?? 0, at: Date.now() };
    }
    return known.count < COHERE_MONTHLY_LIMIT;
}

export async function incrementCohereUsage(): Promise<void> {
    const month = getCurrentMonthKey();
    if (known?.month === month) known.count += 1;
    try {
        await prisma.apiUsage.upsert({
            where: { service_month_year: { service: "cohere_rerank", month_year: month } },
            update: { call_count: { increment: 1 } },
            create: { service: "cohere_rerank", month_year: month, call_count: 1 },
        });
    } catch {
        // Losing one count is harmless; never fail an answer over bookkeeping
    }
}
