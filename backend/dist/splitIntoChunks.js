"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitIntoChunks = splitIntoChunks;
function splitIntoChunks(Text, chunkSize = 500, overlap = 50) {
    const words = Text.split(" ");
    const chunks = [];
    let i = 0;
    while (i < words.length) {
        const chunk = words.slice(i, i + chunkSize).join(" ");
        chunks.push(chunk);
        i += chunkSize - overlap;
    }
    return chunks;
}
//# sourceMappingURL=splitIntoChunks.js.map