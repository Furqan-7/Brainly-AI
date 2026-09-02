export function stripThinkingTags(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}