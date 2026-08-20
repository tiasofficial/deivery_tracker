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
exports.getBoxesAnalytics = exports.getMerchantsAnalytics = exports.getDriversAnalytics = exports.getTripsAnalytics = exports.getCollections = exports.getSummary = void 0;
const analyticsService = __importStar(require("../services/analytics.service"));
const response_1 = require("../utils/response");
const getSummary = async (req, res, next) => {
    try {
        const summary = await analyticsService.getSummary(req.user.id, req.query.period);
        return (0, response_1.sendSuccess)(res, summary, 'Summary fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getSummary = getSummary;
const getCollections = async (req, res, next) => {
    try {
        const collections = await analyticsService.getCollections(req.user.id, req.query.from, req.query.to);
        return (0, response_1.sendSuccess)(res, collections, 'Collections fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getCollections = getCollections;
const getTripsAnalytics = async (req, res, next) => {
    try {
        const trips = await analyticsService.getTripsAnalytics(req.user.id, req.query.from, req.query.to);
        return (0, response_1.sendSuccess)(res, trips, 'Trips analytics fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getTripsAnalytics = getTripsAnalytics;
const getDriversAnalytics = async (req, res, next) => {
    try {
        const drivers = await analyticsService.getDriversAnalytics(req.user.id, req.query.period);
        return (0, response_1.sendSuccess)(res, drivers, 'Drivers analytics fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getDriversAnalytics = getDriversAnalytics;
const getMerchantsAnalytics = async (req, res, next) => {
    try {
        const merchants = await analyticsService.getMerchantsAnalytics(req.user.id, req.query.period);
        return (0, response_1.sendSuccess)(res, merchants, 'Merchants analytics fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getMerchantsAnalytics = getMerchantsAnalytics;
const getBoxesAnalytics = async (req, res, next) => {
    try {
        const boxes = await analyticsService.getBoxesAnalytics(req.user.id, req.query.period);
        return (0, response_1.sendSuccess)(res, boxes, 'Boxes analytics fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getBoxesAnalytics = getBoxesAnalytics;
