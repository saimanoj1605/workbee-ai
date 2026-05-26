import prisma from "../config/db";
import { AppError } from "../utils/AppError";

// ============================================
// CREATE WORK PROOF
// ============================================

export interface CreateWorkProofInput {
  applicationId: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  selfieUrl?: string;
  completionProofUrl?: string;
  description?: string;
}

export const createWorkProof = async (data: CreateWorkProofInput) => {
  // Check if work proof already exists
  const existing = await prisma.workProof.findFirst({
    where: { applicationId: data.applicationId },
  });

  if (existing) {
    throw new AppError("Work proof already submitted for this application", 400);
  }

  // Verify application exists
  const application = await prisma.application.findUnique({
    where: { id: data.applicationId },
    include: {
      student: {
        include: {
          user: true,
        },
      },
      gig: true,
    },
  });

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  return prisma.workProof.create({
    data: {
      applicationId: data.applicationId,
      beforeImageUrl: data.beforeImageUrl,
      afterImageUrl: data.afterImageUrl,
      selfieUrl: data.selfieUrl,
      completionProofUrl: data.completionProofUrl,
      description: data.description,
      status: "PENDING",
    },
    include: {
      application: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
            },
          },
          gig: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });
};

// ============================================
// GET WORK PROOF
// ============================================

export const getWorkProof = async (workProofId: string) => {
  return prisma.workProof.findUnique({
    where: { id: workProofId },
    include: {
      application: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
            },
          },
          gig: {
            include: {
              business: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};

export const getWorkProofByApplication = async (applicationId: string) => {
  return prisma.workProof.findUnique({
    where: { applicationId },
    include: {
      application: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
          gig: true,
        },
      },
    },
  });
};

export const getWorkProofByStudent = async (studentId: string) => {
  return prisma.workProof.findMany({
    where: {
      application: {
        studentId,
      },
    },
    include: {
      application: {
        include: {
          gig: {
            select: {
              id: true,
              title: true,
              business: {
                select: {
                  businessName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ============================================
// VERIFY WORK PROOF (Business/Admin)
// ============================================

export const verifyWorkProof = async (
  workProofId: string,
  verifiedBy: string,
  metadata?: Record<string, any>
) => {
  const workProof = await prisma.workProof.findUnique({
    where: { id: workProofId },
    include: {
      application: true,
    },
  });

  if (!workProof) {
    throw new AppError("Work proof not found", 404);
  }

  if (workProof.status === "VERIFIED") {
    throw new AppError("Work proof is already verified", 400);
  }

  if (workProof.status === "REJECTED") {
    throw new AppError("Work proof was already rejected", 400);
  }

  // Update work proof status
  const updated = await prisma.workProof.update({
    where: { id: workProofId },
    data: {
      status: "VERIFIED",
      verifiedBy,
      verifiedAt: new Date(),
      metadata: metadata || {},
    },
    include: {
      application: {
        include: {
          payment: true,
        },
      },
    },
  });

  // Update application status
  await prisma.application.update({
    where: { id: workProof.applicationId },
    data: {
      status: "HIRED",
      workerPhase: "COMPLETED",
    },
  });

  // Log security event
  await prisma.securityLog.create({
    data: {
      userId: verifiedBy,
      action: "WORK_PROOF_VERIFIED",
      resourceType: "WorkProof",
      resourceId: workProofId,
      metadata: {
        applicationId: workProof.applicationId,
        verifiedBy,
      },
    },
  });

  return updated;
};

// ============================================
// REJECT WORK PROOF
// ============================================

export const rejectWorkProof = async (
  workProofId: string,
  rejectedBy: string,
  reason: string
) => {
  const workProof = await prisma.workProof.findUnique({
    where: { id: workProofId },
  });

  if (!workProof) {
    throw new AppError("Work proof not found", 404);
  }

  if (workProof.status === "REJECTED") {
    throw new AppError("Work proof is already rejected", 400);
  }

  if (workProof.status === "VERIFIED") {
    throw new AppError("Work proof was already verified", 400);
  }

  return prisma.workProof.update({
    where: { id: workProofId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      verifiedBy: rejectedBy,
    },
  });
};

// ============================================
// ADMIN: GET ALL WORK PROOFS
// ============================================

export const getAllWorkProofs = async (
  status?: string,
  limit: number = 50,
  offset: number = 0
) => {
  const where: any = {};

  if (status) {
    where.status = status;
  }

  return prisma.workProof.findMany({
    where,
    include: {
      application: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
            },
          },
          gig: {
            select: {
              id: true,
              title: true,
              business: {
                select: {
                  businessName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
};

export const getPendingWorkProofs = async () => {
  return prisma.workProof.findMany({
    where: { status: "PENDING" },
    include: {
      application: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
            },
          },
          gig: {
            select: {
              id: true,
              title: true,
              business: {
                select: {
                  businessName: true,
                  user: {
                    select: {
                      email: true,
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ============================================
// WORK PROOF STATISTICS
// ============================================

export const getWorkProofStats = async () => {
  const stats = await prisma.workProof.groupBy({
    by: ["status"],
    _count: true,
  });

  return {
    pending: stats.find((s) => s.status === "PENDING")?._count || 0,
    verified: stats.find((s) => s.status === "VERIFIED")?._count || 0,
    rejected: stats.find((s) => s.status === "REJECTED")?._count || 0,
    total: stats.reduce((sum, s) => sum + s._count, 0),
  };
};