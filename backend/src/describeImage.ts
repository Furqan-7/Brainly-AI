import axios from "axios";
import fs from "fs";
import { config } from "dotenv";
config();


export async function describeImage(file_path: string): Promise<string> {
    const imageBase64 = fs.readFileSync(file_path).toString("base64");

    try {

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: "Describe this image in detail and extract all visible text."
                            },
                            {
                                inline_data: {
                                    mime_type: "image/png",
                                    data: imageBase64
                                }
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.log("Error in describeImage" + error);
        return "";
    }
}