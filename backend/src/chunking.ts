export interface Chunk {
    text: string;
    metadata?: Record<string, any>;
}

export const ATOMIC_WORD_THRESHOLD = 150; // tune this

function splitIntoSentences(text: string): string[] {
    return text
        .split(/(?<=[.?!])\s+(?=[A-Z0-9"'])/g)
        .map(s => s.trim())
        .filter(Boolean);
}

export function splitIntoChunks(
    text: string,
    chunkSize: number = 500,
    overlap: number = 50,
    metadata?: Record<string, any>
): Chunk[] {
    const paragraphs = text
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

    const chunks: Chunk[] = [];
    let current: string[] = [];
    let currentWordCount = 0;

    const pushCurrent = () => {
        if (current.length > 0) {
            chunks.push({ text: current.join(" "), metadata });
        }
    };

    for (const para of paragraphs) {
        const sentences = splitIntoSentences(para);

        for (const sentence of sentences) {
            const sentenceWordCount = sentence.split(/\s+/).length;

            if (sentenceWordCount > chunkSize) {
                pushCurrent();
                current = [];
                currentWordCount = 0;

                const words = sentence.split(/\s+/);
                let i = 0;
                while (i < words.length) {
                    chunks.push({
                        text: words.slice(i, i + chunkSize).join(" "),
                        metadata,
                    });
                    i += chunkSize - overlap;
                }
                continue;
            }

            if (currentWordCount + sentenceWordCount > chunkSize) {
                pushCurrent();
                const overlapWords = current.join(" ").split(/\s+/).slice(-overlap);
                current = [...overlapWords];
                currentWordCount = overlapWords.length;
            }

            current.push(sentence);
            currentWordCount += sentenceWordCount;
        }
    }

    pushCurrent();
    return chunks;
}

export function chunkMemory(
    text: string,
    granularity: "long_form" | "atomic",
    metadata?: Record<string, any>
): Chunk[] {
    if (!text.trim()) return [];

    if (granularity === "atomic") {
        return [{ text: text.trim(), metadata }];
    }
    return splitIntoChunks(text, 500, 50, metadata);
}