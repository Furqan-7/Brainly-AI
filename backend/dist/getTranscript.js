"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranscript = getTranscript;
const youtube_transcript_1 = require("youtube-transcript");
async function getTranscript(url) {
    try {
        const transcript = await youtube_transcript_1.YoutubeTranscript.fetchTranscript(url);
        console.log("Transcript fetched successfully");
        let Response = transcript.map((item) => {
            return item.text;
        });
        return Response.join(" ");
    }
    catch (error) {
        console.log("Error fetching transcript");
        console.log(error);
        return "";
    }
}
//# sourceMappingURL=getTranscript.js.map