"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserReportCount = exports.getReportStats = exports.escalateReport = exports.dismissReport = exports.resolveReport = exports.assignReport = exports.getPendingReports = exports.getAllReports = exports.getUserReports = exports.getReport = exports.createReport = void 0;
const db_1 = __importDefault(require("../config/db"));
const AppError_1 = require("../utils/AppError");
const createReport = async (data) => {
    // Prevent self-reporting
    if (data.targetUserId && data.targetUserId === data.reporterId) {
        throw new AppError_1.AppError("Cannot report yourself", 400);
    }
    // Check for duplicate recent reports
    const recentReport = await db_1.default.report.findFirst({
        where: {
            reporterId: data.reporterId,
            targetUserId: data.targetUserId,
            targetGigId: data.targetGigId,
            type: data.type,
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
        },
    });
    if (recentReport) {
        throw new AppError_1.AppError("You have already submitted a similar report recently", 400);
    }
    return db_1.default.report.create({
        data: {
            reporterId: data.reporterId,
            targetUserId: data.targetUserId,
            targetGigId: data.targetGigId,
            type: data.type,
            reason: data.reason,
            description: data.description,
            evidence: data.evidence,
            status: "PENDING",
        },
        include: {
            reporter: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
    });
};
exports.createReport = createReport;
// ============================================
// GET REPORTS
// ============================================
const getReport = async (reportId) => {
    return db_1.default.report.findUnique({
        where: { id: reportId },
        include: {
            reporter: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
            targetUser: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
            targetGig: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                },
            },
            assignedAdmin: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
    });
};
exports.getReport = getReport;
const getUserReports = async (userId) => {
    return db_1.default.report.findMany({
        where: {
            OR: [
                { reporterId: userId },
                { targetUserId: userId },
            ],
        },
        include: {
            reporter: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
            targetUser: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getUserReports = getUserReports;
// ============================================
// ADMIN: GET ALL REPORTS
// ============================================
const getAllReports = async (status, type, limit = 50, offset = 0) => {
    const where = {};
    if (status) {
        where.status = status;
    }
    if (type) {
        where.type = type;
    }
    return db_1.default.report.findMany({
        where,
        include: {
            reporter: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
            targetUser: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
            targetGig: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
    });
};
exports.getAllReports = getAllReports;
const getPendingReports = async () => {
    return db_1.default.report.findMany({
        where: { status: "PENDING" },
        include: {
            reporter: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
            targetUser: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
        },
        orderBy: { createdAt: "asc" },
    });
};
exports.getPendingReports = getPendingReports;
// ============================================
// ADMIN: ASSIGN REPORT
// ============================================
const assignReport = async (reportId, adminId) => {
    return db_1.default.report.update({
        where: { id: reportId },
        data: {
            assignedAdminId: adminId,
            status: "UNDER_REVIEW",
        },
        include: {
            assignedAdmin: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
    });
};
exports.assignReport = assignReport;
// ============================================
// ADMIN: RESOLVE REPORT
// ============================================
const resolveReport = async (reportId, resolvedBy, resolutionNotes, action) => {
    const report = await db_1.default.report.findUnique({
        where: { id: reportId },
    });
    if (!report) {
        throw new AppError_1.AppError("Report not found", 404);
    }
    if (report.status === "RESOLVED" || report.status === "DISMISSED") {
        throw new AppError_1.AppError("Report is already resolved", 400);
    }
    // Update report status
    const updatedReport = await db_1.default.report.update({
        where: { id: reportId },
        data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
            resolvedBy,
            resolutionNotes,
        },
        include: {
            targetUser: true,
        },
    });
    // Take action on target user if specified
    if (action && updatedReport.targetUser) {
        // This would trigger user moderation actions
        // For now, we just log it
        await db_1.default.securityLog.create({
            data: {
                userId: updatedReport.targetUser.id,
                action: `REPORT_${action.toUpperCase()}`,
                resourceType: "User",
                resourceId: updatedReport.targetUser.id,
                metadata: {
                    reportId,
                    reason: resolutionNotes,
                    actionTaken: action,
                },
                isFlagged: true,
            },
        });
    }
    return updatedReport;
};
exports.resolveReport = resolveReport;
// ============================================
// ADMIN: DISMISS REPORT
// ============================================
const dismissReport = async (reportId, dismissedBy, reason) => {
    return db_1.default.report.update({
        where: { id: reportId },
        data: {
            status: "DISMISSED",
            resolvedAt: new Date(),
            resolvedBy: dismissedBy,
            resolutionNotes: reason,
        },
    });
};
exports.dismissReport = dismissReport;
// ============================================
// ESCALATE REPORT
// ============================================
const escalateReport = async (reportId, escalatedBy, reason) => {
    return db_1.default.report.update({
        where: { id: reportId },
        data: {
            status: "ESCALATED",
            resolutionNotes: `Escalated by ${escalatedBy}: ${reason}`,
        },
    });
};
exports.escalateReport = escalateReport;
// ============================================
// REPORT STATISTICS
// ============================================
const getReportStats = async () => {
    const stats = await db_1.default.report.groupBy({
        by: ["status", "type"],
        _count: true,
    });
    const byStatus = {};
    const byType = {};
    stats.forEach((s) => {
        byStatus[s.status] = (byStatus[s.status] || 0) + s._count;
        byType[s.type] = (byType[s.type] || 0) + s._count;
    });
    return {
        byStatus,
        byType,
        total: stats.reduce((sum, s) => sum + s._count, 0),
    };
};
exports.getReportStats = getReportStats;
// ============================================
// GET REPORTS BY USER (for reputation scoring)
// ============================================
const getUserReportCount = async (userId) => {
    const [asTarget, asReporter] = await Promise.all([
        db_1.default.report.count({
            where: { targetUserId: userId },
        }),
        db_1.default.report.count({
            where: { reporterId: userId },
        }),
    ]);
    return { asTarget, asReporter };
};
exports.getUserReportCount = getUserReportCount;
