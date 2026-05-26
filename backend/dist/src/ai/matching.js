"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankStudents = exports.calculateMatch = void 0;
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
const skillMatchScore = (userSkills, gigSkills) => {
    if (gigSkills.length === 0)
        return 40;
    const normalizedGig = gigSkills.map((s) => s.toLowerCase().trim());
    const matches = userSkills.filter((skill) => normalizedGig.includes(skill.toLowerCase().trim()));
    const ratio = matches.length / normalizedGig.length;
    return Math.min(40, ratio * 40);
};
const distanceScore = (gig, student) => {
    if (gig.latitude == null ||
        gig.longitude == null ||
        student.latitude == null ||
        student.longitude == null) {
        return 10;
    }
    const km = haversineKm(gig.latitude, gig.longitude, student.latitude, student.longitude);
    if (km <= 2)
        return 20;
    if (km <= 5)
        return 16;
    if (km <= 10)
        return 12;
    if (km <= 20)
        return 8;
    return 4;
};
const availabilityScore = (availability) => {
    if (!availability)
        return 5;
    const lower = availability.toLowerCase();
    if (lower.includes("immediate") || lower.includes("full"))
        return 10;
    if (lower.includes("weekend") || lower.includes("part"))
        return 8;
    return 6;
};
const calculateMatch = (student, gig) => {
    const skillScore = skillMatchScore(student.skills, gig.skills);
    const distScore = distanceScore(gig, student);
    const relScore = Math.min(20, (student.reliabilityScore / 100) * 20);
    const expScore = Math.min(10, student.totalCompleted * 2);
    const availScore = availabilityScore(student.availability);
    const score = skillScore + distScore + relScore + expScore + availScore;
    const breakdown = {
        skillScore,
        distanceScore: distScore,
        reliabilityScore: relScore,
        experienceScore: expScore,
        availabilityScore: availScore,
    };
    const reason = `Skills ${Math.round(skillScore)}/40, distance ${Math.round(distScore)}/20, reliability ${Math.round(relScore)}/20`;
    return { ...student, score, breakdown, reason };
};
exports.calculateMatch = calculateMatch;
const rankStudents = (students, gig, limit = 10) => {
    return students
        .map((s) => (0, exports.calculateMatch)(s, gig))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
};
exports.rankStudents = rankStudents;
