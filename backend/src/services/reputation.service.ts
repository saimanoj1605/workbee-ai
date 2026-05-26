import type { ReputationLevel } from "@prisma/client";

import {
  calculateReliabilityScore,
  calculateWorkIdentityScore,
  detectFraudFromMetrics,
} from "../ai/reputation";
import prisma from "../config/db";

const levelFromWis = (wis: number): ReputationLevel => {
  if (wis >= 80) return "PLATINUM";
  if (wis >= 60) return "GOLD";
  if (wis >= 40) return "SILVER";
  if (wis >= 20) return "BRONZE";
  return "NEW";
};

export const refreshReputation = async (userId: string) => {
  const rep = await prisma.reputationScore.findUnique({ where: { userId } });
  const metrics = {
    totalCompleted: rep?.totalCompleted ?? 0,
    punctualityCount: rep?.punctualityCount ?? 0,
    positiveReviews: rep?.positiveReviews ?? 0,
    cancellations: rep?.cancellations ?? 0,
    noShows: rep?.noShows ?? 0,
    fakeReports: rep?.fakeReports ?? 0,
  };

  const workIdentityScore = calculateWorkIdentityScore(metrics);
  const reliabilityScore = calculateReliabilityScore(workIdentityScore);
  const fraudStatus = detectFraudFromMetrics(metrics);

  return prisma.reputationScore.upsert({
    where: { userId },
    create: {
      userId,
      workIdentityScore,
      reliabilityScore,
      fraudStatus,
      level: levelFromWis(workIdentityScore),
      score: reliabilityScore / 20,
    },
    update: {
      workIdentityScore,
      reliabilityScore,
      fraudStatus,
      level: levelFromWis(workIdentityScore),
    },
  });
};

export const incrementMetric = async (
  userId: string,
  field:
    | "totalCompleted"
    | "punctualityCount"
    | "positiveReviews"
    | "cancellations"
    | "noShows"
    | "fakeReports",
  amount = 1
) => {
  await prisma.reputationScore.upsert({
    where: { userId },
    create: { userId, [field]: amount },
    update: { [field]: { increment: amount } },
  });
  return refreshReputation(userId);
};
