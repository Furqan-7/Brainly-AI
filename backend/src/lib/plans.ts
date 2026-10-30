import { prisma } from "db";

export interface PlanLimits {
    name: "free" | "premium";
    maxMemories: number;
    chatsPerDay: number;
    maxUploadMb: number;
}

export const PLANS: Record<"free" | "premium", PlanLimits> = {
    free: { name: "free", maxMemories: 200, chatsPerDay: 30, maxUploadMb: 10 },
    premium: { name: "premium", maxMemories: 5000, chatsPerDay: 500, maxUploadMb: 25 },
};

export function planFor(isPremium: boolean): PlanLimits {
    return isPremium ? PLANS.premium : PLANS.free;
}

export function todayKey(date = new Date()): string {
    return date.toISOString().slice(0, 10);
}

export async function getUsage(userId: number) {
    const [user, memoryCount, usage] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } }),
        prisma.memories.count({ where: { userId } }),
        prisma.userUsage.findUnique({ where: { userId_day: { userId, day: todayKey() } } }),
    ]);
    const plan = planFor(Boolean(user?.isPremium));
    return { plan, memoryCount, chatsToday: usage?.chat_count ?? 0 };
}

export async function canAddMemories(userId: number, count = 1): Promise<{ ok: boolean; message?: string }> {
    const { plan, memoryCount } = await getUsage(userId);
    if (memoryCount + count > plan.maxMemories) {
        return { ok: false, message: `Your ${plan.name} plan allows ${plan.maxMemories} memories. Upgrade to premium for more.` };
    }
    return { ok: true };
}

/** Checks the daily AI chat quota and, if allowed, counts this call. */
export async function consumeChat(userId: number): Promise<{ ok: boolean; message?: string }> {
    const { plan, chatsToday } = await getUsage(userId);
    if (chatsToday >= plan.chatsPerDay) {
        return { ok: false, message: `You've used all ${plan.chatsPerDay} AI answers for today on the ${plan.name} plan.` };
    }
    await prisma.userUsage.upsert({
        where: { userId_day: { userId, day: todayKey() } },
        update: { chat_count: { increment: 1 } },
        create: { userId, day: todayKey(), chat_count: 1 },
    });
    return { ok: true };
}
