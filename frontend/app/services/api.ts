/**
 * services/api.ts
 *
 * All backend API calls live here — one place to update if the API changes.
 * Components never call axios directly; they use these service functions.
 *
 * Auth is an httpOnly cookie set by the backend, so every request is sent
 * with credentials and no token is ever stored in JavaScript.
 */

import axios from "axios";
import type {
    ChatMessage, Collection, ConversationSummary, GraphEdge, GraphNode, Me, Memory, MemoryQuery,
    PublicMemory, RediscoverItem, SearchFilters, Source,
} from "../types/memory";

/**
 * Same-origin path that next.config.ts proxies to the API. Keeping API calls on this site's
 * own domain makes the session cookie first-party, so browsers don't block it.
 */
export const API_BASE = "/backend";

export const api = axios.create({ baseURL: API_BASE, withCredentials: true });

/** Returns true if the Axios error means the session is missing or expired. */
export function isAuthError(err: unknown): boolean {
    return axios.isAxiosError(err) && err.response?.status === 401;
}

/** The server's error message, if it sent one. */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
    if (axios.isAxiosError(err)) return err.response?.data?.message ?? fallback;
    return fallback;
}

/** Link to an uploaded file (PDF, image, audio) — the server checks ownership. */
export function fileUrl(memoryId: number): string {
    return `${API_BASE}/api/files/${memoryId}`;
}

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

export async function signin(email: string, password: string) {
    return (await api.post("/signin", { email, password })).data;
}

export async function signup(username: string, email: string, password: string) {
    return (await api.post("/signup", { username, email, password })).data;
}

export async function logout(): Promise<void> {
    await api.post("/logout");
}

export async function getMe(): Promise<Me> {
    return (await api.get("/api/me")).data;
}

export async function getExtensionToken(): Promise<string> {
    return (await api.post("/api/extension-token")).data.token;
}

// ─────────────────────────────────────────────────────────────
// Memories
// ─────────────────────────────────────────────────────────────

export async function getMemories(
    query: MemoryQuery = {},
    cursor?: number | null
): Promise<{ memories: Memory[]; nextCursor: number | null }> {
    const res = await api.get("/api/content", {
        params: {
            view: query.view,
            types: query.types?.join(","),
            q: query.q || undefined,
            tag: query.tag || undefined,
            collectionId: query.collectionId,
            cursor: cursor ?? undefined,
        },
    });
    return { memories: res.data.memories ?? [], nextCursor: res.data.nextCursor ?? null };
}

export async function getMemoryStatuses(ids: number[]): Promise<Memory[]> {
    if (ids.length === 0) return [];
    return (await api.get("/api/content/status", { params: { ids: ids.join(",") } })).data.memories;
}

/** Add a new memory (supports both JSON and FormData payloads). */
export async function addMemory(payload: FormData | Record<string, unknown>): Promise<{ id: number; type: string }> {
    return (await api.post("/api/content", payload)).data;
}

export async function importFiles(files: File[], collectionId?: number): Promise<number> {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    if (collectionId) form.append("collectionId", String(collectionId));
    return (await api.post("/api/import", form)).data.count;
}

export async function updateMemory(
    id: number,
    patch: Partial<{ title: string; note: string; context: string; tags: string[]; starred: boolean; archived: boolean }>
): Promise<Memory> {
    return (await api.patch(`/api/content/${id}`, patch)).data.memory;
}

/** Delete a memory by id. */
export async function deleteMemory(memoryId: number): Promise<void> {
    await api.delete(`/api/content/${memoryId}`);
}

export async function retryMemory(id: number): Promise<void> {
    await api.post(`/api/content/${id}/retry`);
}

export async function reviewMemory(id: number, remembered: boolean): Promise<void> {
    await api.post(`/api/content/${id}/review`, { remembered });
}

export async function getTags(): Promise<{ tag: string; count: number }[]> {
    return (await api.get("/api/tags")).data.tags;
}

export async function getDuplicates(): Promise<{ key: string; memories: Pick<Memory, "id" | "title" | "type" | "source_url" | "createdAt">[] }[]> {
    return (await api.get("/api/content/duplicates")).data.groups;
}

export async function mergeMemories(keepId: number, removeIds: number[]): Promise<void> {
    await api.post("/api/content/merge", { keepId, removeIds });
}

// ─────────────────────────────────────────────────────────────
// Collections
// ─────────────────────────────────────────────────────────────

