import dotenv from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

console.log("[Prisma Config] Loaded DATABASE_URL:", connectionString ? `${connectionString.substring(0, 20)}...` : "undefined");

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const adapter = new PrismaNeon({ connectionString });

const prisma = new PrismaClient({ adapter });

export default prisma;

