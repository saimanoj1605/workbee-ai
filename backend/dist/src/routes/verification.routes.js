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
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const verificationController = __importStar(require("../controllers/verification.controller"));
const router = (0, express_1.Router)();
// Student Verification Routes
router.post("/students/verify", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("STUDENT"), verificationController.submitStudentVerification);
router.get("/students/verification-status", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("STUDENT"), verificationController.getStudentVerificationStatus);
// Business Verification Routes
router.post("/businesses/verify", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("BUSINESS"), verificationController.submitBusinessVerification);
router.get("/businesses/verification-status", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("BUSINESS"), verificationController.getBusinessVerificationStatus);
// Admin Verification Routes
router.get("/admin/students/pending", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), verificationController.getPendingStudentVerifications);
router.get("/admin/businesses/pending", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), verificationController.getPendingBusinessVerifications);
router.post("/admin/students/:studentId/approve", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), verificationController.approveStudentVerification);
router.post("/admin/students/:studentId/reject", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), verificationController.rejectStudentVerification);
router.post("/admin/businesses/:businessId/approve", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), verificationController.approveBusinessVerification);
router.post("/admin/businesses/:businessId/reject", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), verificationController.rejectBusinessVerification);
router.get("/admin/stats", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), verificationController.getVerificationStats);
exports.default = router;
