
export function splitIntoChunks(Text: string, chunkSize: number = 500, overlap: number = 50) {
    const words = Text.split(" ");
    const chunks: string[] = [];

    let i = 0;

    while (i < words.length) {
        const chunk = words.slice(i, i + chunkSize).join(" ");
        chunks.push(chunk);
        i += chunkSize - overlap;
    }
    return chunks;
} 