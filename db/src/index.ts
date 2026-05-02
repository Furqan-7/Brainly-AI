import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma";
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
    // PrismaNeon takes a PoolConfig object (connectionString is a valid PoolConfig field)
    const adapter = new PrismaNeon({ connectionString });
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

export { PrismaClient };
