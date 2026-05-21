import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function GetHypotheticalAnswer(question: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
You are simulating a personal knowledge base entry that a user might have saved.
Generate a short, realistic note or document snippet that would directly answer:
"${question}"

Write it as if it's content the user themselves saved — like a note, article excerpt, or summary. Be concise and specific.
      `,
    });

    if (!response.text) {
      throw new Error("No text response from Google GenAI");
    }
    return response.text;
  } catch (error) {
    console.error("Error in GetHypotheticalAnswer:", error);
    throw new Error("Failed to get hypothetical answer");
  }
}