"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkProofStats = exports.getPendingWorkProofs = exports.getAllWorkProofs = exports.rejectWorkProof = exports.verifyWorkProof = exports.getWorkProofByStudent = exports.getWorkProofByApplication = exports.getWorkProof = exports.createWorkProof = void 0;
const db_1 = __importDefault(require("../config/db"));
const AppError_1 = require("../utils/AppError");
const createWorkProof = async (data) => {
    // Check if work proof already exists
    const existing = await db_1.default.workProof.findFirst({
        where: { applicationId: data.applicationId },
    });
    if (existing) {
        throw new AppError_1.AppError("Work proof already submitted for this application", 400);
    }
    // Verify application exists
    const application = await db_1.default.application.findUnique({
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
        throw new AppError_1.AppError("Application not found", 404);
    }
    return db_1.default.workProof.create({
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
exports.createWorkProof = createWorkProof;
// ============================================
// GET WORK PROOF
// ============================================
const getWorkProof = async (workProofId) => {
    return db_1.default.workProof.findUnique({
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
exports.getWorkProof = getWorkProof;
const getWorkProofByApplication = async (applicationId) => {
    return db_1.default.workProof.findUnique({
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
exports.getWorkProofByApplication = getWorkProofByApplication;
const getWorkProofByStudent = async (studentId) => {
    return db_1.default.workProof.findMany({
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
exports.getWorkProofByStudent = getWorkProofByStudent;
// ============================================
// VERIFY WORK PROOF (Business/Admin)
// ============================================
const verifyWorkProof = async (workProofId, verifiedBy, metadata) => {
    const workProof = await db_1.default.workProof.findUnique({
        where: { id: workProofId },
        include: {
            application: true,
        },
    });
    if (!workProof) {
        throw new AppError_1.AppError("Work proof not found", 404);
    }
    if (workProof.status === "VERIFIED") {
        throw new AppError_1.AppError("Work proof is already verified", 400);
    }
    if (workProof.status === "REJECTED") {
        throw new AppError_1.AppError("Work proof was already rejected", 400);
    }
    // Update work proof status
    const updated = await db_1.default.workProof.update({
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
    await db_1.default.application.update({
        where: { id: workProof.applicationId },
        data: {
            status: "HIRED",
            workerPhase: "COMPLETED",
        },
    });
    // Log security event
    await db_1.default.securityLog.create({
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
exports.verifyWorkProof = verifyWorkProof;
// ============================================
// REJECT WORK PROOF
// ============================================
const rejectWorkProof = async (workProofId, rejectedBy, reason) => {
    const workProof = await db_1.default.workProof.findUnique({
        where: { id: workProofId },
    });
    if (!workProof) {
        throw new AppError_1.AppError("Work proof not found", 404);
    }
    if (workProof.status === "REJECTED") {
        throw new AppError_1.AppError("Work proof is already rejected", 400);
    }
    if (workProof.status === "VERIFIED") {
        throw new AppError_1.AppError("Work proof was already verified", 400);
    }
    return db_1.default.workProof.update({
        where: { id: workProofId },
        data: {
            status: "REJECTED",
            rejectionReason: reason,
            verifiedBy: rejectedBy,
        },
    });
};
exports.rejectWorkProof = rejectWorkProof;
// ============================================
// ADMIN: GET ALL WORK PROOFS
// ============================================
const getAllWorkProofs = async (status, limit = 50, offset = 0) => {
    const where = {};
    if (status) {
        where.status = status;
    }
    return db_1.default.workProof.findMany({
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
exports.getAllWorkProofs = getAllWorkProofs;
const getPendingWorkProofs = async () => {
    return db_1.default.workProof.findMany({
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
exports.getPendingWorkProofs = getPendingWorkProofs;
// ============================================
// WORK PROOF STATISTICS
// ============================================
const getWorkProofStats = async () => {
    const stats = await db_1.default.workProof.groupBy({
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
exports.getWorkProofStats = getWorkProofStats;
