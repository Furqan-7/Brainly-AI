"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)({ path: (0, path_1.resolve)(__dirname, "../.env") });
const express_1 = __importDefault(require("express"));
const types_1 = require("./types");
const db_1 = require("db");
const cors_1 = __importDefault(require("cors"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const MiddleWhere_1 = require("./MiddleWhere");
const processMemory_1 = require("./processMemory");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const multer_1 = __importDefault(require("multer"));
const path_2 = __importDefault(require("path"));
const getYoutubeThumbnail_1 = require("./getYoutubeThumbnail");
const Embeddings_1 = require("./Embeddings");
const GetLLMResponse_1 = require("./GetLLMResponse");
const storage = multer_1.default.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_2.default.extname(file.originalname));
    }
});
const uploads = (0, multer_1.default)({ storage });
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 100,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);
app.post("/signup", async (req, res) => {
    console.log("Reached Signup");
    const Response = types_1.signupSchema.safeParse(req.body);
    if (!Response.success) {
        return res.status(411).json({
            message: "Invalid input",
            success: false
        });
    }
    ;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const HashedPassword = await bcrypt_1.default.hash(password, 10);
    try {
        // Make a db call here 
        const UserExist = await db_1.prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (UserExist) {
            return res.status(400).json({
                message: "User already exists with this email"
            });
        }
        const user = await db_1.prisma.user.create({
            data: {
                username,
                email,
                password: HashedPassword
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id, username: user.username
        }, process.env.JWT_TOKEN, {
            expiresIn: "7d"
        });
        return res.status(200).json({
            message: "User created successfully",
            username: user.username,
            token: token,
            id: user.id,
            success: true
        });
    }
    catch (e) {
        console.error("[SIGNUP ERROR]", e?.message ?? e);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
            error: e?.message ?? String(e),
            hello: "hi"
        });
    }
});
app.post("/signin", async (require, res) => {
    const Response = types_1.signinSchema.safeParse(require.body);
    if (!Response.success) {
        return res.status(411).json({
            message: "Invalid Format",
            success: false
        });
    }
    ;
    try {
        const email = require.body.email;
        const password = require.body.password;
        const user = await db_1.prisma.user.findUnique({
            where: {
                email
            }
        });
        if (!user) {
            return res.status(400).json({
                message: "Invalid user",
                success: false
            });
        }
        ;
        const hashedPassword = user.password;
        const isPasswordCorrect = bcrypt_1.default.compareSync(password, hashedPassword);
        if (!isPasswordCorrect) {
            return res.status(402).json({
                message: "Incorrect Password",
                success: false
            });
        }
        ;
        const token = jsonwebtoken_1.default.sign({
            userId: user.id, username: user.username
        }, process.env.JWT_TOKEN, {
            expiresIn: "7d"
        });
        return res.status(200).json({
            message: "User logged in successfully",
            success: true,
            username: user.username,
            id: user.id,
            token
        });
    }
    catch (e) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});
