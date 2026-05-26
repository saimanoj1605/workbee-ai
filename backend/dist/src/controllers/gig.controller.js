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
exports.verifyWork = exports.updateWorkerPhase = exports.emergencyDispatch = exports.updateApplication = exports.applyToGig = exports.getGigs = exports.createGig = void 0;
const gigService = __importStar(require("../services/gig.service"));
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
exports.createGig = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const gig = await gigService.createGig(req.userId, req.body);
    (0, response_1.sendSuccess)(res, gig, 201, "Gig created");
});
exports.getGigs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await gigService.listGigs(req.query);
    (0, response_1.sendSuccess)(res, result);
});
exports.applyToGig = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const application = await gigService.applyToGig(req.userId, String(req.params.gigId), req.body);
    (0, response_1.sendSuccess)(res, application, 201, "Application submitted");
});
exports.updateApplication = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const application = await gigService.updateApplicationStatus(req.userId, String(req.params.gigId), String(req.params.applicationId), req.body);
    (0, response_1.sendSuccess)(res, application, 200, "Application updated");
});
exports.emergencyDispatch = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await gigService.emergencyDispatch(req.userId, String(req.params.gigId), req.body);
    (0, response_1.sendSuccess)(res, result, 200, "Emergency dispatch sent");
});
exports.updateWorkerPhase = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await gigService.updateWorkerPhase(req.userId, String(req.params.gigId), String(req.params.applicationId), req.body);
    (0, response_1.sendSuccess)(res, result, 200, "Worker phase updated");
});
exports.verifyWork = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await gigService.verifyWork(req.userId, String(req.params.gigId), String(req.params.applicationId), req.body);
    (0, response_1.sendSuccess)(res, result, 200, "Work verified");
});
