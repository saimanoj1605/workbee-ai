import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  education: z.string().optional(),
  location: z.string().optional(),
  portfolioUrl: z.string().url().optional(),
  availability: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  businessName: z.string().optional(),
  about: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
});
