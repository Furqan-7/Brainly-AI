import { z } from "zod";
import { MEMORY_TYPES } from "./lib/searchFilters";

export const signupSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6),
});

export const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const memoryType = z.enum(MEMORY_TYPES as [string, ...string[]]);

// Accepts ["a","b"] (JSON) or "a, b" (multipart form fields)
const tagList = z
    .union([z.array(z.string()), z.string()])
    .transform((v) => (Array.isArray(v) ? v : v.split(",")))
    .optional();

const optionalId = z.coerce.number().int().positive().optional();

export const addContentSchema = z.object({
    type: memoryType,
    title: z.string().trim().min(1).max(300),
    source_url: z.string().trim().max(2000).optional().nullable(),
    note: z.string().max(200_000).optional().nullable(),
    // The "Personal Context" field; older clients send it as `metadata`
    context: z.string().max(5000).optional().nullable(),
    metadata: z.any().optional(),
    tags: tagList,
    collectionId: optionalId,
    allowDuplicate: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
});

export const updateMemorySchema = z.object({
    title: z.string().trim().min(1).max(300).optional(),
    note: z.string().max(200_000).optional().nullable(),
    context: z.string().max(5000).optional().nullable(),
    tags: tagList,
    starred: z.boolean().optional(),
    archived: z.boolean().optional(),
});

export const listContentSchema = z.object({
    types: z.string().optional(),
    q: z.string().max(200).optional(),
    tag: z.string().max(50).optional(),
    view: z.enum(["recent", "starred", "archived"]).default("recent"),
    collectionId: optionalId,
    cursor: optionalId,
    limit: z.coerce.number().int().min(1).max(100).default(24),
});

export const filtersSchema = z.object({
    types: z.array(memoryType).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    collectionId: optionalId,
}).default({});

export const ChatSchema = z.object({
    question: z.string().trim().min(2, "Question is too short").max(1000, "Question must be at most 1000 characters long"),
    conversationId: optionalId,
    filters: filtersSchema,
});

export const searchSchema = z.object({
    q: z.string().trim().min(1).max(500),
    types: z.string().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    collectionId: optionalId,
});

export const reviewSchema = z.object({ remembered: z.boolean() });

export const mergeSchema = z.object({
    keepId: z.number().int().positive(),
    removeIds: z.array(z.number().int().positive()).min(1).max(50),
});

export const collectionSchema = z.object({
    name: z.string().trim().min(1).max(80),
    description: z.string().max(500).optional().nullable(),
});

export const collectionMemoriesSchema = z.object({
    memoryIds: z.array(z.number().int().positive()).min(1).max(200),
});

/** "reel,youtube" -> ["reel","youtube"], ignoring unknown types */
export function parseTypes(value?: string) {
    if (!value) return undefined;
    const types = value.split(",").map((t) => t.trim()).filter((t) => (MEMORY_TYPES as string[]).includes(t));
    return types.length ? (types as typeof MEMORY_TYPES) : undefined;
}

export type ChatInput = z.infer<typeof ChatSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type AddContentInput = z.infer<typeof addContentSchema>;
