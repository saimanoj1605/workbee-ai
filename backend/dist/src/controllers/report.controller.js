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
exports.getReportStats = exports.escalateReport = exports.dismissReport = exports.resolveReport = exports.assignReport = exports.getPendingReports = exports.getAllReports = exports.getReport = exports.getUserReports = exports.createReport = void 0;
const reportService = __importStar(require("../services/report.service"));
const response_1 = require("../utils/response");
const asyncHandler_1 = require("../utils/asyncHandler");
// ============================================
// USER REPORT ACTIONS
// ============================================
exports.createReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await reportService.createReport({
        ...req.body,
        reporterId: req.userId,
    });
    (0, response_1.sendSuccess)(res, result, 201, "Report submitted successfully");
});
exports.getUserReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await reportService.getUserReports(req.userId);
    (0, response_1.sendSuccess)(res, result, 200, "Reports retrieved successfully");
});
exports.getReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    const result = await reportService.getReport(reportId);
    (0, response_1.sendSuccess)(res, result, 200, "Report retrieved successfully");
});
// ============================================
// ADMIN REPORT ACTIONS
// ============================================
exports.getAllReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status, type, limit = 50, offset = 0 } = req.query;
    const result = await reportService.getAllReports(status, type, Number(limit), Number(offset));
    (0, response_1.sendSuccess)(res, result, 200, "Reports retrieved successfully");
});
exports.getPendingReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await reportService.getPendingReports();
    (0, response_1.sendSuccess)(res, result, 200, "Pending reports retrieved successfully");
});
exports.assignReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    const result = await reportService.assignReport(reportId, req.userId);
    (0, response_1.sendSuccess)(res, result, 200, "Report assigned successfully");
});
exports.resolveReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    const { resolutionNotes, action } = req.body;
    const result = await reportService.resolveReport(reportId, req.userId, resolutionNotes, action);
    (0, response_1.sendSuccess)(res, result, 200, "Report resolved successfully");
});
exports.dismissReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    const { reason } = req.body;
    const result = await reportService.dismissReport(reportId, req.userId, reason);
    (0, response_1.sendSuccess)(res, result, 200, "Report dismissed successfully");
});
exports.escalateReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    const { reason } = req.body;
    const result = await reportService.escalateReport(reportId, req.userId, reason);
    (0, response_1.sendSuccess)(res, result, 200, "Report escalated successfully");
});
exports.getReportStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await reportService.getReportStats();
    (0, response_1.sendSuccess)(res, result, 200, "Report statistics retrieved successfully");
});
