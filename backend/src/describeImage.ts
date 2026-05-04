import axios from "axios";
import fs from "fs";


export async function describeImage(file_path: string): Promise<string> {
    const imageBase64 = fs.readFileSync(file_path).toString("base64");

    try {

        const response = await axios.post("http://localhost:11434/api/generate", {
            model: "llava",
            prompt: "Describe this image in detail. Extract any text you can see. What is this image about?",
            images: [imageBase64],
            stream: false,
        });

        return response.data.response;
    } catch (error) {
        console.log("error in describeImage" + error);
        return "";
    }


}