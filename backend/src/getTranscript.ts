import { YoutubeTranscript } from "youtube-transcript";

export async function getTranscript(url: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    console.log("Transcript fetched successfully");
    let Response = transcript.map((item) => {
      return item.text;
    });
    return Response.join(" ");
  } catch (error) {
    console.log("Error fetching transcript");
    console.log(error);
    return "";
  }
}
