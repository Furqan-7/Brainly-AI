import "dotenv/config";
import express from "express";
import { signinSchema, signupSchema } from "./types";
import { prisma } from "db";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
      userId: user.id
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

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});