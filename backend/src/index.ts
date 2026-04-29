import "dotenv/config";
import express from "express";
import { addContentSchema, signinSchema, signupSchema } from "./types";
import { prisma } from "db";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MiddleWhere } from "./MiddleWhere";
import { GetEmbeddings } from "./Embeddings";
import { GetPdfText } from "./pdfToText";
import { UrlToText } from "./UrlToText";
import { getTranscript } from "./getTranscript";
import { success } from "zod";

const app = express();

app.use(express.json());
app.use(cors());



app.post("/signup", async (req, res) => {
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

    return res.status(200).json({
      message: "User created successfully",
      username: user.username,
      id: user.id,
      success: true
    });

  } catch (e) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false
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


app.post("/api/content", MiddleWhere, async (req, res) => {
  const userId = res.locals.userId;

  const Response = addContentSchema.safeParse(req.body);

  if (!Response.success) {
    return res.status(411).json({
      message: "Invalid Input",
      success: false
    })
  }

  const type = req.body.type;
  const title = req.body.title;
  const source_url = req.body.source_url;
  const file_path = req.body.file_path;
  const metadata = req.body.metadata;

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

    if (!memory.source_url || !memory.file_path || !metadata?.content) {
      return res.status(402).json({
        message: "Falied to Create Content",
        success: false
      })
    }


    let text: string | null;

    if (memory.type === "url") text = await UrlToText(memory.source_url);
    // if (memory.type === "youtube") text = await getTranscript(memory.source_url);
    // if (memory.type === "tweet") text = await fetchTweet(memory.source_url);
    // if (memory.type === "pdf") text = await GetPdfText(memory.file_path);
    // if (memory.type === "note") text = memory.metadata.content;
    // if (memory.type === "image") text = await runOCR(memory.file_path);

    // const Embeddings = await GetEmbeddings(text);
    // console.log(Embeddings);


  } catch (error) {

  }

})

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});