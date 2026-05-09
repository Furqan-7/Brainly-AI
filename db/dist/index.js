"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = exports.prisma = void 0;
const serverless_1 = require("@neondatabase/serverless");
const adapter_neon_1 = require("@prisma/adapter-neon");
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_1.PrismaClient; } });
const ws_1 = __importDefault(require("ws"));
// Required for Neon WebSocket connections in Node.js environments
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
let _prisma;
function getPrismaClient() {
    if (!_prisma) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error("DATABASE_URL environment variable is not set!");
        }
        // PrismaNeon takes a PoolConfig object (connectionString is a valid PoolConfig field)
        const adapter = new adapter_neon_1.PrismaNeon({ connectionString });
        _prisma = new client_1.PrismaClient({ adapter });
    }
    return _prisma;
}
// Lazy proxy — PrismaClient is created on first use, ensuring env vars are loaded
exports.prisma = new Proxy({}, {
    get(_target, prop) {
        const client = getPrismaClient();
        const value = client[prop];
        return typeof value === "function" ? value.bind(client) : value;
    },
});
//# sourceMappingURL=index.js.map