import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env") });

import express from "express";
import { addContentSchema, signinSchema, signupSchema } from "./types";
import { prisma } from "db";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MiddleWhere } from "./MiddleWhere";
import { processMemory } from "./processMemory";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";

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
    console.log("Failed here ");

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

    return res.status(200).json({
      message: "User created successfully",
      username: user.username,
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

  const { type, title, source_url, file_path, metadata } = Response.data;

  try {
    const memory = await prisma.memories.create({
      data: {
        userId,
        type,
        title,
        source_url,
        file_path,
        metadata
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