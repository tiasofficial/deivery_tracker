"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBoxType = exports.updateBoxType = exports.createBoxType = exports.getBoxTypes = void 0;
const boxtypeService = __importStar(require("../services/boxtype.service"));
const response_1 = require("../utils/response");
const getBoxTypes = async (req, res, next) => {
    try {
        const types = await boxtypeService.getBoxTypes(req.user.id);
        return (0, response_1.sendSuccess)(res, types, 'Box types fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getBoxTypes = getBoxTypes;
const createBoxType = async (req, res, next) => {
    try {
        const type = await boxtypeService.createBoxType(req.user.id, req.body);
        return (0, response_1.sendSuccess)(res, type, 'Box type created', 201);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.createBoxType = createBoxType;
const updateBoxType = async (req, res, next) => {
    try {
        const type = await boxtypeService.updateBoxType(req.params.id, req.user.id, req.body);
        return (0, response_1.sendSuccess)(res, type, 'Box type updated');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.updateBoxType = updateBoxType;
const deleteBoxType = async (req, res, next) => {
    try {
        await boxtypeService.deleteBoxType(req.params.id, req.user.id);
        return (0, response_1.sendSuccess)(res, null, 'Box type deleted');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.deleteBoxType = deleteBoxType;
