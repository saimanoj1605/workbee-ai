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
const reportController = __importStar(require("../controllers/report.controller"));
const router = (0, express_1.Router)();
// User Report Routes
router.post("/", auth_middleware_1.protect, reportController.createReport);
router.get("/my-reports", auth_middleware_1.protect, reportController.getUserReports);
router.get("/:reportId", auth_middleware_1.protect, reportController.getReport);
// Admin Report Routes
router.get("/admin/all", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), reportController.getAllReports);
router.get("/admin/pending", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), reportController.getPendingReports);
router.post("/admin/:reportId/assign", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), reportController.assignReport);
router.post("/admin/:reportId/resolve", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), reportController.resolveReport);
router.post("/admin/:reportId/dismiss", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), reportController.dismissReport);
router.post("/admin/:reportId/escalate", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), reportController.escalateReport);
router.get("/admin/stats", auth_middleware_1.protect, (0, role_middleware_1.requireRole)("ADMIN"), reportController.getReportStats);
exports.default = router;
