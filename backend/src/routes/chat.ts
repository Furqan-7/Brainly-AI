import { Router, Response } from "express";
import { prisma } from "db";
import { MiddleWhere } from "../MiddleWhere";
import { ChatSchema, parseTypes, searchSchema } from "../types";
import { consumeChat } from "../lib/plans";
import { groq, ANSWER_MODEL, streamAnswer } from "../lib/llm";
import { log } from "../lib/logger";
import { displayTitle, fallbackTitle, generateTitle } from "../lib/chatTitle";
import { stripThinkingTags } from "../stripThinkingTags";
import { applyVectorCutoff, dedupeByMemory } from "../Retrieval";
import { buildAnswerMessages, ChatTurn, retrieveContext, searchWithFallback, standaloneQuestion, toSources } from "../rag";

export const chatRouter: Router = Router();

const NOT_FOUND_ANSWER = "I couldn't find anything relevant in your knowledge base. Try saving some content first, or rephrase your question.";

async function loadConversation(userId: number, conversationId: number | undefined, question: string) {
    if (conversationId) {
        const existing = await prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            include: { messages: { orderBy: { id: "desc" }, take: 6 } },
        });
        if (existing) {
            const history: ChatTurn[] = existing.messages.reverse().map((m) => ({ role: m.role as ChatTurn["role"], content: m.content }));
            return { conversation: existing, history, titling: null };
        }
    }
    // A short title right away; the AI title (started here, in parallel with the answer) replaces it
    const conversation = await prisma.conversation.create({
        data: { userId, title: fallbackTitle(question) },
    });
    return { conversation, history: [] as ChatTurn[], titling: nameChat(conversation.id, question, conversation.title) };
}

/** Gives a new chat a short AI title (2–5 words) and saves it. Never throws. */
async function nameChat(conversationId: number, question: string, current: string): Promise<string> {
    try {
        const title = await generateTitle(question);
        if (title !== current) await prisma.conversation.update({ where: { id: conversationId }, data: { title } });
        return title;
    } catch (error) {
        log("warn", "chat title failed", { error: String(error) });
        return current;
    }
}

async function saveTurn(conversationId: number, question: string, answer: string, sources: unknown) {
    const [, assistant] = await prisma.$transaction([
        prisma.message.create({ data: { conversationId, role: "user", content: question } }),
        prisma.message.create({ data: { conversationId, role: "assistant", content: answer, sources: sources as any } }),
        prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    ]);
    return assistant.id;
}

function sendEvent(res: Response, event: string, data: unknown) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Streams the answer as Server-Sent Events: `meta` (sources) → `token`* → `done`. */
chatRouter.post("/api/chat/stream", MiddleWhere, async (req, res) => {
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(411).json({ message: parsed.error.issues[0]?.message ?? "Invalid Input", success: false });
    }
    const { question, conversationId, filters } = parsed.data;
    const userId = res.locals.userId;

    const quota = await consumeChat(userId);
    if (!quota.ok) return res.status(429).json({ message: quota.message, success: false, upgrade: true });

    let aborted = false;
    res.on("close", () => { aborted = true; });

    try {
        const start = Date.now();
        const { conversation, history, titling } = await loadConversation(userId, conversationId, question);
        const searchQuestion = await standaloneQuestion(question, history);
        const { chunks, sources, filters: applied } = await retrieveContext(userId, searchQuestion, filters as any);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();

        sendEvent(res, "meta", { conversationId: conversation.id, sources, filters: applied, searchQuestion });

        let answer = "";
        if (chunks.length === 0) {
            answer = NOT_FOUND_ANSWER;
            sendEvent(res, "token", { text: answer });
        } else {
            for await (const delta of streamAnswer(buildAnswerMessages(question, chunks, history))) {
                if (aborted) break;
                answer += delta;
                sendEvent(res, "token", { text: delta });
            }
        }

        answer = stripThinkingTags(answer).trim() || NOT_FOUND_ANSWER;
        const messageId = await saveTurn(conversation.id, question, answer, sources);
        const title = titling ? await titling : undefined;
        log("info", "chat answered", { userId, ms: Date.now() - start, sources: sources.length, streamed: true });
        if (!aborted) {
            sendEvent(res, "done", { messageId, answer, title });
            res.end();
        }
    } catch (error) {
        log("error", "chat stream failed", { error: String(error) });
        if (!res.headersSent) return res.status(500).json({ message: "Internal Server Error", success: false });
        sendEvent(res, "error", { message: "Failed to generate a response" });
        res.end();
    }
});

