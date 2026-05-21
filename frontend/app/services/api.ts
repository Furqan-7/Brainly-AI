/**
 * services/api.ts
 *
 * All backend API calls live here — one place to update if the API changes.
 * Components never call axios directly; they use these service functions.
 */

import axios from "axios";
import type { AIResponse, Memory } from "../types/memory";

const BASE = process.env.NEXT_PUBLIC_API;

function authHeaders() {
    return { token: localStorage.getItem("token") };
}

// ─────────────────────────────────────────────────────────────
// Memories
// ─────────────────────────────────────────────────────────────

/** Fetch all ready memories for the authenticated user. */
export async function getMemories(): Promise<Memory[]> {
    const res = await axios.get(`${BASE}/api/content`, {
        headers: authHeaders(),
    });
    return (
        res.data.memories ??
        res.data.data?.memories ??
        []
    );
}

/** Add a new memory (supports both JSON and FormData payloads). */
export async function addMemory(
    payload: FormData | Record<string, unknown>
): Promise<void> {
    await axios.post(`${BASE}/api/content`, payload, {
        headers: authHeaders(),
    });
}

/** Delete a memory by id. */
export async function deleteMemory(memoryId: number): Promise<void> {
    await axios.delete(`${BASE}/api/content/delete`, {
        headers: authHeaders(),
        data: { memoryId },
    });
}

// ─────────────────────────────────────────────────────────────
// Chat / AI
// ─────────────────────────────────────────────────────────────

/** Send a question to the AI and return the structured response. */
export async function chatWithBrain(
    question: string,
    token: string
): Promise<AIResponse> {
    const res = await axios.post(
        `${BASE}/api/chat`,
        { question },
        { headers: { token } }
    );
    return res.data as AIResponse;
}
