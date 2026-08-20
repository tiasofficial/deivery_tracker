"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
let url = process.env.DATABASE_URL || env_1.env.databaseUrl;
if (url && !url.includes('connection_limit')) {
    url = url.includes('?') ? `${url}&connection_limit=5` : `${url}?connection_limit=5`;
}
if (url && !url.includes('pool_timeout')) {
    url = `${url}&pool_timeout=30`;
}
// Single shared client instance prevents connection exhaustion
exports.prisma = new client_1.PrismaClient({
    log: ['error', 'warn'],
    datasources: {
        db: {
            url,
        },
    },
});
