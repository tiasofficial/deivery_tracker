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
exports.deleteDriver = exports.updateDriverPassword = exports.updateDriver = exports.getDriverTrips = exports.getDriverById = exports.createDriver = exports.getDrivers = void 0;
const driverService = __importStar(require("../services/driver.service"));
const response_1 = require("../utils/response");
const getDrivers = async (req, res, next) => {
    try {
        const drivers = await driverService.getDrivers(req.user.id);
        return (0, response_1.sendSuccess)(res, drivers, 'Drivers fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getDrivers = getDrivers;
const createDriver = async (req, res, next) => {
    try {
        const driver = await driverService.createDriver(req.user.id, req.body);
        return (0, response_1.sendSuccess)(res, driver, 'Driver created', 201);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.createDriver = createDriver;
const getDriverById = async (req, res, next) => {
    try {
        const driver = await driverService.getDriverById(req.params.id, req.user.id);
        return (0, response_1.sendSuccess)(res, driver, 'Driver fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getDriverById = getDriverById;
const getDriverTrips = async (req, res, next) => {
    try {
        const trips = await driverService.getDriverTrips(req.params.id, req.user.id);
        return (0, response_1.sendSuccess)(res, trips, 'Driver trips fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getDriverTrips = getDriverTrips;
const updateDriver = async (req, res, next) => {
    try {
        const driver = await driverService.updateDriver(req.params.id, req.user.id, req.body);
        return (0, response_1.sendSuccess)(res, driver, 'Driver updated');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.updateDriver = updateDriver;
const updateDriverPassword = async (req, res, next) => {
    try {
        await driverService.updateDriverPassword(req.params.id, req.user.id, req.body.password);
        return (0, response_1.sendSuccess)(res, null, 'Driver password changed');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.updateDriverPassword = updateDriverPassword;
const deleteDriver = async (req, res, next) => {
    try {
        await driverService.deleteDriver(req.params.id, req.user.id);
        return (0, response_1.sendSuccess)(res, null, 'Driver account deleted');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.deleteDriver = deleteDriver;
