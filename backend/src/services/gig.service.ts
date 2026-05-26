import type { ApplicationStatus, GigStatus, Prisma } from "@prisma/client";

import prisma from "../config/db";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";
import { incrementMetric } from "./reputation.service";
import {
  applyGigSchema,
  createGigSchema,
  listGigsSchema,
  emergencyDispatchSchema,
  updateApplicationSchema,
  updateWorkerPhaseSchema,
  verifyWorkSchema,
} from "../validators/gig.validator";

const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const createGig = async (userId: string, body: unknown) => {
  const data = createGigSchema.parse(body);

  const business = await prisma.business.findUnique({ where: { userId } });
  if (!business) {
    throw new AppError("Business profile not found", 404);
  }

  const gig = await prisma.gig.create({
    data: {
      businessId: business.id,
      title: data.title,
      description: data.description,
      requirements: data.requirements,
      skills: data.skills ?? [],
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      salaryRange: data.salaryRange,
      status: "OPEN",
      publishedAt: new Date(),
    },
    include: {
      business: { select: { businessName: true, location: true } },
    },
  });

  // Live notifications: alert nearby students instantly
  if (gig.latitude != null && gig.longitude != null) {
    const students = await prisma.student.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            reputation: true,
          },
        },
      },
    });

    const nearby = students
      .map((s) => {
        const km = haversineKm(
          gig.latitude as number,
          gig.longitude as number,
          s.latitude as number,
          s.longitude as number
        );
        return { s, km };
      })
      .filter((x) => x.km <= 5)
      .sort((a, b) => a.km - b.km)
      .slice(0, 20);

    for (const { s, km } of nearby) {
      getIO()
        .to(s.userId)
        .emit("gig_created", { gig, distanceKm: km });
    }
  }

  return gig;
};

export const listGigs = async (query: unknown) => {
  const { page, limit, status, search, location } = listGigsSchema.parse(query);
  const skip = (page - 1) * limit;

  const where: Prisma.GigWhereInput = {};
  if (status) where.status = status as GigStatus;
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [gigs, total] = await Promise.all([
    prisma.gig.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        business: { select: { businessName: true, location: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.gig.count({ where }),
  ]);

  return {
    gigs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const applyToGig = async (
  userId: string,
  gigId: string,
  body: unknown
) => {
  const { coverLetter } = applyGigSchema.parse(body);

  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    include: { business: true },
  });
  if (!gig) {
    throw new AppError("Gig not found", 404);
  }
  if (gig.status !== "OPEN") {
    throw new AppError("Gig is not open for applications", 400);
  }

  const existing = await prisma.application.findFirst({
    where: { gigId, studentId: student.id },
  });
  if (existing) {
    throw new AppError("You have already applied to this gig", 400);
  }

  const application = await prisma.application.create({
    data: {
      gigId,
      studentId: student.id,
      coverLetter,
      status: "APPLIED",
    },
    include: {
      student: { include: { user: { select: { fullName: true, email: true } } } },
      gig: { select: { title: true, businessId: true } },
    },
  });

  const businessUser = await prisma.business.findUnique({
    where: { id: gig.businessId },
    select: { userId: true },
  });

  if (businessUser) {
    getIO()
      .to(businessUser.userId)
      .emit("new_application", application);
    getIO()
      .to(businessUser.userId)
      .emit("application_received", application);
  }

  return application;
};

export const updateApplicationStatus = async (
  userId: string,
  gigId: string,
  applicationId: string,
  body: unknown
) => {
  const { status } = updateApplicationSchema.parse(body);

  const business = await prisma.business.findUnique({ where: { userId } });
  if (!business) {
    throw new AppError("Business profile not found", 404);
  }

  const gig = await prisma.gig.findFirst({
    where: { id: gigId, businessId: business.id },
  });
  if (!gig) {
    throw new AppError("Gig not found or access denied", 404);
  }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, gigId },
    include: { student: { include: { user: true } } },
  });
  if (!application) {
    throw new AppError("Application not found", 404);
  }

  if (status === "HIRED") {
    const result = await prisma.$transaction(async (tx) => {
      const hired = await tx.application.update({
        where: { id: applicationId },
        data: { status: "HIRED" as ApplicationStatus },
      });

      await tx.application.updateMany({
        where: {
          gigId,
          id: { not: applicationId },
          status: { notIn: ["REJECTED", "CANCELLED"] },
        },
        data: { status: "REJECTED" },
      });

      await tx.gig.update({
        where: { id: gigId },
        data: { status: "FILLED" },
      });

      return hired;
    });

    getIO()
      .to(application.student.userId)
      .emit("application_accepted", { gigId, applicationId });

    getIO()
      .to(application.student.userId)
      .emit("worker_accepted", { gigId, applicationId });

    // Notify the business as well (useful for live dashboard lists)
    getIO()
      .to(userId)
      .emit("worker_accepted", { gigId, applicationId });

    await incrementMetric(application.student.userId, "totalCompleted");

    return result;
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: "REJECTED" },
  });

  getIO()
    .to(application.student.userId)
    .emit("worker_rejected", { gigId, applicationId });
  getIO()
    .to(userId)
    .emit("worker_rejected", { gigId, applicationId });

  return updated;
};

