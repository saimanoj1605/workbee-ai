"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWork = exports.updateWorkerPhase = exports.emergencyDispatch = exports.updateApplicationStatus = exports.applyToGig = exports.listGigs = exports.createGig = void 0;
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
const AppError_1 = require("../utils/AppError");
const reputation_service_1 = require("./reputation.service");
const gig_validator_1 = require("../validators/gig.validator");
const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const createGig = async (userId, body) => {
    const data = gig_validator_1.createGigSchema.parse(body);
    const business = await db_1.default.business.findUnique({ where: { userId } });
    if (!business) {
        throw new AppError_1.AppError("Business profile not found", 404);
    }
    const gig = await db_1.default.gig.create({
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
        const students = await db_1.default.student.findMany({
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
            const km = haversineKm(gig.latitude, gig.longitude, s.latitude, s.longitude);
            return { s, km };
        })
            .filter((x) => x.km <= 5)
            .sort((a, b) => a.km - b.km)
            .slice(0, 20);
        for (const { s, km } of nearby) {
            (0, socket_1.getIO)()
                .to(s.userId)
                .emit("gig_created", { gig, distanceKm: km });
        }
    }
    return gig;
};
exports.createGig = createGig;
const listGigs = async (query) => {
    const { page, limit, status, search, location } = gig_validator_1.listGigsSchema.parse(query);
    const skip = (page - 1) * limit;
    const where = {};
    if (status)
        where.status = status;
    if (location)
        where.location = { contains: location, mode: "insensitive" };
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }
    const [gigs, total] = await Promise.all([
        db_1.default.gig.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                business: { select: { businessName: true, location: true } },
                _count: { select: { applications: true } },
            },
        }),
        db_1.default.gig.count({ where }),
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
exports.listGigs = listGigs;
const applyToGig = async (userId, gigId, body) => {
    const { coverLetter } = gig_validator_1.applyGigSchema.parse(body);
    const student = await db_1.default.student.findUnique({ where: { userId } });
    if (!student) {
        throw new AppError_1.AppError("Student profile not found", 404);
    }
    const gig = await db_1.default.gig.findUnique({
        where: { id: gigId },
        include: { business: true },
    });
    if (!gig) {
        throw new AppError_1.AppError("Gig not found", 404);
    }
    if (gig.status !== "OPEN") {
        throw new AppError_1.AppError("Gig is not open for applications", 400);
    }
    const existing = await db_1.default.application.findFirst({
        where: { gigId, studentId: student.id },
    });
    if (existing) {
        throw new AppError_1.AppError("You have already applied to this gig", 400);
    }
    const application = await db_1.default.application.create({
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
    const businessUser = await db_1.default.business.findUnique({
        where: { id: gig.businessId },
        select: { userId: true },
    });
    if (businessUser) {
        (0, socket_1.getIO)()
            .to(businessUser.userId)
            .emit("new_application", application);
        (0, socket_1.getIO)()
            .to(businessUser.userId)
            .emit("application_received", application);
    }
    return application;
};
exports.applyToGig = applyToGig;
const updateApplicationStatus = async (userId, gigId, applicationId, body) => {
    const { status } = gig_validator_1.updateApplicationSchema.parse(body);
    const business = await db_1.default.business.findUnique({ where: { userId } });
    if (!business) {
        throw new AppError_1.AppError("Business profile not found", 404);
    }
    const gig = await db_1.default.gig.findFirst({
        where: { id: gigId, businessId: business.id },
    });
    if (!gig) {
        throw new AppError_1.AppError("Gig not found or access denied", 404);
    }
    const application = await db_1.default.application.findFirst({
        where: { id: applicationId, gigId },
        include: { student: { include: { user: true } } },
    });
    if (!application) {
        throw new AppError_1.AppError("Application not found", 404);
    }
    if (status === "HIRED") {
        const result = await db_1.default.$transaction(async (tx) => {
            const hired = await tx.application.update({
                where: { id: applicationId },
                data: { status: "HIRED" },
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
        (0, socket_1.getIO)()
            .to(application.student.userId)
            .emit("application_accepted", { gigId, applicationId });
        (0, socket_1.getIO)()
            .to(application.student.userId)
            .emit("worker_accepted", { gigId, applicationId });
        // Notify the business as well (useful for live dashboard lists)
        (0, socket_1.getIO)()
            .to(userId)
            .emit("worker_accepted", { gigId, applicationId });
        await (0, reputation_service_1.incrementMetric)(application.student.userId, "totalCompleted");
        return result;
    }
    const updated = await db_1.default.application.update({
        where: { id: applicationId },
        data: { status: "REJECTED" },
    });
    (0, socket_1.getIO)()
        .to(application.student.userId)
        .emit("worker_rejected", { gigId, applicationId });
    (0, socket_1.getIO)()
        .to(userId)
        .emit("worker_rejected", { gigId, applicationId });
    return updated;
};
exports.updateApplicationStatus = updateApplicationStatus;
const emergencyDispatch = async (userId, gigId, body) => {
    // userId here is BUSINESS user id
    const { radiusKm, limit } = gig_validator_1.emergencyDispatchSchema.parse(body);
    const gig = await db_1.default.gig.findFirst({
        where: { id: gigId },
        include: { business: { include: { user: true } } },
    });
    if (!gig)
        throw new AppError_1.AppError("Gig not found", 404);
    if (gig.business.userId !== userId)
        throw new AppError_1.AppError("Access denied", 403);
    if (gig.latitude == null || gig.longitude == null) {
        throw new AppError_1.AppError("Gig coordinates are required for dispatch", 400);
    }
    const students = await db_1.default.student.findMany({
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
        const dist = haversineKm(gig.latitude, gig.longitude, s.latitude, s.longitude);
        if (dist > radiusKm)
            return null;
        const rep = s.user.reputation;
        const reliability = Math.max(0, Math.min(100, rep?.reliabilityScore ?? 0));
        const pastReliability = Math.max(0, Math.min(100, (rep?.workIdentityScore ?? 0) / 2));
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
        const distancePriority = dist <= 1 ? 100 : dist <= 3 ? 80 : dist <= 5 ? 60 : 40;
        const score = distancePriority * 0.4 +
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
        .filter((x) => x != null)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    // Broadcast to top candidates immediately
    for (const item of ranked) {
        (0, socket_1.getIO)().to(item.studentUserId).emit("emergency_dispatch", {
            gigId,
            gig: { title: gig.title, salaryRange: gig.salaryRange, location: gig.location },
            dispatch: item,
        });
    }
    // Notify business with ranked dispatch list too
    (0, socket_1.getIO)()
        .to(userId)
        .emit("emergency_dispatch_started", { gigId, candidates: ranked });
    return { gigId, candidates: ranked };
};
exports.emergencyDispatch = emergencyDispatch;
const updateWorkerPhase = async (userId, gigId, applicationId, body) => {
    const { phase } = gig_validator_1.updateWorkerPhaseSchema.parse(body);
    const application = await db_1.default.application.findFirst({
        where: { id: applicationId, gigId },
        include: {
            student: { include: { user: true } },
            gig: { include: { business: { include: { user: true } } } },
        },
    });
    if (!application)
        throw new AppError_1.AppError("Application not found", 404);
    const studentUserId = application.student.userId;
    const businessUserId = application.gig.business.userId;
    const canUpdate = userId === studentUserId || userId === businessUserId;
    if (!canUpdate)
        throw new AppError_1.AppError("Access denied", 403);
    const updated = await db_1.default.application.update({
        where: { id: applicationId },
        data: { workerPhase: phase },
        include: {
            student: { include: { user: { select: { id: true, fullName: true, email: true } } } },
            gig: { select: { id: true, title: true, status: true } },
        },
    });
    (0, socket_1.getIO)()
        .to(studentUserId)
        .emit("worker_status_updated", { gigId, applicationId, phase });
    (0, socket_1.getIO)()
        .to(businessUserId)
        .emit("worker_status_updated", { gigId, applicationId, phase });
    if (phase === "COMPLETED") {
        await db_1.default.gig.update({
            where: { id: gigId },
            data: { status: "CLOSED" },
        });
        (0, socket_1.getIO)()
            .to(studentUserId)
            .emit("gig_completed", { gigId, applicationId });
        (0, socket_1.getIO)()
            .to(businessUserId)
            .emit("gig_completed", { gigId, applicationId });
    }
    return updated;
};
exports.updateWorkerPhase = updateWorkerPhase;
const verifyWork = async (userId, gigId, applicationId, body) => {
    const data = gig_validator_1.verifyWorkSchema.parse(body);
    const application = await db_1.default.application.findFirst({
        where: { id: applicationId, gigId },
        include: {
            student: { include: { user: true } },
            gig: { include: { business: { include: { user: true } } } },
        },
    });
    if (!application)
        throw new AppError_1.AppError("Application not found", 404);
    const studentUserId = application.student.userId;
    if (studentUserId !== userId)
        throw new AppError_1.AppError("Access denied", 403);
    if (application.gig.latitude == null || application.gig.longitude == null) {
        throw new AppError_1.AppError("Gig coordinates are required for verification", 400);
    }
    const distKm = haversineKm(application.gig.latitude, application.gig.longitude, data.latitude, data.longitude);
    if (distKm > data.maxDistanceKm) {
        throw new AppError_1.AppError(`GPS mismatch (distance ${distKm.toFixed(2)} km)`, 400);
    }
    if (data.qrCode && data.qrCode.trim().length === 0) {
        throw new AppError_1.AppError("Invalid QR code", 400);
    }
    const businessUserId = application.gig.business.userId;
    await db_1.default.$transaction(async (tx) => {
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
    (0, socket_1.getIO)().to(studentUserId).emit("worker_verified", {
        gigId,
        applicationId,
        distanceKm: distKm,
        proofImageUrl: data.proofImageUrl ?? null,
    });
    (0, socket_1.getIO)().to(businessUserId).emit("worker_verified", {
        gigId,
        applicationId,
        distanceKm: distKm,
        proofImageUrl: data.proofImageUrl ?? null,
    });
    (0, socket_1.getIO)().to(studentUserId).emit("worker_status_updated", {
        gigId,
        applicationId,
        phase: "COMPLETED",
    });
    (0, socket_1.getIO)().to(businessUserId).emit("worker_status_updated", {
        gigId,
        applicationId,
        phase: "COMPLETED",
    });
    (0, socket_1.getIO)().to(studentUserId).emit("gig_completed", { gigId, applicationId });
    (0, socket_1.getIO)().to(businessUserId).emit("gig_completed", { gigId, applicationId });
    return { gigId, applicationId, distanceKm: distKm };
};
exports.verifyWork = verifyWork;
