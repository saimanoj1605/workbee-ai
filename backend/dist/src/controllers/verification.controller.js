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
exports.getVerificationStats = exports.rejectBusinessVerification = exports.approveBusinessVerification = exports.getPendingBusinessVerifications = exports.rejectStudentVerification = exports.approveStudentVerification = exports.getPendingStudentVerifications = exports.getBusinessVerificationStatus = exports.submitBusinessVerification = exports.getStudentVerificationStatus = exports.submitStudentVerification = void 0;
const verificationService = __importStar(require("../services/verification.service"));
const response_1 = require("../utils/response");
const asyncHandler_1 = require("../utils/asyncHandler");
// ============================================
// STUDENT VERIFICATION
// ============================================
exports.submitStudentVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await verificationService.createStudentVerification({
        studentId: req.userId,
        ...req.body,
    });
    (0, response_1.sendSuccess)(res, result, 201, "Student verification submitted");
});
exports.getStudentVerificationStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await verificationService.getStudentVerification(req.userId);
    (0, response_1.sendSuccess)(res, result, 200, "Student verification status retrieved");
});
// ============================================
// BUSINESS VERIFICATION
// ============================================
exports.submitBusinessVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await verificationService.createBusinessVerification({
        businessId: req.userId,
        ...req.body,
    });
    (0, response_1.sendSuccess)(res, result, 201, "Business verification submitted");
});
exports.getBusinessVerificationStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await verificationService.getBusinessVerification(req.userId);
    (0, response_1.sendSuccess)(res, result, 200, "Business verification status retrieved");
});
// ============================================
// ADMIN: STUDENT VERIFICATIONS
// ============================================
exports.getPendingStudentVerifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await verificationService.getPendingStudentVerifications();
    (0, response_1.sendSuccess)(res, result, 200, "Pending student verifications retrieved");
});
exports.approveStudentVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
    const result = await verificationService.verifyStudent(studentId, req.userId, req.body.metadata);
    (0, response_1.sendSuccess)(res, result, 200, "Student verification approved");
});
exports.rejectStudentVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
    const { reason } = req.body;
    const result = await verificationService.rejectStudentVerification(studentId, req.userId, reason);
    (0, response_1.sendSuccess)(res, result, 200, "Student verification rejected");
});
// ============================================
// ADMIN: BUSINESS VERIFICATIONS
// ============================================
exports.getPendingBusinessVerifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await verificationService.getPendingBusinessVerifications();
    (0, response_1.sendSuccess)(res, result, 200, "Pending business verifications retrieved");
});
exports.approveBusinessVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const result = await verificationService.verifyBusiness(businessId, req.userId, req.body.metadata);
    (0, response_1.sendSuccess)(res, result, 200, "Business verification approved");
});
exports.rejectBusinessVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const businessId = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
    const { reason } = req.body;
    const result = await verificationService.rejectBusinessVerification(businessId, req.userId, reason);
    (0, response_1.sendSuccess)(res, result, 200, "Business verification rejected");
});
// ============================================
// ADMIN: VERIFICATION STATISTICS
// ============================================
exports.getVerificationStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await verificationService.getVerificationStats();
    (0, response_1.sendSuccess)(res, result, 200, "Verification statistics retrieved");
});
