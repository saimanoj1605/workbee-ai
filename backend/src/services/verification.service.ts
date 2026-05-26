import type { VerificationStatus } from "@prisma/client";

import prisma from "../config/db";
import { AppError } from "../utils/AppError";

// ============================================
// STUDENT VERIFICATION
// ============================================

export interface CreateStudentVerificationInput {
  studentId: string;
  collegeEmail?: string;
  collegeName?: string;
  studentIdCardUrl?: string;
  aadhaarNumber?: string;
}

export const createStudentVerification = async (data: CreateStudentVerificationInput) => {
  // Check if verification already exists
  const existing = await prisma.studentVerification.findUnique({
    where: { studentId: data.studentId },
  });

  if (existing) {
    if (existing.status === "VERIFIED") {
      throw new AppError("Student is already verified", 400);
    }
    // Update existing pending verification
    return prisma.studentVerification.update({
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

  return prisma.studentVerification.create({
    data,
  });
};

export const getStudentVerification = async (studentId: string) => {
  return prisma.studentVerification.findUnique({
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

export const verifyStudent = async (
  studentId: string,
  verifiedBy: string,
  metadata?: Record<string, any>
) => {
  const verification = await prisma.studentVerification.findUnique({
    where: { studentId },
  });

  if (!verification) {
    throw new AppError("Verification record not found", 404);
  }

  if (verification.status === "VERIFIED") {
    throw new AppError("Student is already verified", 400);
  }

  // Validate college email if provided
  if (verification.collegeEmail) {
    const isValidCollegeEmail = validateCollegeEmail(verification.collegeEmail);
    if (!isValidCollegeEmail) {
      return rejectStudentVerification(
        studentId,
        verifiedBy,
        "Invalid college email domain"
      );
    }
  }

  return prisma.studentVerification.update({
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

export const rejectStudentVerification = async (
  studentId: string,
  rejectedBy: string,
  reason: string
) => {
  return prisma.studentVerification.update({
    where: { studentId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      verifiedBy: rejectedBy,
    },
  });
};

export const validateCollegeEmail = (email: string): boolean => {
  // Common Indian college email patterns
  const collegeDomains = [
    ".ac.in",
    ".edu.in",
    ".edu",
    "ac.in",
    "edu.in",
  ];

  const hasValidDomain = collegeDomains.some((domain) =>
    email.toLowerCase().endsWith(domain)
  );

  return hasValidDomain;
};

// ============================================
// BUSINESS VERIFICATION
// ============================================

export interface CreateBusinessVerificationInput {
  businessId: string;
  gstNumber?: string;
  panNumber?: string;
  businessLicense?: string;
  gstCertificateUrl?: string;
  panCardUrl?: string;
  licenseUrl?: string;
}

export const createBusinessVerification = async (data: CreateBusinessVerificationInput) => {
  // Check if verification already exists
  const existing = await prisma.businessVerification.findUnique({
    where: { businessId: data.businessId },
  });

  if (existing) {
    if (existing.status === "VERIFIED") {
      throw new AppError("Business is already verified", 400);
    }
    // Update existing pending verification
    return prisma.businessVerification.update({
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

  return prisma.businessVerification.create({
    data,
  });
};

export const getBusinessVerification = async (businessId: string) => {
  return prisma.businessVerification.findUnique({
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

export const verifyBusiness = async (
  businessId: string,
  verifiedBy: string,
  metadata?: Record<string, any>
) => {
  const verification = await prisma.businessVerification.findUnique({
    where: { businessId },
  });

  if (!verification) {
    throw new AppError("Verification record not found", 404);
  }

  if (verification.status === "VERIFIED") {
    throw new AppError("Business is already verified", 400);
  }

  // Validate GST number format if provided
  if (verification.gstNumber) {
    const isValidGST = validateGSTNumber(verification.gstNumber);
    if (!isValidGST) {
      return rejectBusinessVerification(
        businessId,
        verifiedBy,
        "Invalid GST number format"
      );
    }
  }

  // Validate PAN number format if provided
  if (verification.panNumber) {
    const isValidPAN = validatePANNumber(verification.panNumber);
    if (!isValidPAN) {
      return rejectBusinessVerification(
        businessId,
        verifiedBy,
        "Invalid PAN number format"
      );
    }
  }

  return prisma.businessVerification.update({
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

export const rejectBusinessVerification = async (
  businessId: string,
  rejectedBy: string,
  reason: string
) => {
  return prisma.businessVerification.update({
    where: { businessId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      verifiedBy: rejectedBy,
    },
  });
};

// Indian GST number validation
export const validateGSTNumber = (gst: string): boolean => {
  // GST format: 2 digits state code + 10 chars PAN + 1 digit entity + 1 char Z + 1 digit
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
};

// Indian PAN number validation
export const validatePANNumber = (pan: string): boolean => {
  // PAN format: 5 letters + 4 digits + 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

// ============================================
// ADMIN QUERIES
// ============================================

export const getPendingStudentVerifications = async () => {
  return prisma.studentVerification.findMany({
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

export const getPendingBusinessVerifications = async () => {
  return prisma.businessVerification.findMany({
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

export const getVerificationStats = async () => {
  const studentStats = await prisma.studentVerification.groupBy({
    by: ["status"],
    _count: true,
  });

  const businessStats = await prisma.businessVerification.groupBy({
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