import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import {
  securityHeaders,
  apiLimiter,
  xssClean,
  hppClean,
  deviceTracking,
  requestTimestamp,
} from "./middleware/security.middleware";

// Route imports
import aiRoutes from "./routes/ai.routes";
import authRoutes from "./routes/auth.routes";
import clerkRoutes from "./routes/clerk.routes";
import chatRoutes from "./routes/chat.routes";
import gigRoutes from "./routes/gig.routes";
import paymentRoutes from "./routes/payment.routes";
import razorpayRoutes from "./routes/razorpay.routes";
import reportRoutes from "./routes/report.routes";
import reviewRoutes from "./routes/review.routes";
import uploadRoutes from "./routes/upload.routes";
import verificationRoutes from "./routes/verification.routes";

const app = express();

// ============================================
// SECURITY MIDDLEWARES
// ============================================

// Security headers (Helmet)
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// XSS protection
app.use(xssClean);

// HTTP Parameter Pollution protection
app.use(hppClean);

// Request timestamp
app.use(requestTimestamp);

// Device tracking (after auth middleware sets userId)
app.use(deviceTracking);

// ============================================
// API RATE LIMITING
// ============================================
app.use("/api/", apiLimiter);

// ============================================
// HEALTH CHECK & INFO ENDPOINTS
// ============================================
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "WorkBee API - AI-powered local work platform",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// API ROUTES
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/auth/clerk", clerkRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payments/razorpay", razorpayRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/verification", verificationRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${_req.originalUrl} not found`,
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler);

export default app;