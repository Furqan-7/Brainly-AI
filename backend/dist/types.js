"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSchema = exports.ChunksSchema = exports.addContentSchema = exports.signinSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(20),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.signinSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.addContentSchema = zod_1.z.object({
    type: zod_1.z.enum(["pdf", "url", "youtube", "tweet", "note", "image"]),
    title: zod_1.z.string().min(1),
    source_url: zod_1.z.string().optional().nullable(),
    file_path: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(["pending", "processing", "ready", "failed"]).default("pending"),
    metadata: zod_1.z.any().optional(),
});
exports.ChunksSchema = zod_1.z.object({
    content: zod_1.z.string(),
    chunk_index: zod_1.z.number(),
    embedding: zod_1.z.array(zod_1.z.number()),
});
exports.ChatSchema = zod_1.z.object({
    question: zod_1.z.string().min(5, "Question must be at least 5 characters long").max(200, "Question must be at most 200 characters long"),
});
//# sourceMappingURL=types.js.map