"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWorkSchema = exports.updateWorkerPhaseSchema = exports.emergencyDispatchSchema = exports.updateApplicationSchema = exports.applyGigSchema = exports.listGigsSchema = exports.createGigSchema = void 0;
const zod_1 = require("zod");
exports.createGigSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    requirements: zod_1.z.string().optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
    location: zod_1.z.string().optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    salaryRange: zod_1.z.string().optional(),
});
exports.listGigsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
    status: zod_1.z.enum(["DRAFT", "OPEN", "CLOSED", "FILLED"]).optional(),
    search: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
});
exports.applyGigSchema = zod_1.z.object({
    coverLetter: zod_1.z.string().optional(),
});
exports.updateApplicationSchema = zod_1.z.object({
    status: zod_1.z.enum(["HIRED", "REJECTED"]),
});
exports.emergencyDispatchSchema = zod_1.z.object({
    radiusKm: zod_1.z.coerce.number().positive().default(5),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(5),
});
exports.updateWorkerPhaseSchema = zod_1.z.object({
    phase: zod_1.z.enum(["ON_THE_WAY", "WORKING", "COMPLETED"]),
});
exports.verifyWorkSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    qrCode: zod_1.z.string().optional(),
    proofImageUrl: zod_1.z.string().url().optional(),
    // how strict the GPS check is (km)
    maxDistanceKm: zod_1.z.coerce.number().positive().default(0.5),
});
