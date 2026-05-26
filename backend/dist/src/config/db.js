"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const env_1 = require("./env");
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg(env_1.env.DATABASE_URL),
});
exports.default = prisma;
