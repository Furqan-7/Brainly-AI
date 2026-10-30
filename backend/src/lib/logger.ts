import { NextFunction, Request, Response } from "express";

type Level = "info" | "warn" | "error";

/** One JSON object per line, so logs can be searched/aggregated by any log platform. */
export function log(level: Level, msg: string, fields: Record<string, unknown> = {}) {
    const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields });
    if (level === "error") console.error(line);
    else console.log(line);
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        log(res.statusCode >= 500 ? "error" : "info", "request", {
            method: req.method,
            path: req.originalUrl.split("?")[0],
            status: res.statusCode,
            ms: Math.round(ms),
            userId: res.locals.userId,
        });
    });
    next();
}
