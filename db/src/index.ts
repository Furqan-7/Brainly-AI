import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";
import ws from "ws";

// Required for Neon WebSocket connections in Node.js environments
neonConfig.webSocketConstructor = ws;

let _prisma: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (!_prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set!");
    }
    // Neon (serverless, over WebSockets) in hosted environments; plain node-postgres for
    // local / Docker Postgres. DB_DRIVER=pg|neon overrides the guess from the URL.
    const driver = process.env.DB_DRIVER ?? (connectionString.includes("neon.tech") ? "neon" : "pg");
    // PrismaNeon takes a PoolConfig object (connectionString is a valid PoolConfig field)
    const adapter = driver === "neon"
      ? new PrismaNeon({ connectionString })
      : new PrismaPg({ connectionString });
    _prisma = new PrismaClient({ adapter });
  }
  return _prisma;
}

// Lazy proxy — PrismaClient is created on first use, ensuring env vars are loaded
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { PrismaClient, Prisma };