export async function getCollections(): Promise<Collection[]> {
    return (await api.get("/api/collections")).data.collections;
}

export async function createCollection(name: string, description?: string): Promise<Collection> {
    return (await api.post("/api/collections", { name, description })).data.collection;
}

export async function updateCollection(id: number, patch: { name?: string; description?: string | null }): Promise<void> {
    await api.patch(`/api/collections/${id}`, patch);
}

export async function deleteCollection(id: number): Promise<void> {
    await api.delete(`/api/collections/${id}`);
}

export async function addToCollection(collectionId: number, memoryIds: number[]): Promise<void> {
    await api.post(`/api/collections/${collectionId}/memories`, { memoryIds });
}

export async function removeFromCollection(collectionId: number, memoryId: number): Promise<void> {
    await api.delete(`/api/collections/${collectionId}/memories/${memoryId}`);
}

export async function shareCollection(id: number): Promise<string> {
    return (await api.post(`/api/collections/${id}/share`)).data.shareSlug;
}

export async function unshareCollection(id: number): Promise<void> {
    await api.delete(`/api/collections/${id}/share`);
}

export async function getPublicCollection(slug: string): Promise<{
    name: string; description: string | null; owner: string; memories: PublicMemory[];
}> {
    return (await axios.get(`${API_BASE}/api/public/collections/${slug}`)).data.collection;
}

// ─────────────────────────────────────────────────────────────
// Search, chat & conversations
// ─────────────────────────────────────────────────────────────

/** Plain search: ranked memories, no AI answer. */
export async function searchMemories(q: string, filters: SearchFilters = {}): Promise<Source[]> {
    const res = await api.get("/api/search", {
        params: { q, types: filters.types?.join(","), from: filters.from, to: filters.to, collectionId: filters.collectionId },
    });
    return res.data.results;
}

export interface StreamHandlers {
    onMeta?: (meta: { conversationId: number; sources: Source[]; searchQuestion: string }) => void;
    onToken?: (text: string) => void;
    /** `title` is the new chat's short name, sent with the first answer */
    onDone?: (done: { messageId: number; answer: string; title?: string }) => void;
}

/**
 * Asks the AI and streams the answer over Server-Sent Events.
 * Throws an Error with the server's message for non-2xx responses (e.g. quota reached).
 */
export async function streamChat(
    question: string,
    opts: { conversationId?: number | null; filters?: SearchFilters; signal?: AbortSignal },
    handlers: StreamHandlers
): Promise<void> {
    const res = await fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversationId: opts.conversationId ?? undefined, filters: opts.filters ?? {} }),
        signal: opts.signal,
    });

    if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        const error = new Error(body.message ?? "Failed to generate AI response.") as Error & { status?: number };
        error.status = res.status;
        throw error;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (; ;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by a blank line
        let sep;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const event = raw.match(/^event: (.*)$/m)?.[1];
            const data = raw.match(/^data: (.*)$/m)?.[1];
            if (!event || !data) continue;
            const payload = JSON.parse(data);
            if (event === "meta") handlers.onMeta?.(payload);
            else if (event === "token") handlers.onToken?.(payload.text);
            else if (event === "done") handlers.onDone?.(payload);
            else if (event === "error") throw new Error(payload.message);
        }
    }
}

export async function getConversations(): Promise<ConversationSummary[]> {
    return (await api.get("/api/conversations")).data.conversations;
}

export async function getConversation(id: number): Promise<{ id: number; title: string; messages: ChatMessage[] }> {
    const conversation = (await api.get(`/api/conversations/${id}`)).data.conversation;
    return {
        ...conversation,
        messages: conversation.messages.map((m: ChatMessage & { sources: Source[] | null }) => ({
            id: m.id, role: m.role, content: m.content, sources: m.sources ?? undefined,
        })),
    };
}

export async function deleteConversation(id: number): Promise<void> {
    await api.delete(`/api/conversations/${id}`);
}

// ─────────────────────────────────────────────────────────────
// Insights
// ─────────────────────────────────────────────────────────────

export async function getGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const res = await api.get("/api/graph");
    return { nodes: res.data.nodes, edges: res.data.edges };
}

export async function getRediscover(): Promise<{ due: RediscoverItem[]; throwback: RediscoverItem | null }> {
    const res = await api.get("/api/rediscover");
    return { due: res.data.due, throwback: res.data.throwback };
}
