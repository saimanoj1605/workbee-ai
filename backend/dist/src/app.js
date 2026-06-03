"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middleware/error.middleware");
const security_middleware_1 = require("./middleware/security.middleware");
// Route imports
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const clerk_routes_1 = __importDefault(require("./routes/clerk.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const gig_routes_1 = __importDefault(require("./routes/gig.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const razorpay_routes_1 = __importDefault(require("./routes/razorpay.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const verification_routes_1 = __importDefault(require("./routes/verification.routes"));
const app = (0, express_1.default)();
// ============================================
// SECURITY MIDDLEWARES
// ============================================
// Security headers (Helmet)
app.use(security_middleware_1.securityHeaders);
// CORS configuration
const corsOptions = {
    origin: env_1.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use((0, cors_1.default)(corsOptions));
// Body parsing
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// XSS protection
app.use(security_middleware_1.xssClean);
// HTTP Parameter Pollution protection
app.use(security_middleware_1.hppClean);
// Request timestamp
app.use(security_middleware_1.requestTimestamp);
// Device tracking (after auth middleware sets userId)
app.use(security_middleware_1.deviceTracking);
// ============================================
// API RATE LIMITING
// ============================================
app.use("/api/", security_middleware_1.apiLimiter);
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
app.use("/api/auth", auth_routes_1.default);
app.use("/api/auth/clerk", clerk_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/profile", profile_routes_1.default);
app.use("/api/gigs", gig_routes_1.default);
app.use("/api/chat", chat_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/payments/razorpay", razorpay_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/ai", ai_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
app.use("/api/reports", report_routes_1.default);
app.use("/api/verification", verification_routes_1.default);
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
app.use(error_middleware_1.errorHandler);
exports.default = app;
