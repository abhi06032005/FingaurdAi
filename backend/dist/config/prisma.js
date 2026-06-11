"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const adapter_neon_1 = require("@prisma/adapter-neon");
const client_1 = require("@prisma/client");
// Load environment variables
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
console.log("[Prisma Config] Loaded DATABASE_URL:", connectionString ? `${connectionString.substring(0, 20)}...` : "undefined");
if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment variables");
}
const adapter = new adapter_neon_1.PrismaNeon({ connectionString });
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
