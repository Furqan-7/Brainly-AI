import { z } from "zod";

export const signupSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6),
});

export const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const addContentSchema = z.object({
    type: z.enum(["pdf", "url", "youtube", "tweet", "note", "image"]),
    title: z.string().min(1),
    source_url: z.string().url().optional().nullable(),
    file_path: z.string().optional().nullable(),
    status: z.enum(["pending", "processing", "ready", "failed"]).default("pending"),
    metadata: z.any().optional(),
});

export const ChunksSchema = z.object({
    content: z.string(),
    chunk_index: z.number(),
    embedding: z.array(z.number()),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type AddContentInput = z.infer<typeof addContentSchema>;
export type ChunksInput = z.infer<typeof ChunksSchema>;