app.post("/api/content", MiddleWhere_1.MiddleWhere, uploads.single("file"), async (req, res) => {
    const userId = res.locals.userId;
    console.log(req.body);
    if (req.body.type == "pdf") {
        if (!req.file) {
            return res.status(400).json({ error: "PDF file is required", success: false });
        }
        req.body.file_path = req.file.path;
    }
    const Response = types_1.addContentSchema.safeParse(req.body);
    if (!Response.success) {
        console.log("ZOD ERROR:", Response.error.format());
        return res.status(411).json({
            message: "Invalid Input",
            success: false
        });
    }
    const { type, title, source_url, file_path, metadata } = Response.data;
    let thumbnail = null;
    if (type === "youtube" && source_url) {
        thumbnail = (0, getYoutubeThumbnail_1.getYoutubeThumbnail)(source_url);
        console.log(thumbnail);
    }
    try {
        const memory = await db_1.prisma.memories.create({
            data: {
                userId,
                type,
                title,
                source_url,
                file_path,
                metadata: {
                    thumbnail_url: thumbnail
                }
            }
        });
        res.status(201).json({ message: "Content saved, processing...", success: true, id: memory.id });
        (0, processMemory_1.processMemory)(memory).catch(console.error).then(() => {
            console.log("Memory processed successfully");
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});
app.post("/api/chat", MiddleWhere_1.MiddleWhere, async (req, res) => {
    console.log("Reached api/chat with question : " + req.body.question);
    const Response = types_1.ChatSchema.safeParse(req.body);
    if (!Response.success) {
        return res.status(411).json({
            message: "Invalid Input",
            success: false
        });
    }
    const question = Response.data.question;
    const userId = res.locals.userId;
    try {
        // Step 1 — Embed the question
        const Embedings = await (0, Embeddings_1.GetEmbeddings)(question);
        // Step 2 — Vector search: find top 5 most similar chunks for this user
        const similarChunks = await db_1.prisma.$queryRaw `
      SELECT 
        c.id,
        c."MemoryId",
        c.content,
        c.chunk_index,
        m.title,
        m.type,
        m.source_url,
        1 - (c.embedding <=> ${JSON.stringify(Embedings)}::vector) AS similarity
      FROM "Chunks" c
      JOIN "Memories" m ON c."MemoryId" = m.id
      WHERE m."userId" = ${userId}
        AND m.status = 'ready'
      ORDER BY c.embedding <=> ${JSON.stringify(Embedings)}::vector
      LIMIT 5
    `;
        if (!similarChunks || similarChunks.length === 0) {
            return res.status(200).json({
                message: "No relevant memories found",
                success: true,
                answer: "I couldn't find anything relevant in your knowledge base. Try saving some content first.",
                sources: []
            });
        }
        // Step 3 — Build context from the top chunks
        const context = similarChunks
            .map((chunk, i) => `[Source ${i + 1} - ${chunk.type.toUpperCase()}: "${chunk.title}"]\n${chunk.content}`)
            .join("\n\n---\n\n");
        // Step 4 — Build sources list for the response
        const sources = similarChunks.map(chunk => ({
            memoryId: chunk.MemoryId,
            title: chunk.title,
            type: chunk.type,
            source_url: chunk.source_url,
            similarity: Number(chunk.similarity).toFixed(2)
        }));
        // Step 5 — Call Ollama LLM with context + question
        const prompt = `You are Brainly AI, a personal knowledge assistant.
You have access to the user's saved content below. Answer the user's question using ONLY the provided context.
If the answer is not in the context, say: "I couldn't find that in your saved content."
Never make up information. Always be concise and accurate.

CONTEXT FROM USER'S KNOWLEDGE BASE:
${context}

USER QUESTION: ${question}

ANSWER:`;
        const llmResponse = await (0, GetLLMResponse_1.GetLLMResponse)(prompt);
        const answer = llmResponse;
        // Step 6 — Return answer + sources
        return res.status(200).json({
            message: "Chat response generated",
            success: true,
            answer,
            sources
        });
    }
    catch (error) {
        console.log("Chat Error " + error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});
app.get("/api/content", MiddleWhere_1.MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    try {
        const Memories = await db_1.prisma.memories.findMany({
            where: {
                userId: userId,
                status: "ready"
            },
            orderBy: {
                createdAt: "desc"
            },
        });
        return res.status(200).json({
            message: "Memories fetched successfully",
            success: true,
            memories: Memories
        });
    }
    catch (error) {
        console.error("[GET /api/content] Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});
app.get("/api/content/url", MiddleWhere_1.MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    try {
        const UrlMemories = await db_1.prisma.memories.findMany({
            where: {
                userId: userId,
                type: "url",
                status: "ready"
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return res.status(200).json({
            message: "Url Memories fetched successfully",
            success: true,
            memories: UrlMemories
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});
app.get("/api/content/youtube", MiddleWhere_1.MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    try {
        const YoutubeMemories = await db_1.prisma.memories.findMany({
            where: {
                userId: userId,
                type: "youtube",
                status: "ready"
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return res.status(200).json({
            message: "Youtube Memories fetched successfully",
            success: true,
            memories: YoutubeMemories
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});
app.get("/api/content/tweet", MiddleWhere_1.MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    try {
        const TweetMemories = await db_1.prisma.memories.findMany({
            where: {
                userId: userId,
                type: "tweet",
                status: "ready"
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return res.status(200).json({
            message: "Tweet Memories fetched successfully",
            success: true,
            memories: TweetMemories
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});
app.get("/api/content/document", MiddleWhere_1.MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    try {
        const DocumentMemories = await db_1.prisma.memories.findMany({
            where: {
                userId: userId,
                type: "pdf",
                status: "ready"
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return res.status(200).json({
            message: "Document Memories fetched successfully",
            success: true,
            memories: DocumentMemories
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});
app.get("/api/content/note", MiddleWhere_1.MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    try {
        const NoteMemories = await db_1.prisma.memories.findMany({
            where: {
                userId: userId,
                type: "note",
                status: "ready"
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return res.status(200).json({
            message: "Note Memories fetched successfully",
            success: true,
            memories: NoteMemories
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});
app.listen(3001, () => {
    console.log("Server is running on port 3001");
});
//# sourceMappingURL=index.js.map