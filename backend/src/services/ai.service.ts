import { rankStudents } from "../ai/matching";
import { detectFraud } from "../ai/fraud";
import { getCareerAdvice } from "../ai/assistant";
import prisma from "../config/db";
import { getIO } from "../config/socket";
import { AppError } from "../utils/AppError";
import { refreshReputation } from "./reputation.service";

export const getMatchedWorkers = async (gigId: string, limit = 10) => {
  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    include: { business: true },
  });
  if (!gig) throw new AppError("Gig not found", 404);

  const students = await prisma.student.findMany({
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

  const ranked = rankStudents(
    candidates,
    {
      skills: gig.skills,
      latitude: gig.latitude,
      longitude: gig.longitude,
    },
    limit
  );

  await Promise.all(
    ranked.map((match) =>
      prisma.aIMatch.upsert({
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
      })
    )
  );

  return { gigId, matches: ranked };
};

export const getNearbyGigs = async (
  lat: number,
  lng: number,
  radiusKm = 25,
  limit = 20
) => {
  const gigs = await prisma.gig.findMany({
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
      const km =
        g.latitude != null && g.longitude != null
          ? haversine(lat, lng, g.latitude, g.longitude)
          : 999;
      return { ...g, distanceKm: km };
    })
    .filter((g) => g.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return withDistance;
};

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

export const checkUserFraud = async (userId: string) => {
  const rep = await prisma.reputationScore.findUnique({ where: { userId } });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { business: { include: { gigs: true } } },
  });
  if (!user) throw new AppError("User not found", 404);

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const gigsPostedLast24h = user.business
    ? await prisma.gig.count({
        where: {
          businessId: user.business.id,
          createdAt: { gte: dayAgo },
        },
      })
    : 0;

  const result = detectFraud({
    cancellations: rep?.cancellations ?? 0,
    noShows: rep?.noShows ?? 0,
    fakeReports: rep?.fakeReports ?? 0,
    gigsPostedLast24h,
    isVerified: user.isEmailVerified,
  });

  if (rep) {
    await prisma.reputationScore.update({
      where: { userId },
      data: { fraudStatus: result.status },
    });
  }

  // Live admin monitoring
  getIO().to("admin").emit("fraud_status_changed", {
    userId,
    status: result.status,
    flags: result.flags,
    score: result.score,
  });

  return result;
};

export const getCareerAssistant = async (userId: string) => {
  const student = await prisma.student.findUnique({
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
  if (!student) throw new AppError("Student profile required", 403);

  const advice = await getCareerAdvice({
    fullName: student.user.fullName,
    skills: student.skills,
    totalCompleted: student.user.reputation?.totalCompleted ?? 0,
    workIdentityScore: student.user.reputation?.workIdentityScore ?? 0,
    recentGigTitles: student.applications.map((a) => a.gig.title),
  });

  return { advice, reputation: student.user.reputation };
};

export const getWorkIdentity = async (userId: string) => {
  const rep = await prisma.reputationScore.findUnique({ where: { userId } });
  if (!rep) {
    return refreshReputation(userId);
  }
  return refreshReputation(userId);
};
