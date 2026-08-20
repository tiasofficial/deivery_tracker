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
exports.skipStop = exports.collectAtStop = exports.deliverAtStop = exports.arriveAtStop = void 0;
const stopService = __importStar(require("../services/stop.service"));
const response_1 = require("../utils/response");
const arriveAtStop = async (req, res, next) => {
    try {
        const stop = await stopService.updateStopStatus(req.params.tripId, req.params.stopId, req.user.id, 'ARRIVED');
        return (0, response_1.sendSuccess)(res, stop, 'Arrived at stop');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.arriveAtStop = arriveAtStop;
const deliverAtStop = async (req, res, next) => {
    try {
        const stop = await stopService.updateStopStatus(req.params.tripId, req.params.stopId, req.user.id, 'DELIVERED');
        return (0, response_1.sendSuccess)(res, stop, 'Delivered at stop');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.deliverAtStop = deliverAtStop;
const collectAtStop = async (req, res, next) => {
    try {
        const stop = await stopService.collectAtStop(req.params.tripId, req.params.stopId, req.user.id, req.body.amount);
        return (0, response_1.sendSuccess)(res, stop, 'Collected at stop');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.collectAtStop = collectAtStop;
const skipStop = async (req, res, next) => {
    try {
        const stop = await stopService.skipStop(req.params.tripId, req.params.stopId, req.user.id, req.body.reason);
        return (0, response_1.sendSuccess)(res, stop, 'Skipped stop');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.skipStop = skipStop;
