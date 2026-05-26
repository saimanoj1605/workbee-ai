"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerificationStats = exports.getPendingBusinessVerifications = exports.getPendingStudentVerifications = exports.validatePANNumber = exports.validateGSTNumber = exports.rejectBusinessVerification = exports.verifyBusiness = exports.getBusinessVerification = exports.createBusinessVerification = exports.validateCollegeEmail = exports.rejectStudentVerification = exports.verifyStudent = exports.getStudentVerification = exports.createStudentVerification = void 0;
const db_1 = __importDefault(require("../config/db"));
const AppError_1 = require("../utils/AppError");
const createStudentVerification = async (data) => {
    // Check if verification already exists
    const existing = await db_1.default.studentVerification.findUnique({
        where: { studentId: data.studentId },
    });
    if (existing) {
        if (existing.status === "VERIFIED") {
            throw new AppError_1.AppError("Student is already verified", 400);
        }
        // Update existing pending verification
        return db_1.default.studentVerification.update({
            where: { id: existing.id },
            data: {
                collegeEmail: data.collegeEmail,
                collegeName: data.collegeName,
                studentIdCardUrl: data.studentIdCardUrl,
                aadhaarNumber: data.aadhaarNumber,
                status: "PENDING",
            },
        });
    }
    return db_1.default.studentVerification.create({
        data,
    });
};
exports.createStudentVerification = createStudentVerification;
const getStudentVerification = async (studentId) => {
    return db_1.default.studentVerification.findUnique({
        where: { studentId },
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
        },
    });
};
exports.getStudentVerification = getStudentVerification;
const verifyStudent = async (studentId, verifiedBy, metadata) => {
    const verification = await db_1.default.studentVerification.findUnique({
        where: { studentId },
    });
    if (!verification) {
        throw new AppError_1.AppError("Verification record not found", 404);
    }
    if (verification.status === "VERIFIED") {
        throw new AppError_1.AppError("Student is already verified", 400);
    }
    // Validate college email if provided
    if (verification.collegeEmail) {
        const isValidCollegeEmail = (0, exports.validateCollegeEmail)(verification.collegeEmail);
        if (!isValidCollegeEmail) {
            return (0, exports.rejectStudentVerification)(studentId, verifiedBy, "Invalid college email domain");
        }
    }
    return db_1.default.studentVerification.update({
        where: { studentId },
        data: {
            status: "VERIFIED",
            verifiedAt: new Date(),
            verifiedBy,
            metadata: metadata || {},
        },
        include: {
            student: {
                include: {
                    user: true,
                },
            },
        },
    });
};
exports.verifyStudent = verifyStudent;
const rejectStudentVerification = async (studentId, rejectedBy, reason) => {
    return db_1.default.studentVerification.update({
        where: { studentId },
        data: {
            status: "REJECTED",
            rejectionReason: reason,
            verifiedBy: rejectedBy,
        },
    });
};
exports.rejectStudentVerification = rejectStudentVerification;
const validateCollegeEmail = (email) => {
    // Common Indian college email patterns
    const collegeDomains = [
        ".ac.in",
        ".edu.in",
        ".edu",
        "ac.in",
        "edu.in",
    ];
    const hasValidDomain = collegeDomains.some((domain) => email.toLowerCase().endsWith(domain));
    return hasValidDomain;
};
exports.validateCollegeEmail = validateCollegeEmail;
const createBusinessVerification = async (data) => {
    // Check if verification already exists
    const existing = await db_1.default.businessVerification.findUnique({
        where: { businessId: data.businessId },
    });
    if (existing) {
        if (existing.status === "VERIFIED") {
            throw new AppError_1.AppError("Business is already verified", 400);
        }
        // Update existing pending verification
        return db_1.default.businessVerification.update({
            where: { id: existing.id },
            data: {
                gstNumber: data.gstNumber,
                panNumber: data.panNumber,
                businessLicense: data.businessLicense,
                gstCertificateUrl: data.gstCertificateUrl,
                panCardUrl: data.panCardUrl,
                licenseUrl: data.licenseUrl,
                status: "PENDING",
            },
        });
    }
    return db_1.default.businessVerification.create({
        data,
    });
};
exports.createBusinessVerification = createBusinessVerification;
const getBusinessVerification = async (businessId) => {
    return db_1.default.businessVerification.findUnique({
        where: { businessId },
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
    });
};
exports.getBusinessVerification = getBusinessVerification;
const verifyBusiness = async (businessId, verifiedBy, metadata) => {
    const verification = await db_1.default.businessVerification.findUnique({
        where: { businessId },
    });
    if (!verification) {
        throw new AppError_1.AppError("Verification record not found", 404);
    }
    if (verification.status === "VERIFIED") {
        throw new AppError_1.AppError("Business is already verified", 400);
    }
    // Validate GST number format if provided
    if (verification.gstNumber) {
        const isValidGST = (0, exports.validateGSTNumber)(verification.gstNumber);
        if (!isValidGST) {
            return (0, exports.rejectBusinessVerification)(businessId, verifiedBy, "Invalid GST number format");
        }
    }
    // Validate PAN number format if provided
    if (verification.panNumber) {
        const isValidPAN = (0, exports.validatePANNumber)(verification.panNumber);
        if (!isValidPAN) {
            return (0, exports.rejectBusinessVerification)(businessId, verifiedBy, "Invalid PAN number format");
        }
    }
    return db_1.default.businessVerification.update({
        where: { businessId },
        data: {
            status: "VERIFIED",
            verifiedAt: new Date(),
            verifiedBy,
            metadata: metadata || {},
        },
        include: {
            business: {
                include: {
                    user: true,
                },
            },
        },
    });
};
exports.verifyBusiness = verifyBusiness;
const rejectBusinessVerification = async (businessId, rejectedBy, reason) => {
    return db_1.default.businessVerification.update({
        where: { businessId },
        data: {
            status: "REJECTED",
            rejectionReason: reason,
            verifiedBy: rejectedBy,
        },
    });
};
exports.rejectBusinessVerification = rejectBusinessVerification;
// Indian GST number validation
const validateGSTNumber = (gst) => {
    // GST format: 2 digits state code + 10 chars PAN + 1 digit entity + 1 char Z + 1 digit
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst.toUpperCase());
};
exports.validateGSTNumber = validateGSTNumber;
// Indian PAN number validation
const validatePANNumber = (pan) => {
    // PAN format: 5 letters + 4 digits + 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
};
exports.validatePANNumber = validatePANNumber;
// ============================================
// ADMIN QUERIES
// ============================================
const getPendingStudentVerifications = async () => {
    return db_1.default.studentVerification.findMany({
        where: { status: "PENDING" },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getPendingStudentVerifications = getPendingStudentVerifications;
const getPendingBusinessVerifications = async () => {
    return db_1.default.businessVerification.findMany({
        where: { status: "PENDING" },
        include: {
            business: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getPendingBusinessVerifications = getPendingBusinessVerifications;
const getVerificationStats = async () => {
    const studentStats = await db_1.default.studentVerification.groupBy({
        by: ["status"],
        _count: true,
    });
    const businessStats = await db_1.default.businessVerification.groupBy({
        by: ["status"],
        _count: true,
    });
    return {
        students: {
            pending: studentStats.find((s) => s.status === "PENDING")?._count || 0,
            verified: studentStats.find((s) => s.status === "VERIFIED")?._count || 0,
            rejected: studentStats.find((s) => s.status === "REJECTED")?._count || 0,
        },
        businesses: {
            pending: businessStats.find((s) => s.status === "PENDING")?._count || 0,
            verified: businessStats.find((s) => s.status === "VERIFIED")?._count || 0,
            rejected: businessStats.find((s) => s.status === "REJECTED")?._count || 0,
        },
    };
};
exports.getVerificationStats = getVerificationStats;
