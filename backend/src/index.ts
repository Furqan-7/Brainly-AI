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


app.post("/signup",async(req,res)=>{
      const Response = signupSchema.safeParse(req.body);

      if(!Response.success){
        return res.status(411).json({
          message:"Invalid input"
        })
      };

      const username = req.body.username;
      const email = req.body.email;
      const password = req.body.password;

      const HashedPassword = await bcrypt.hash(password,10);

      try{

        // Make a db call here 

        const user = await prisma.user.create({
           data:{
            username,
            email,
            password:HashedPassword
           }
        });

        return res.status(200).json({
          message:"User created successfully",
          user
        });
           
      }catch(e){
         return res.status(500).json({
          message:"Internal Server Error"
         });
      }
});


app.post("/signin",async(require,res)=>{
      const Response = signinSchema.safeParse(require.body);
      if(!Response.success){
        return res.status(411).json({
            message:"Invalid Format"
        })
      };

      try{

        const email = require.body.email;
        const password = require.body.password;

        const user = await prisma.user.findUnique({
          where:{
            email
          }
        });

        if(!user){
          return res.status(400).json({
            message:"Invalid user"
          })
        };

        const hashedPassword = user.password;
        const isPasswordCorrect = bcrypt.compareSync(password, hashedPassword);

        if(!isPasswordCorrect){
          return res.status(402).json({
            message:"Incorrect Password"
          })
        };

        const token = jwt.sign({
           id:user.id
        },process.env.JWT_TOKEN as string,{
          expiresIn:"7d"
        });

        return res.status(200).json({
          message:"User logged in successfully",
          token
        });

      }catch(e){
          
      }
});

app.listen(3001,()=>{
  console.log("Server is running on port 3001"); 
});