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
    | "reel"
    | "tiktok"
    | "audio";

export type MemoryStatus = "pending" | "processing" | "ready" | "failed";

export interface CollectionRef {
    id: number;
    name: string;
}

export interface Memory {
    id: number;
    userId: number;
    type: MemoryType;
    title: string;
    source_url: string | null;
    file_path: string | null;
    note: string | null;
    status: MemoryStatus;
    // thumbnail_url, description, context, author, duration, canonical_url…
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any> | null;
    summary: string | null;
    tags: string[];
    starred: boolean;
    archived: boolean;
    error: string | null;
    attempts: number;
    createdAt: string;
    collections?: CollectionRef[];
}

export type MemoryView = "recent" | "starred" | "archived";

export interface MemoryQuery {
    view?: MemoryView;
    types?: MemoryType[];
    q?: string;
    tag?: string;
    collectionId?: number;
}

// ─────────────────────────────────────────────────────────────
// Chat / AI types
// ─────────────────────────────────────────────────────────────

export interface Source {
    /** Citation number used as [n] in the answer */
    n: number;
    memoryId: number;
    title: string;
    type: MemoryType | string;
    source_url: string | null;
    has_file: boolean;
    thumbnail: string | null;
    snippet: string;
    score: number;
}

export interface SearchFilters {
    types?: MemoryType[];
    from?: string;
    to?: string;
    collectionId?: number;
}

export interface ChatMessage {
    id?: number;
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
    streaming?: boolean;
    error?: string;
}

export interface ConversationSummary {
    id: number;
    title: string;
    updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Account, collections, insights
// ─────────────────────────────────────────────────────────────

export interface Plan {
    name: "free" | "premium";
    maxMemories: number;
    chatsPerDay: number;
    maxUploadMb: number;
}

export interface Me {
    user: { id: number; username: string; email: string; isPremium: boolean; createdAt: string };
    plan: Plan;
    usage: { memoryCount: number; chatsToday: number };
}

export interface Collection {
    id: number;
    name: string;
    description: string | null;
    shareSlug: string | null;
    memoryCount: number;
    createdAt: string;
}

export interface PublicMemory {
    id: number;
    title: string;
    type: MemoryType;
    source_url: string | null;
    summary: string | null;
    tags: string[];
    has_file: boolean;
    thumbnail_url: string | null;
    description: string | null;
    createdAt: string;
}

export interface RediscoverItem {
    id: number;
    title: string;
    type: MemoryType;
    source_url: string | null;
    summary: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any> | null;
    tags: string[];
    createdAt: string;
    reviewInterval: number;
    has_file: boolean;
}

export interface GraphNode {
    id: number;
    title: string;
    type: MemoryType;
    tags: string[];
    source_url: string | null;
    starred: boolean;
}

export interface GraphEdge {
    source: number;
    target: number;
    similarity: number;
}
