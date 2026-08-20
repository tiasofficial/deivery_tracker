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
exports.completeTrip = exports.startTrip = exports.deleteTrip = exports.updateTrip = exports.getTripById = exports.createTrip = exports.getTrips = void 0;
const tripService = __importStar(require("../services/trip.service"));
const response_1 = require("../utils/response");
const getTrips = async (req, res, next) => {
    try {
        const trips = await tripService.getTrips(req.user.id, req.user.role);
        return (0, response_1.sendSuccess)(res, trips, 'Trips fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getTrips = getTrips;
const createTrip = async (req, res, next) => {
    try {
        const trip = await tripService.createTrip(req.user.id, req.body);
        return (0, response_1.sendSuccess)(res, trip, 'Trip created', 201);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.createTrip = createTrip;
const getTripById = async (req, res, next) => {
    try {
        const trip = await tripService.getTripById(req.params.id, req.user.id, req.user.role);
        return (0, response_1.sendSuccess)(res, trip, 'Trip fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getTripById = getTripById;
const updateTrip = async (req, res, next) => {
    try {
        const trip = await tripService.updateTrip(req.params.id, req.user.id, req.body);
        return (0, response_1.sendSuccess)(res, trip, 'Trip updated');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.updateTrip = updateTrip;
const deleteTrip = async (req, res, next) => {
    try {
        await tripService.deleteTrip(req.params.id, req.user.id);
        return (0, response_1.sendSuccess)(res, null, 'Trip deleted');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.deleteTrip = deleteTrip;
const startTrip = async (req, res, next) => {
    try {
        const trip = await tripService.updateTripStatus(req.params.id, req.user.id, 'IN_PROGRESS');
        return (0, response_1.sendSuccess)(res, trip, 'Trip started');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.startTrip = startTrip;
const completeTrip = async (req, res, next) => {
    try {
        const { transportFee } = req.body;
        const fee = transportFee !== undefined ? Number(transportFee) : undefined;
        const trip = await tripService.updateTripStatus(req.params.id, req.user.id, 'COMPLETED', fee);
        return (0, response_1.sendSuccess)(res, trip, 'Trip completed');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.completeTrip = completeTrip;
