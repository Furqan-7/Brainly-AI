// ─────────────────────────────────────────────────────────────
// Shared memory types — single source of truth
// ─────────────────────────────────────────────────────────────

export type MemoryType =
    | "youtube"
    | "pdf"
    | "tweet"
    | "url"
    | "note"
    | "image"
    | "reel";

export interface Memory {
    id: number;
    userId: number;
    type: MemoryType;
    title: string;
    source_url: string | null;
    file_path: string | null;
    note: string | null;
    status: "pending" | "processing" | "ready" | "failed";
    metadata: any;
    createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Chat / AI types
// ─────────────────────────────────────────────────────────────

export interface Source {
    memoryId: number;
    title: string;
    type: string;
    source_url: string | null;
    file_path: string | null;
    thumbnail: string | null;
    combined_score: string;
}

export interface AIResponse {
    success: boolean;
    message?: string;
    answer: string;
    sources: Source[];
}
