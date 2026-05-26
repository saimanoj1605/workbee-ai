"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFraud = void 0;
const detectFraud = (input) => {
    const flags = [];
    let riskPoints = 0;
    if (input.cancellations > 10) {
        flags.push("HIGH_CANCELLATION_COUNT");
        riskPoints += 40;
    }
    else if (input.cancellations > 5) {
        flags.push("ELEVATED_CANCELLATIONS");
        riskPoints += 20;
    }
    if (input.noShows > 5) {
        flags.push("REPEATED_NO_SHOWS");
        riskPoints += 35;
    }
    if (input.fakeReports > 5) {
        flags.push("MULTIPLE_FRAUD_REPORTS");
        riskPoints += 30;
    }
    if (input.isVerified === false) {
        flags.push("UNVERIFIED_BUSINESS");
        riskPoints += 15;
    }
    if ((input.gigsPostedLast24h ?? 0) > 10) {
        flags.push("SPAM_GIG_POSTING");
        riskPoints += 25;
    }
    if (input.duplicateReviewPattern) {
        flags.push("SUSPICIOUS_REVIEW_PATTERN");
        riskPoints += 20;
    }
    let status = "SAFE";
    if (riskPoints >= 50)
        status = "HIGH_RISK";
    else if (riskPoints >= 25)
        status = "SUSPICIOUS";
    return { status, flags, score: riskPoints };
};
exports.detectFraud = detectFraud;
