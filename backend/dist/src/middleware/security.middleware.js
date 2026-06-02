"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimestamp = exports.ipWhitelist = exports.deviceTracking = exports.hppClean = exports.xssClean = exports.authLimiter = exports.apiLimiter = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const hpp_1 = __importDefault(require("hpp"));
const env_1 = require("../config/env");
const db_1 = __importDefault(require("../config/db"));
// ============================================
// HELMET - Security Headers
// ============================================
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.razorpay.com", "https://api.stripe.com"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false,
});
// ============================================
// RATE LIMITER - API Rate Limiting
// ============================================
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS, // 15 minutes by default
    max: env_1.env.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => env_1.env.NODE_ENV === "test",
});
// ============================================
// AUTH RATE LIMITER - Stricter for auth endpoints
// ============================================
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        success: false,
        message: "Too many authentication attempts, please try again after 15 minutes.",
    },
    skipSuccessfulRequests: true,
});
function sanitizeValue(value) {
    if (typeof value === "string") {
        return value.replace(/<[^>]*>/g, "");
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value && typeof value === "object") {
        for (const key of Object.keys(value)) {
            value[key] = sanitizeValue(value[key]);
        }
        return value;
    }
    return value;
}
function sanitizeQuery(query) {
    if (query && typeof query === "object") {
        for (const key of Object.keys(query)) {
            const field = query[key];
            if (typeof field === "string" || Array.isArray(field) || typeof field === "object") {
                query[key] = sanitizeValue(field);
            }
        }
    }
}
// ============================================
// XSS SANITIZER - Sanitize user input without mutating Express 5 getters
// ============================================
const xssClean = (req, _res, next) => {
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.params) {
        req.params = sanitizeValue(req.params);
    }
    if (req.query) {
        sanitizeQuery(req.query);
    }
    next();
};
exports.xssClean = xssClean;
// ============================================
// HPP - HTTP Parameter Pollution protection
// ============================================
exports.hppClean = (0, hpp_1.default)();
const deviceTracking = async (req, _res, next) => {
    try {
        // Generate a simple fingerprint from headers
        const fingerprint = generateFingerprint(req);
        req.deviceFingerprint = fingerprint;
        // Log device activity for security monitoring
        if (req.userId) {
            await logDeviceActivity(req.userId, fingerprint, req);
        }
        next();
    }
    catch (error) {
        // Don't block requests on device tracking failures
        next();
    }
};
exports.deviceTracking = deviceTracking;
function generateFingerprint(req) {
    const userAgent = req.headers["user-agent"] || "unknown";
    const acceptLanguage = req.headers["accept-language"] || "unknown";
    const acceptEncoding = req.headers["accept-encoding"] || "unknown";
    // Simple hash generation
    const data = `${userAgent}-${acceptLanguage}-${acceptEncoding}-${req.ip}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}
async function logDeviceActivity(userId, fingerprint, req) {
    try {
        // Check if device is blocked
        const device = await db_1.default.deviceFingerprint.findUnique({
            where: {
                userId_fingerprint: {
                    userId,
                    fingerprint,
                },
            },
        });
        if (device?.isBlocked) {
            throw new Error("Device is blocked");
        }
        // Update or create device fingerprint
        await db_1.default.deviceFingerprint.upsert({
            where: {
                userId_fingerprint: {
                    userId,
                    fingerprint,
                },
            },
            update: {
                lastSeenAt: new Date(),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            },
            create: {
                userId,
                fingerprint,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
                deviceInfo: {
                    acceptLanguage: req.headers["accept-language"],
                    acceptEncoding: req.headers["accept-encoding"],
                },
            },
        });
        // Log security event
        await db_1.default.securityLog.create({
            data: {
                userId,
                action: "DEVICE_ACCESS",
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
                metadata: {
                    fingerprint,
                    path: req.path,
                    method: req.method,
                },
            },
        });
    }
    catch (error) {
        // Silently fail for non-critical tracking
    }
}
// ============================================
// IP WHITELIST MIDDLEWARE (for admin routes)
// ============================================
const ipWhitelist = (allowedIps) => {
    return (req, _res, next) => {
        const clientIp = req.ip || "";
        if (allowedIps.includes(clientIp) || env_1.env.NODE_ENV === "development") {
            next();
        }
        else {
            _res.status(403).json({
                success: false,
                message: "Access denied from this IP address",
            });
        }
    };
};
exports.ipWhitelist = ipWhitelist;
// ============================================
// REQUEST TIMESTAMP MIDDLEWARE
// ============================================
const requestTimestamp = (req, _res, next) => {
    req.requestTime = new Date();
    next();
};
exports.requestTimestamp = requestTimestamp;