export const emergencyDispatch = async (
  userId: string,
  gigId: string,
  body: unknown
) => {
  // userId here is BUSINESS user id
  const { radiusKm, limit } = emergencyDispatchSchema.parse(body);

  const gig = await prisma.gig.findFirst({
    where: { id: gigId },
    include: { business: { include: { user: true } } },
  });
  if (!gig) throw new AppError("Gig not found", 404);
  if (gig.business.userId !== userId) throw new AppError("Access denied", 403);

  if (gig.latitude == null || gig.longitude == null) {
    throw new AppError("Gig coordinates are required for dispatch", 400);
  }

  const students = await prisma.student.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      user: { include: { reputation: true } },
    },
  });

  const ranked = students
    .map((s) => {
      const dist = haversineKm(
        gig.latitude as number,
        gig.longitude as number,
        s.latitude as number,
        s.longitude as number
      );

      if (dist > radiusKm) return null;

      const rep = s.user.reputation;
      const reliability = Math.max(0, Math.min(100, rep?.reliabilityScore ?? 0));
      const pastReliability = Math.max(
        0,
        Math.min(100, (rep?.workIdentityScore ?? 0) / 2)
      );

      const avail = s.availability?.toLowerCase() ?? "";
      const availabilityPriority = avail.includes("immediate") ||
        avail.includes("full") ||
        avail.includes("now")
        ? 100
        : avail.includes("weekend")
          ? 70
          : avail.includes("part")
            ? 80
            : 50;

      const distancePriority =
        dist <= 1 ? 100 : dist <= 3 ? 80 : dist <= 5 ? 60 : 40;

      const score =
        distancePriority * 0.4 +
        reliability * 0.3 +
        availabilityPriority * 0.2 +
        pastReliability * 0.1;

      return {
        studentUserId: s.userId,
        distanceKm: dist,
        score,
        reliability,
        availabilityPriority,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Broadcast to top candidates immediately
  for (const item of ranked) {
    getIO().to(item.studentUserId).emit("emergency_dispatch", {
      gigId,
      gig: { title: gig.title, salaryRange: gig.salaryRange, location: gig.location },
      dispatch: item,
    });
  }

  // Notify business with ranked dispatch list too
  getIO()
    .to(userId)
    .emit("emergency_dispatch_started", { gigId, candidates: ranked });

  return { gigId, candidates: ranked };
};

export const updateWorkerPhase = async (
  userId: string,
  gigId: string,
  applicationId: string,
  body: unknown
) => {
  const { phase } = updateWorkerPhaseSchema.parse(body);

  const application = await prisma.application.findFirst({
    where: { id: applicationId, gigId },
    include: {
      student: { include: { user: true } },
      gig: { include: { business: { include: { user: true } } } },
    },
  });

  if (!application) throw new AppError("Application not found", 404);

  const studentUserId = application.student.userId;
  const businessUserId = application.gig.business.userId;

  const canUpdate =
    userId === studentUserId || userId === businessUserId;
  if (!canUpdate) throw new AppError("Access denied", 403);

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { workerPhase: phase },
    include: {
      student: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      gig: { select: { id: true, title: true, status: true } },
    },
  });

  getIO()
    .to(studentUserId)
    .emit("worker_status_updated", { gigId, applicationId, phase });
  getIO()
    .to(businessUserId)
    .emit("worker_status_updated", { gigId, applicationId, phase });

  if (phase === "COMPLETED") {
    await prisma.gig.update({
      where: { id: gigId },
      data: { status: "CLOSED" },
    });

    getIO()
      .to(studentUserId)
      .emit("gig_completed", { gigId, applicationId });
    getIO()
      .to(businessUserId)
      .emit("gig_completed", { gigId, applicationId });
  }

  return updated;
};

export const verifyWork = async (
  userId: string,
  gigId: string,
  applicationId: string,
  body: unknown
) => {
  const data = verifyWorkSchema.parse(body);

  const application = await prisma.application.findFirst({
    where: { id: applicationId, gigId },
    include: {
      student: { include: { user: true } },
      gig: { include: { business: { include: { user: true } } } },
    },
  });

  if (!application) throw new AppError("Application not found", 404);

  const studentUserId = application.student.userId;
  if (studentUserId !== userId) throw new AppError("Access denied", 403);

  if (application.gig.latitude == null || application.gig.longitude == null) {
    throw new AppError("Gig coordinates are required for verification", 400);
  }

  const distKm = haversineKm(
    application.gig.latitude as number,
    application.gig.longitude as number,
    data.latitude,
    data.longitude
  );

  if (distKm > data.maxDistanceKm) {
    throw new AppError(
      `GPS mismatch (distance ${distKm.toFixed(2)} km)`,
      400
    );
  }

  if (data.qrCode && data.qrCode.trim().length === 0) {
    throw new AppError("Invalid QR code", 400);
  }

  const businessUserId = application.gig.business.userId;

  await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: { workerPhase: "COMPLETED" },
    });
    await tx.gig.update({
      where: { id: gigId },
      data: { status: "CLOSED" },
    });
  });

  // Reuse realtime events so dashboards update instantly
  getIO().to(studentUserId).emit("worker_verified", {
    gigId,
    applicationId,
    distanceKm: distKm,
    proofImageUrl: data.proofImageUrl ?? null,
  });
  getIO().to(businessUserId).emit("worker_verified", {
    gigId,
    applicationId,
    distanceKm: distKm,
    proofImageUrl: data.proofImageUrl ?? null,
  });

  getIO().to(studentUserId).emit("worker_status_updated", {
    gigId,
    applicationId,
    phase: "COMPLETED",
  });
  getIO().to(businessUserId).emit("worker_status_updated", {
    gigId,
    applicationId,
    phase: "COMPLETED",
  });

  getIO().to(studentUserId).emit("gig_completed", { gigId, applicationId });
  getIO().to(businessUserId).emit("gig_completed", { gigId, applicationId });

  return { gigId, applicationId, distanceKm: distKm };
};
