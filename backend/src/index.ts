import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env") });

import express from "express";
import { addContentSchema, ChatSchema, signinSchema, signupSchema } from "./types";
import { prisma } from "db";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MiddleWhere } from "./MiddleWhere";
import { processMemory } from "./processMemory";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import { getYoutubeThumbnail } from "./getYoutubeThumbnail";
import { GetEmbeddings } from "./Embeddings";
import axios from "axios";
import { GetLLMResponse } from "./GetLLMResponse";

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploads = multer({ storage });

const app = express();

app.use(express.json());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 100,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})

app.use(limiter);

app.post("/signup", async (req, res) => {
  console.log("Reached Signup");
  const Response = signupSchema.safeParse(req.body);

  if (!Response.success) {
    return res.status(411).json({
      message: "Invalid input",
      success: false
    })
  };

  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  const HashedPassword = await bcrypt.hash(password, 10);

  try {

    // Make a db call here 
    const UserExist = await prisma.user.findUnique({
      where: {
        email: email
      }
    });


    if (UserExist) {
      return res.status(400).json({
        message: "User already exists with this email"
      });
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: HashedPassword
      }
    });

    const token = jwt.sign({
      userId: user.id, username: user.username
    }, process.env.JWT_TOKEN as string, {
      expiresIn: "7d"
    });

    return res.status(200).json({
      message: "User created successfully",
      username: user.username,
      token: token,
      id: user.id,
      success: true
    });

  } catch (e: any) {
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
  const Response = signinSchema.safeParse(require.body);
  if (!Response.success) {
    return res.status(411).json({
      message: "Invalid Format",
      success: false
    })
  };

  try {

    const email = require.body.email;
    const password = require.body.password;

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid user",
        success: false
      })
    };

    const hashedPassword = user.password;
    const isPasswordCorrect = bcrypt.compareSync(password, hashedPassword);

    if (!isPasswordCorrect) {
      return res.status(402).json({
        message: "Incorrect Password",
        success: false
      })
    };

    const token = jwt.sign({
      userId: user.id, username: user.username
    }, process.env.JWT_TOKEN as string, {
      expiresIn: "7d"
    });

    return res.status(200).json({
      message: "User logged in successfully",
      success: true,
      username: user.username,
      id: user.id,
      token
    });

  } catch (e) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    });
  }
});


app.post("/api/content", MiddleWhere, uploads.single("file"), async (req, res) => {
  const userId = res.locals.userId;
  console.log(req.body);
  if (req.body.type == "pdf") {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required", success: false });
    }
    req.body.file_path = req.file.path;
  }


  const Response = addContentSchema.safeParse(req.body);

  if (!Response.success) {
    console.log("ZOD ERROR:", Response.error.format());
    return res.status(411).json({
      message: "Invalid Input",
      success: false
    })
  }

  const { type, title, source_url, file_path, note, metadata } = Response.data;

  let thumbnail = null;

  if (type === "youtube" && source_url) {
    thumbnail = getYoutubeThumbnail(source_url);
    console.log(thumbnail);
  }

  try {
    const memory = await prisma.memories.create({
      data: {
        userId,
        type,
        title,
        source_url,
        file_path,
        note,
        metadata: {
          thumbnail_url: thumbnail
        }
      }
    });

    res.status(201).json({ message: "Content saved, processing...", success: true, id: memory.id });

    processMemory(memory).catch(console.error).then(() => {
      console.log("Memory processed successfully");
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    });
  }
});

app.post("/api/chat", MiddleWhere, async (req, res) => {

  console.log("Reached api/chat with question : " + req.body.question);

  const Response = ChatSchema.safeParse(req.body);

  if (!Response.success) {
    return res.status(411).json({
      message: "Invalid Input",
      success: false
    })
  }

  const question = Response.data.question;
  const userId = res.locals.userId;

  try {
    // Step 1 — Embed the question
    const Embedings = await GetEmbeddings(question);

    // Step 2 — Vector search: fetch top 10 chunks, then deduplicate to 1 per memory
    const similarChunks = await prisma.$queryRaw<{
      id: number;
      MemoryId: number;
      content: string;
      chunk_index: number;
      similarity: number;
      title: string;
      type: string;
      source_url: string | null;
    }[]>`
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
      LIMIT 10
    `;

    if (!similarChunks || similarChunks.length === 0) {
      return res.status(200).json({
        message: "No relevant memories found",
        success: true,
        answer: "I couldn't find anything relevant in your knowledge base. Try saving some content first.",
        sources: []
      });
    }

    // Step 3 — Deduplicate by memoryId, keeping the highest-similarity chunk per memory
    const seenMemoryIds = new Set<number>();
    const topChunks = similarChunks.filter(chunk => {
      if (seenMemoryIds.has(chunk.MemoryId)) return false;
      seenMemoryIds.add(chunk.MemoryId);
      return true;
    });

    // Step 4 — Build context from the deduplicated top chunks
    const context = topChunks
      .map((chunk, i) => `[Source ${i + 1} - ${chunk.type.toUpperCase()}: "${chunk.title}"]\n${chunk.content}`)
      .join("\n\n---\n\n");

    // Step 5 — Build sources list for the response (one entry per memory)
    const sources = topChunks.map(chunk => ({
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

    const llmResponse = await GetLLMResponse(prompt);

    const answer = llmResponse;


    // Step 6 — Return answer + sources
    return res.status(200).json({
      message: "Chat response generated",
      success: true,
      answer,
      sources
    });






  } catch (error) {
    console.log("Chat Error " + error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    })
  }



});


app.get("/api/content", MiddleWhere, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const Memories = await prisma.memories.findMany({
      where: {
        userId: userId,
        status: "ready"
      },
      orderBy: {
        createdAt: "desc"
      },
    })

    return res.status(200).json({
      message: "Memories fetched successfully",
      success: true,
      memories: Memories
    })
  } catch (error) {
    console.error("[GET /api/content] Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    })
  }
});

app.get("/api/content/url", MiddleWhere, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const UrlMemories = await prisma.memories.findMany({
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
    })
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    })
  }
});


app.get("/api/content/youtube", MiddleWhere, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const YoutubeMemories = await prisma.memories.findMany({
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
    })
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    })
  }
});

app.get("/api/content/tweet", MiddleWhere, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const TweetMemories = await prisma.memories.findMany({
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
    })
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    })
  }
});

app.get("/api/content/document", MiddleWhere, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const DocumentMemories = await prisma.memories.findMany({
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
    })
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    })
  }
});

app.get("/api/content/note", MiddleWhere, async (req, res) => {
  const userId = res.locals.userId;

  try {
    const NoteMemories = await prisma.memories.findMany({
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
    })
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
    })
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});