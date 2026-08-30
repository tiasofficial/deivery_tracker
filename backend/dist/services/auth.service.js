"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const prisma_1 = require("../config/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
const register = async (data) => {
    const { name, phone, password, role, vehicleNo, vendorCode } = data;
    const email = data.email.trim().toLowerCase();
    const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existingUser)
        throw new Error('Email already in use');
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    let vendorId = null;
    if (role === 'DRIVER') {
        if (!vendorCode)
            throw new Error('Driver must have a vendorCode');
        const vendor = await prisma_1.prisma.user.findFirst({
            where: { OR: [{ id: vendorCode }, { email: vendorCode.trim().toLowerCase() }], role: 'VENDOR' },
        });
        if (!vendor)
            throw new Error('Invalid vendorCode');
        vendorId = vendor.id;
    }
    const user = await prisma_1.prisma.user.create({
        data: { name, email, phone, password: hashedPassword, role, vehicleNo, vendorId },
    });
    const token = (0, jwt_1.generateToken)({ id: user.id, email: user.email, role: user.role, vendorId: user.vendorId });
    return { user: { id: user.id, name, email, role, vendorId: user.vendorId }, token };
};
exports.register = register;
const login = async (data) => {
    console.log('Login data received:', JSON.stringify(data));
    const email = data.email.trim().toLowerCase();
    const { password } = data;
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('User not found in DB for email:', email);
        throw new Error('Invalid credentials');
    }
    const isValid = await bcryptjs_1.default.compare(password, user.password);
    console.log('Password valid comparison result:', isValid);
    if (!isValid)
        throw new Error('Invalid credentials');
    const token = (0, jwt_1.generateToken)({ id: user.id, email: user.email, role: user.role, vendorId: user.vendorId });
    return { user: { id: user.id, name: user.name, email, role: user.role, vendorId: user.vendorId }, token };
};
exports.login = login;
const getMe = async (userId) => {
    return prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, role: true, vehicleNo: true, vendorId: true },
    });
};
exports.getMe = getMe;
