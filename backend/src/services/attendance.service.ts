import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

import prisma from "../config/db";
import { AppError } from "../utils/AppError";

// ============================================
// QR CODE GENERATION
// ============================================

export interface GenerateQRCodeInput {
  applicationId: string;
  gigLatitude?: number;
  gigLongitude?: number;
  radiusMeters?: number;
  validForMinutes?: number;
}

export const generateQRCode = async (data: GenerateQRCodeInput) => {
  const {
    applicationId,
    gigLatitude,
    gigLongitude,
    radiusMeters = 100,
    validForMinutes = 30,
  } = data;

  // Verify application exists
  const application = await prisma.application.findUnique({
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
    throw new AppError("Application not found", 404);
  }

  // Check if QR already exists
  const existingQR = await prisma.qRAttendance.findUnique({
    where: { applicationId },
  });

  if (existingQR) {
    // Return existing QR if still valid
    const expiresAt = new Date(existingQR.createdAt.getTime() + validForMinutes * 60 * 1000);
    if (new Date() < expiresAt) {
      return {
        ...existingQR,
        qrCodeImage: await QRCode.toDataURL(existingQR.qrCodeData),
      };
    }
    // Update existing QR
    const uniqueData = `${applicationId}-${uuidv4()}-${Date.now()}`;
    const updated = await prisma.qRAttendance.update({
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
      qrCodeImage: await QRCode.toDataURL(uniqueData),
    };
  }

  // Create new QR attendance record
  const uniqueData = `${applicationId}-${uuidv4()}-${Date.now()}`;
  const qrAttendance = await prisma.qRAttendance.create({
    data: {
      applicationId,
      qrCodeData: uniqueData,
      radiusMeters,
      status: "CHECKED_IN",
    },
  });

  const qrCodeImage = await QRCode.toDataURL(uniqueData, {
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

// ============================================
// QR CODE VALIDATION & CHECK-IN
// ============================================

export interface CheckInInput {
  studentId: string;
  qrCodeData: string;
  latitude: number;
  longitude: number;
}

export const checkIn = async (data: CheckInInput) => {
  const { studentId, qrCodeData, latitude, longitude } = data;

  // Parse QR code data
  const parts = qrCodeData.split("-");
  if (parts.length < 3) {
    throw new AppError("Invalid QR code", 400);
  }

  const applicationId = parts[0];

  // Get QR attendance record
  const qrAttendance = await prisma.qRAttendance.findUnique({
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
    throw new AppError("QR code not found", 404);
  }

  // Verify QR code data matches
  if (qrAttendance.qrCodeData !== qrCodeData) {
    throw new AppError("Invalid QR code", 400);
  }

  // Verify student is the one assigned to this application
  if (qrAttendance.application.studentId !== studentId) {
    throw new AppError("This QR code is not for you", 403);
  }

  // Check if already checked in
  if (qrAttendance.checkInTime) {
    throw new AppError("Already checked in", 400);
  }

  // Validate location if gig has coordinates
  const gig = qrAttendance.application.gig;
  let distance = 0;
  let isWithinRadius = true;

  if (gig.latitude && gig.longitude) {
    distance = calculateDistance(latitude, longitude, gig.latitude, gig.longitude);
    isWithinRadius = distance <= qrAttendance.radiusMeters;

    if (!isWithinRadius) {
      throw new AppError(
        `You must be within ${qrAttendance.radiusMeters} meters of the work location to check in`,
        400
      );
    }
  }

  // Update QR attendance with check-in
  const updated = await prisma.qRAttendance.update({
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
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      workerPhase: "WORKING",
    },
  });

  // Log security event
  await prisma.securityLog.create({
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

// ============================================
// CHECK-OUT
// ============================================

export interface CheckOutInput {
  studentId: string;
  applicationId: string;
  latitude: number;
  longitude: number;
}

export const checkOut = async (data: CheckOutInput) => {
  const { studentId, applicationId, latitude, longitude } = data;

  // Get QR attendance record
  const qrAttendance = await prisma.qRAttendance.findUnique({
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
    throw new AppError("No check-in record found", 404);
  }

  // Verify student
  if (qrAttendance.application.studentId !== studentId) {
    throw new AppError("This record is not for you", 403);
  }

  // Check if already checked out
  if (qrAttendance.checkOutTime) {
    throw new AppError("Already checked out", 400);
  }

  if (!qrAttendance.checkInTime) {
    throw new AppError("No check-in record found", 400);
  }

  // Calculate distance for check-out
  const gig = qrAttendance.application.gig;
  let distance = 0;
  let isWithinRadius = true;

  if (gig.latitude && gig.longitude) {
    distance = calculateDistance(latitude, longitude, gig.latitude, gig.longitude);
    isWithinRadius = distance <= qrAttendance.radiusMeters;
  }

  // Update QR attendance with check-out
  const updated = await prisma.qRAttendance.update({
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
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      workerPhase: "COMPLETED",
    },
  });

  // Log security event
  await prisma.securityLog.create({
    data: {
      userId: studentId,
      action: "QR_CHECK_OUT",
      resourceType: "QRAttendance",
      resourceId: qrAttendance.id,
      metadata: {
        applicationId,
        distance,
        isWithinRadius,
        workDuration: updated.checkOutTime!.getTime() - qrAttendance.checkInTime!.getTime(),
      },
    },
  });

  return updated;
};

// ============================================
// GEO VALIDATION UTILITIES
// ============================================

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Validate if a location is within a radius of a target location
 */
export const isWithinRadius = (
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): boolean => {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusMeters;
};

// ============================================
// GET ATTENDANCE RECORDS
// ============================================

export const getAttendanceByApplication = async (applicationId: string) => {
  return prisma.qRAttendance.findUnique({
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

export const getAttendanceByStudent = async (studentId: string) => {
  return prisma.qRAttendance.findMany({
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

// ============================================
// FLAG SUSPICIOUS ATTENDANCE
// ============================================

export const flagAttendance = async (
  attendanceId: string,
  flaggedBy: string,
  reason: string
) => {
  return prisma.qRAttendance.update({
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