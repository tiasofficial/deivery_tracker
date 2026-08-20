"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Single shared client instance prevents connection exhaustion
exports.prisma = new client_1.PrismaClient({
    log: ['error', 'warn'],
});
