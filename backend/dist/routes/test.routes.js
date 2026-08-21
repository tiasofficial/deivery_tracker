"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const router = (0, express_1.Router)();
router.patch('/', (req, res) => {
    res.json({ body: req.body });
});
router.post('/fix-db', async (req, res) => {
    const result = await prisma_1.prisma.trip.updateMany({
        where: { isSettled: true, status: 'COMPLETED' },
        data: { status: 'SETTLED' }
    });
    res.json({ fixed: result.count });
});
exports.default = router;
