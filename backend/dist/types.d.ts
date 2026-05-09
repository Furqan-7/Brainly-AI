import { z } from "zod";
export declare const signupSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const signinSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const addContentSchema: z.ZodObject<{
    type: z.ZodEnum<{
        pdf: "pdf";
        url: "url";
        youtube: "youtube";
        tweet: "tweet";
        note: "note";
        image: "image";
    }>;
    title: z.ZodString;
    source_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    file_path: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        processing: "processing";
        ready: "ready";
        failed: "failed";
    }>>;
    metadata: z.ZodOptional<z.ZodAny>;
}, z.core.$strip>;
export declare const ChunksSchema: z.ZodObject<{
    content: z.ZodString;
    chunk_index: z.ZodNumber;
    embedding: z.ZodArray<z.ZodNumber>;
}, z.core.$strip>;
export declare const ChatSchema: z.ZodObject<{
    question: z.ZodString;
}, z.core.$strip>;
export type ChatInput = z.infer<typeof ChatSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type AddContentInput = z.infer<typeof addContentSchema>;
export type ChunksInput = z.infer<typeof ChunksSchema>;
//# sourceMappingURL=types.d.ts.map