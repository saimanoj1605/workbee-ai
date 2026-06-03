"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).optional(),
    headline: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
    education: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    portfolioUrl: zod_1.z.string().url().optional(),
    availability: zod_1.z.string().optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    businessName: zod_1.z.string().optional(),
    about: zod_1.z.string().optional(),
    website: zod_1.z.string().optional(),
    industry: zod_1.z.string().optional(),
});
