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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tripController = __importStar(require("../controllers/trip.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const stop_routes_1 = __importDefault(require("./stop.routes"));
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_middleware_1.authenticate);
router.get('/', tripController.getTrips);
router.post('/', (0, role_middleware_1.requireRole)(['VENDOR']), tripController.createTrip);
router.get('/:id', tripController.getTripById);
router.patch('/:id', (0, role_middleware_1.requireRole)(['VENDOR']), tripController.updateTrip);
router.delete('/:id', (0, role_middleware_1.requireRole)(['VENDOR']), tripController.deleteTrip);
router.patch('/:id/start', (0, role_middleware_1.requireRole)(['DRIVER']), tripController.startTrip);
router.patch('/:id/complete', (0, role_middleware_1.requireRole)(['DRIVER']), tripController.completeTrip);
// Mount stop routes under trips
router.use('/:tripId/stops', stop_routes_1.default);
exports.default = router;
