"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flagAttendance = exports.getAttendanceByStudent = exports.getAttendanceByApplication = exports.isWithinRadius = exports.calculateDistance = exports.checkOut = exports.checkIn = exports.generateQRCode = void 0;
const uuid_1 = require("uuid");
const qrcode_1 = __importDefault(require("qrcode"));
const db_1 = __importDefault(require("../config/db"));
const AppError_1 = require("../utils/AppError");
const generateQRCode = async (data) => {
    const { applicationId, gigLatitude, gigLongitude, radiusMeters = 100, validForMinutes = 30, } = data;
    // Verify application exists
    const application = await db_1.default.application.findUnique({
        where: { id: applicationId },
        include: {
            gig: true,
            student: {
                include: {
                    user: true,
                },
            },
        },
    });
    if (!application) {
        throw new AppError_1.AppError("Application not found", 404);
    }
    // Check if QR already exists
    const existingQR = await db_1.default.qRAttendance.findUnique({
        where: { applicationId },
    });
    if (existingQR) {
        // Return existing QR if still valid
        const expiresAt = new Date(existingQR.createdAt.getTime() + validForMinutes * 60 * 1000);
        if (new Date() < expiresAt) {
            return {
                ...existingQR,
                qrCodeImage: await qrcode_1.default.toDataURL(existingQR.qrCodeData),
            };
        }
        // Update existing QR
        const uniqueData = `${applicationId}-${(0, uuid_1.v4)()}-${Date.now()}`;
        const updated = await db_1.default.qRAttendance.update({
            where: { applicationId },
            data: {
                qrCodeData: uniqueData,
                status: "CHECKED_IN",
                checkInTime: null,
                checkOutTime: null,
                distanceFromGig: null,
                isWithinRadius: null,
            },
        });
        return {
            ...updated,
            qrCodeImage: await qrcode_1.default.toDataURL(uniqueData),
        };
    }
    // Create new QR attendance record
    const uniqueData = `${applicationId}-${(0, uuid_1.v4)()}-${Date.now()}`;
    const qrAttendance = await db_1.default.qRAttendance.create({
        data: {
            applicationId,
            qrCodeData: uniqueData,
            radiusMeters,
            status: "CHECKED_IN",
        },
    });
    const qrCodeImage = await qrcode_1.default.toDataURL(uniqueData, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
    });
    return {
        ...qrAttendance,
        qrCodeImage,
        expiresAt: new Date(Date.now() + validForMinutes * 60 * 1000),
    };
};
exports.generateQRCode = generateQRCode;
const checkIn = async (data) => {
    const { studentId, qrCodeData, latitude, longitude } = data;
    // Parse QR code data
    const parts = qrCodeData.split("-");
    if (parts.length < 3) {
        throw new AppError_1.AppError("Invalid QR code", 400);
    }
    const applicationId = parts[0];
    // Get QR attendance record
    const qrAttendance = await db_1.default.qRAttendance.findUnique({
        where: { applicationId },
        include: {
            application: {
                include: {
                    gig: true,
                    student: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
        },
    });
    if (!qrAttendance) {
        throw new AppError_1.AppError("QR code not found", 404);
    }
    // Verify QR code data matches
    if (qrAttendance.qrCodeData !== qrCodeData) {
        throw new AppError_1.AppError("Invalid QR code", 400);
    }
    // Verify student is the one assigned to this application
    if (qrAttendance.application.studentId !== studentId) {
        throw new AppError_1.AppError("This QR code is not for you", 403);
    }
    // Check if already checked in
    if (qrAttendance.checkInTime) {
        throw new AppError_1.AppError("Already checked in", 400);
    }
    // Validate location if gig has coordinates
    const gig = qrAttendance.application.gig;
    let distance = 0;
    let isWithinRadius = true;
    if (gig.latitude && gig.longitude) {
        distance = (0, exports.calculateDistance)(latitude, longitude, gig.latitude, gig.longitude);
        isWithinRadius = distance <= qrAttendance.radiusMeters;
        if (!isWithinRadius) {
            throw new AppError_1.AppError(`You must be within ${qrAttendance.radiusMeters} meters of the work location to check in`, 400);
        }
    }
    // Update QR attendance with check-in
    const updated = await db_1.default.qRAttendance.update({
        where: { applicationId },
        data: {
            checkInLatitude: latitude,
            checkInLongitude: longitude,
            checkInTime: new Date(),
            distanceFromGig: distance,
            isWithinRadius,
            status: "CHECKED_IN",
        },
        include: {
            application: {
                include: {
                    gig: true,
                    student: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
        },
    });
    // Update application worker phase
    await db_1.default.application.update({
        where: { id: applicationId },
        data: {
            workerPhase: "WORKING",
        },
    });
    // Log security event
    await db_1.default.securityLog.create({
        data: {
            userId: studentId,
            action: "QR_CHECK_IN",
            resourceType: "QRAttendance",
            resourceId: qrAttendance.id,
            ipAddress: null,
            metadata: {
                applicationId,
                gigId: gig.id,
                distance,
                isWithinRadius,
                latitude,
                longitude,
            },
        },
    });
    return updated;
};
exports.checkIn = checkIn;
const checkOut = async (data) => {
    const { studentId, applicationId, latitude, longitude } = data;
    // Get QR attendance record
    const qrAttendance = await db_1.default.qRAttendance.findUnique({
        where: { applicationId },
        include: {
            application: {
                include: {
                    gig: true,
                    student: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
        },
    });
    if (!qrAttendance) {
        throw new AppError_1.AppError("No check-in record found", 404);
    }
    // Verify student
    if (qrAttendance.application.studentId !== studentId) {
        throw new AppError_1.AppError("This record is not for you", 403);
    }
    // Check if already checked out
    if (qrAttendance.checkOutTime) {
        throw new AppError_1.AppError("Already checked out", 400);
    }
    if (!qrAttendance.checkInTime) {
        throw new AppError_1.AppError("No check-in record found", 400);
    }
    // Calculate distance for check-out
    const gig = qrAttendance.application.gig;
    let distance = 0;
    let isWithinRadius = true;
    if (gig.latitude && gig.longitude) {
        distance = (0, exports.calculateDistance)(latitude, longitude, gig.latitude, gig.longitude);
        isWithinRadius = distance <= qrAttendance.radiusMeters;
    }
    // Update QR attendance with check-out
    const updated = await db_1.default.qRAttendance.update({
        where: { applicationId },
        data: {
            checkOutLatitude: latitude,
            checkOutLongitude: longitude,
            checkOutTime: new Date(),
            status: "VERIFIED",
        },
        include: {
            application: true,
        },
    });
    // Update application worker phase
    await db_1.default.application.update({
        where: { id: applicationId },
        data: {
            workerPhase: "COMPLETED",
        },
    });
    // Log security event
    await db_1.default.securityLog.create({
        data: {
            userId: studentId,
            action: "QR_CHECK_OUT",
            resourceType: "QRAttendance",
            resourceId: qrAttendance.id,
            metadata: {
                applicationId,
                distance,
                isWithinRadius,
                workDuration: updated.checkOutTime.getTime() - qrAttendance.checkInTime.getTime(),
            },
        },
    });
    return updated;
};
exports.checkOut = checkOut;
// ============================================
// GEO VALIDATION UTILITIES
// ============================================
/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};
exports.calculateDistance = calculateDistance;
/**
 * Validate if a location is within a radius of a target location
 */
const isWithinRadius = (userLat, userLon, targetLat, targetLon, radiusMeters) => {
    const distance = (0, exports.calculateDistance)(userLat, userLon, targetLat, targetLon);
    return distance <= radiusMeters;
};
exports.isWithinRadius = isWithinRadius;
// ============================================
// GET ATTENDANCE RECORDS
// ============================================
const getAttendanceByApplication = async (applicationId) => {
    return db_1.default.qRAttendance.findUnique({
        where: { applicationId },
        include: {
            application: {
                include: {
                    gig: true,
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
            },
        },
    });
};
exports.getAttendanceByApplication = getAttendanceByApplication;
const getAttendanceByStudent = async (studentId) => {
    return db_1.default.qRAttendance.findMany({
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
                            location: true,
                        },
                    },
                },
            },
        },
        orderBy: { checkInTime: "desc" },
    });
};
exports.getAttendanceByStudent = getAttendanceByStudent;
// ============================================
// FLAG SUSPICIOUS ATTENDANCE
// ============================================
const flagAttendance = async (attendanceId, flaggedBy, reason) => {
    return db_1.default.qRAttendance.update({
        where: { id: attendanceId },
        data: {
            status: "FLAGGED",
            metadata: {
                flagged: true,
                flaggedBy,
                flaggedAt: new Date(),
                reason,
            },
        },
    });
};
exports.flagAttendance = flagAttendance;
