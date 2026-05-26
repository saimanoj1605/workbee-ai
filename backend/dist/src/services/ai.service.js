"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkIdentity = exports.getCareerAssistant = exports.checkUserFraud = exports.getNearbyGigs = exports.getMatchedWorkers = void 0;
const matching_1 = require("../ai/matching");
const fraud_1 = require("../ai/fraud");
const assistant_1 = require("../ai/assistant");
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
const AppError_1 = require("../utils/AppError");
const reputation_service_1 = require("./reputation.service");
const getMatchedWorkers = async (gigId, limit = 10) => {
    const gig = await db_1.default.gig.findUnique({
        where: { id: gigId },
        include: { business: true },
    });
    if (!gig)
        throw new AppError_1.AppError("Gig not found", 404);
    const students = await db_1.default.student.findMany({
        include: {
            user: {
                include: { reputation: true },
            },
        },
    });
    const candidates = students.map((s) => ({
        studentId: s.id,
        userId: s.userId,
        fullName: s.user.fullName,
        skills: s.skills,
        reliabilityScore: s.user.reputation?.reliabilityScore ?? 0,
        workIdentityScore: s.user.reputation?.workIdentityScore ?? 0,
        totalCompleted: s.user.reputation?.totalCompleted ?? 0,
        availability: s.availability,
        latitude: s.latitude,
        longitude: s.longitude,
    }));
    const ranked = (0, matching_1.rankStudents)(candidates, {
        skills: gig.skills,
        latitude: gig.latitude,
        longitude: gig.longitude,
    }, limit);
    await Promise.all(ranked.map((match) => db_1.default.aIMatch.upsert({
        where: {
            studentId_gigId: { studentId: match.studentId, gigId },
        },
        create: {
            studentId: match.studentId,
            gigId,
            score: match.score,
            reason: match.reason,
        },
        update: {
            score: match.score,
            reason: match.reason,
        },
    })));
    return { gigId, matches: ranked };
};
exports.getMatchedWorkers = getMatchedWorkers;
const getNearbyGigs = async (lat, lng, radiusKm = 25, limit = 20) => {
    const gigs = await db_1.default.gig.findMany({
        where: {
            status: "OPEN",
            latitude: { not: null },
            longitude: { not: null },
        },
        include: {
            business: { select: { businessName: true } },
        },
        take: 100,
    });
    const withDistance = gigs
        .map((g) => {
        const km = g.latitude != null && g.longitude != null
            ? haversine(lat, lng, g.latitude, g.longitude)
            : 999;
        return { ...g, distanceKm: km };
    })
        .filter((g) => g.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, limit);
    return withDistance;
};
exports.getNearbyGigs = getNearbyGigs;
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const checkUserFraud = async (userId) => {
    const rep = await db_1.default.reputationScore.findUnique({ where: { userId } });
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        include: { business: { include: { gigs: true } } },
    });
    if (!user)
        throw new AppError_1.AppError("User not found", 404);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const gigsPostedLast24h = user.business
        ? await db_1.default.gig.count({
            where: {
                businessId: user.business.id,
                createdAt: { gte: dayAgo },
            },
        })
        : 0;
    const result = (0, fraud_1.detectFraud)({
        cancellations: rep?.cancellations ?? 0,
        noShows: rep?.noShows ?? 0,
        fakeReports: rep?.fakeReports ?? 0,
        gigsPostedLast24h,
        isVerified: user.isEmailVerified,
    });
    if (rep) {
        await db_1.default.reputationScore.update({
            where: { userId },
            data: { fraudStatus: result.status },
        });
    }
    // Live admin monitoring
    (0, socket_1.getIO)().to("admin").emit("fraud_status_changed", {
        userId,
        status: result.status,
        flags: result.flags,
        score: result.score,
    });
    return result;
};
exports.checkUserFraud = checkUserFraud;
const getCareerAssistant = async (userId) => {
    const student = await db_1.default.student.findUnique({
        where: { userId },
        include: {
            user: { include: { reputation: true } },
            applications: {
                take: 5,
                orderBy: { submittedAt: "desc" },
                include: { gig: { select: { title: true } } },
            },
        },
    });
    if (!student)
        throw new AppError_1.AppError("Student profile required", 403);
    const advice = await (0, assistant_1.getCareerAdvice)({
        fullName: student.user.fullName,
        skills: student.skills,
        totalCompleted: student.user.reputation?.totalCompleted ?? 0,
        workIdentityScore: student.user.reputation?.workIdentityScore ?? 0,
        recentGigTitles: student.applications.map((a) => a.gig.title),
    });
    return { advice, reputation: student.user.reputation };
};
exports.getCareerAssistant = getCareerAssistant;
const getWorkIdentity = async (userId) => {
    const rep = await db_1.default.reputationScore.findUnique({ where: { userId } });
    if (!rep) {
        return (0, reputation_service_1.refreshReputation)(userId);
    }
    return (0, reputation_service_1.refreshReputation)(userId);
};
exports.getWorkIdentity = getWorkIdentity;
