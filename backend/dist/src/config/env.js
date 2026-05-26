"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    // Database
    DATABASE_URL: zod_1.z.string().min(1),
    // Server
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.string().default("development"),
    CLIENT_URL: zod_1.z.string().default("http://localhost:3000"),
    // JWT
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    // Firebase (OTP Auth)
    FIREBASE_PROJECT_ID: zod_1.z.string().optional(),
    FIREBASE_CLIENT_EMAIL: zod_1.z.string().optional(),
    FIREBASE_PRIVATE_KEY: zod_1.z.string().optional(),
    // Cloudinary (File Storage)
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional(),
    // Payment Gateways
    RAZORPAY_KEY_ID: zod_1.z.string().optional(),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().optional(),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    // AI Services
    OPENAI_API_KEY: zod_1.z.string().optional(),
    OPENAI_MODEL: zod_1.z.string().default("gpt-4o-mini"),
    // Clerk (Optional Web Auth)
    CLERK_SECRET_KEY: zod_1.z.string().optional(),
    // Google Maps (Geo Validation)
    GOOGLE_MAPS_API_KEY: zod_1.z.string().optional(),
    // Analytics (PostHog)
    POSTHOG_API_KEY: zod_1.z.string().optional(),
    POSTHOG_HOST: zod_1.z.string().default("https://app.posthog.com"),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.coerce.number().default(100),
    // CORS
    CORS_ORIGIN: zod_1.z.string().default("http://localhost:3000"),
    // Security
    BCRYPT_ROUNDS: zod_1.z.coerce.number().default(12),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
}
exports.env = parsed.data;
