import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env") });

import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import multer from "multer";
import passport from "./config/passport";
import { requestLogger, log } from "./lib/logger";
import { ensureUploadDirs } from "./lib/storage";
import { authRouter } from "./routes/auth";
import { contentRouter } from "./routes/content";
import { chatRouter } from "./routes/chat";
import { collectionsRouter } from "./routes/collections";
import { insightsRouter } from "./routes/insights";
import { startWorker } from "./worker";

export const app: Express = express();

// Number of proxies in front of the API (e.g. 2 for Vercel's /backend proxy + Render's load balancer),
// so rate limiting sees the visitor's IP instead of the proxy's.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));

const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:3000").split(",").map((o) => o.trim());

app.use(requestLogger);
app.use(cors({
    // Cookies need an explicit origin (not "*"). Requests without an Origin (curl, the
    // browser extension's background worker) are allowed and authenticate with a Bearer token.
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin) || origin.startsWith("chrome-extension://")),
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(passport.initialize());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes (was 15 * 60 * 100 = 90 seconds)
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

app.use(authRouter);
app.use(contentRouter);
app.use(chatRouter);
app.use(collectionsRouter);
app.use(insightsRouter);

app.use((req, res) => {
    res.status(404).json({ message: "Not found", success: false });
});

// Errors thrown in async handlers land here (Express 5) — never leak internals to the client
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(status).json({ message: err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 25MB)" : err.message, success: false });
    }
    log("error", "unhandled error", { path: req.originalUrl, error: err instanceof Error ? err.stack : String(err) });
    if (res.headersSent) return;
    res.status(500).json({ message: "Internal Server Error", success: false });
});

if (require.main === module) {
    const port = Number(process.env.PORT ?? 3001);
    ensureUploadDirs()
        .then(() => {
            app.listen(port, () => log("info", `Server is running on port ${port}`));
            startWorker();
        })
        .catch((error) => {
            log("error", "startup failed", { error: String(error) });
            process.exit(1);
        });
}