/** Non-streaming variant (used by the browser extension and simple API clients). */
chatRouter.post("/api/chat", MiddleWhere, async (req, res) => {
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(411).json({ message: parsed.error.issues[0]?.message ?? "Invalid Input", success: false });
    }
    const { question, conversationId, filters } = parsed.data;
    const userId = res.locals.userId;

    const quota = await consumeChat(userId);
    if (!quota.ok) return res.status(429).json({ message: quota.message, success: false, upgrade: true });

    try {
        const { conversation, history, titling } = await loadConversation(userId, conversationId, question);
        const searchQuestion = await standaloneQuestion(question, history);
        const { chunks, sources } = await retrieveContext(userId, searchQuestion, filters as any);

        let answer = NOT_FOUND_ANSWER;
        if (chunks.length > 0) {
            const completion = await groq.chat.completions.create({
                model: ANSWER_MODEL,
                messages: buildAnswerMessages(question, chunks, history),
                max_tokens: 700,
                temperature: 0.3,
                reasoning_effort: "none",
            } as any);
            answer = stripThinkingTags(completion.choices[0]?.message?.content ?? "").trim() || NOT_FOUND_ANSWER;
        }
        await saveTurn(conversation.id, question, answer, sources);
        const title = titling ? await titling : conversation.title;
        return res.status(200).json({ message: "Chat response generated", success: true, answer, sources, conversationId: conversation.id, title });
    } catch (error) {
        log("error", "chat failed", { error: String(error) });
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
});

/** Plain semantic + keyword search: returns matching memories, no AI answer, no quota. */
chatRouter.get("/api/search", MiddleWhere, async (req, res) => {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) return res.status(411).json({ message: "Invalid query", success: false });
    const { q, types, from, to, collectionId } = parsed.data;

    try {
        const started = performance.now();
        const { results, filters } = await searchWithFallback(
            res.locals.userId,
            q,
            { types: parseTypes(types), from, to, collectionId },
            undefined,
            40
        );
        const matches = applyVectorCutoff(dedupeByMemory(results)).slice(0, 20);
        log("info", "search", { ms: Math.round(performance.now() - started), results: matches.length });
        return res.status(200).json({ success: true, results: toSources(matches), filters });
    } catch (error) {
        log("error", "search failed", { error: String(error) });
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
});

// ─── Conversation history ────────────────────────────────────────────────────

chatRouter.get("/api/conversations", MiddleWhere, async (req, res) => {
    const conversations = await prisma.conversation.findMany({
        where: { userId: res.locals.userId },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: { id: true, title: true, updatedAt: true },
    });
    // Chats saved before short titles existed have the whole question as their title
    return res.status(200).json({ success: true, conversations: conversations.map((c) => ({ ...c, title: displayTitle(c.title) })) });
});

chatRouter.get("/api/conversations/:id", MiddleWhere, async (req, res) => {
    const conversation = await prisma.conversation.findFirst({
        where: { id: Number(req.params.id) || 0, userId: res.locals.userId },
        include: { messages: { orderBy: { id: "asc" } } },
    });
    if (!conversation) return res.status(404).json({ message: "Conversation not found", success: false });
    return res.status(200).json({ success: true, conversation: { ...conversation, title: displayTitle(conversation.title) } });
});

chatRouter.delete("/api/conversations/:id", MiddleWhere, async (req, res) => {
    const { count } = await prisma.conversation.deleteMany({
        where: { id: Number(req.params.id) || 0, userId: res.locals.userId },
    });
    if (!count) return res.status(404).json({ message: "Conversation not found", success: false });
    return res.status(200).json({ success: true });
});
