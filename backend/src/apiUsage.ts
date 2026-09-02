import { prisma } from "db";

const COHERE_MONTHLY_LIMIT = 1000;

function getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function canUseCohere(): Promise<boolean> {
    const monthYear = getCurrentMonthKey();
    const usage = await prisma.apiUsage.findUnique({
        where: { service_month_year: { service: "cohere_rerank", month_year: monthYear } },
    });
    return (usage?.call_count ?? 0) < COHERE_MONTHLY_LIMIT;
}

export async function incrementCohereUsage(): Promise<void> {
    const monthYear = getCurrentMonthKey();
    await prisma.apiUsage.upsert({
        where: { service_month_year: { service: "cohere_rerank", month_year: monthYear } },
        update: { call_count: { increment: 1 } },
        create: { service: "cohere_rerank", month_year: monthYear, call_count: 1 },
    });
}