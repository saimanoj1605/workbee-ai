import type { ReportType, ReportStatus } from "@prisma/client";

import prisma from "../config/db";
import { AppError } from "../utils/AppError";

// ============================================
// CREATE REPORT
// ============================================

export interface CreateReportInput {
  reporterId: string;
  targetUserId?: string;
  targetGigId?: string;
  targetApplicationId?: string;
  type: ReportType;
  reason: string;
  description?: string;
  evidence?: Record<string, any>;
}

export const createReport = async (data: CreateReportInput) => {
  // Prevent self-reporting
  if (data.targetUserId && data.targetUserId === data.reporterId) {
    throw new AppError("Cannot report yourself", 400);
  }

  // Check for duplicate recent reports
  const recentReport = await prisma.report.findFirst({
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
    throw new AppError("You have already submitted a similar report recently", 400);
  }

  return prisma.report.create({
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

// ============================================
// GET REPORTS
// ============================================

export const getReport = async (reportId: string) => {
  return prisma.report.findUnique({
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

export const getUserReports = async (userId: string) => {
  return prisma.report.findMany({
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

// ============================================
// ADMIN: GET ALL REPORTS
// ============================================

export const getAllReports = async (
  status?: ReportStatus,
  type?: ReportType,
  limit: number = 50,
  offset: number = 0
) => {
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  return prisma.report.findMany({
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

export const getPendingReports = async () => {
  return prisma.report.findMany({
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

// ============================================
// ADMIN: ASSIGN REPORT
// ============================================

export const assignReport = async (
  reportId: string,
  adminId: string
) => {
  return prisma.report.update({
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

// ============================================
// ADMIN: RESOLVE REPORT
// ============================================

export const resolveReport = async (
  reportId: string,
  resolvedBy: string,
  resolutionNotes: string,
  action?: "warn" | "suspend" | "ban"
) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  if (report.status === "RESOLVED" || report.status === "DISMISSED") {
    throw new AppError("Report is already resolved", 400);
  }

  // Update report status
  const updatedReport = await prisma.report.update({
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
    await prisma.securityLog.create({
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

// ============================================
// ADMIN: DISMISS REPORT
// ============================================

export const dismissReport = async (
  reportId: string,
  dismissedBy: string,
  reason: string
) => {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status: "DISMISSED",
      resolvedAt: new Date(),
      resolvedBy: dismissedBy,
      resolutionNotes: reason,
    },
  });
};

// ============================================
// ESCALATE REPORT
// ============================================

export const escalateReport = async (
  reportId: string,
  escalatedBy: string,
  reason: string
) => {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status: "ESCALATED",
      resolutionNotes: `Escalated by ${escalatedBy}: ${reason}`,
    },
  });
};

// ============================================
// REPORT STATISTICS
// ============================================

export const getReportStats = async () => {
  const stats = await prisma.report.groupBy({
    by: ["status", "type"],
    _count: true,
  });

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};

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

// ============================================
// GET REPORTS BY USER (for reputation scoring)
// ============================================

export const getUserReportCount = async (userId: string) => {
  const [asTarget, asReporter] = await Promise.all([
    prisma.report.count({
      where: { targetUserId: userId },
    }),
    prisma.report.count({
      where: { reporterId: userId },
    }),
  ]);

  return { asTarget, asReporter };
};