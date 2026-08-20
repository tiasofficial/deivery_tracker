"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const prisma = new client_1.PrismaClient();
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return (0, response_1.sendError)(res, 'Unauthorized - No token provided', 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, vendorId: true },
        });
        if (!user) {
            return (0, response_1.sendError)(res, 'Unauthorized - Invalid user', 401);
        }
        req.user = user;
        next();
    }
    catch (error) {
        return (0, response_1.sendError)(res, 'Unauthorized - Invalid token', 401);
    }
};
exports.authenticate = authenticate;
