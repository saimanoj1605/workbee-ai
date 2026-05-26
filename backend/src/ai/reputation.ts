import type { FraudRisk } from "@prisma/client";

export type ReputationMetrics = {
  totalCompleted: number;
  punctualityCount: number;
  positiveReviews: number;
  cancellations: number;
  noShows: number;
};

/** Work Identity Score: WIS = 10C + 5P + 10R - 15X - 25N */
export const calculateWorkIdentityScore = (m: ReputationMetrics): number => {
  return (
    m.totalCompleted * 10 +
    m.punctualityCount * 5 +
    m.positiveReviews * 10 -
    m.cancellations * 15 -
    m.noShows * 25
  );
};

/** Reliability 0–100 from WIS normalized */
export const calculateReliabilityScore = (wis: number): number => {
  const normalized = Math.max(0, Math.min(100, 50 + wis / 2));
  return Math.round(normalized * 10) / 10;
};

export const detectFraudFromMetrics = (m: ReputationMetrics & { fakeReports: number }): FraudRisk => {
  if (m.cancellations > 10 || m.noShows > 5) return "HIGH_RISK";
  if (m.fakeReports > 5 || m.cancellations > 5) return "SUSPICIOUS";
  return "SAFE";
};
