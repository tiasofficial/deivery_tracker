"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return (0, response_1.sendError)(res, 'Unauthorized - No token provided', 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded || !decoded.id) {
            return (0, response_1.sendError)(res, 'Unauthorized - Invalid token payload', 401);
        }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            vendorId: decoded.vendorId
        };
        next();
    }
    catch (error) {
        console.error('Auth verification error:', error?.message);
        return (0, response_1.sendError)(res, 'Unauthorized - Invalid token', 401);
    }
};
exports.authenticate = authenticate;
