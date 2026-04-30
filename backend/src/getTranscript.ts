import { YoutubeTranscript } from "youtube-transcript";

export async function getTranscript(url: string) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        console.log("Transcript fetched successfully");
        console.log(transcript);
        return String(transcript);
    } catch (error) {
        console.log("Error fetching transcript");
        console.log(error);
        return null;
    }
}