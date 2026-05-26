import { z } from "zod";

export const createGigSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  requirements: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  salaryRange: z.string().optional(),
});

export const listGigsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "FILLED"]).optional(),
  search: z.string().optional(),
  location: z.string().optional(),
});

export const applyGigSchema = z.object({
  coverLetter: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  status: z.enum(["HIRED", "REJECTED"]),
});

export const emergencyDispatchSchema = z.object({
  radiusKm: z.coerce.number().positive().default(5),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

export const updateWorkerPhaseSchema = z.object({
  phase: z.enum(["ON_THE_WAY", "WORKING", "COMPLETED"]),
});

export const verifyWorkSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  qrCode: z.string().optional(),
  proofImageUrl: z.string().url().optional(),
  // how strict the GPS check is (km)
  maxDistanceKm: z.coerce.number().positive().default(0.5),
});
