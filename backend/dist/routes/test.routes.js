"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.patch('/', (req, res) => {
    res.json({ body: req.body });
});
exports.default = router;
