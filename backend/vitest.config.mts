import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        // API clients are constructed at import time; tests never call them
        env: { GROQ_API_KEY: "test", COHERE_API_KEY: "", JWT_TOKEN: "test-secret" },
    },
});
