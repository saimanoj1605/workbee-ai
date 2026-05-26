"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFraudFromMetrics = exports.calculateReliabilityScore = exports.calculateWorkIdentityScore = void 0;
/** Work Identity Score: WIS = 10C + 5P + 10R - 15X - 25N */
const calculateWorkIdentityScore = (m) => {
    return (m.totalCompleted * 10 +
        m.punctualityCount * 5 +
        m.positiveReviews * 10 -
        m.cancellations * 15 -
        m.noShows * 25);
};
exports.calculateWorkIdentityScore = calculateWorkIdentityScore;
/** Reliability 0–100 from WIS normalized */
const calculateReliabilityScore = (wis) => {
    const normalized = Math.max(0, Math.min(100, 50 + wis / 2));
    return Math.round(normalized * 10) / 10;
};
exports.calculateReliabilityScore = calculateReliabilityScore;
const detectFraudFromMetrics = (m) => {
    if (m.cancellations > 10 || m.noShows > 5)
        return "HIGH_RISK";
    if (m.fakeReports > 5 || m.cancellations > 5)
        return "SUSPICIOUS";
    return "SAFE";
};
exports.detectFraudFromMetrics = detectFraudFromMetrics;
