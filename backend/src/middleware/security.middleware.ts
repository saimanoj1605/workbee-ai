import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

// xss-clean doesn't have types, so we need to handle it
// @ts-ignore - xss-clean has no type definitions
import xss from "xss-clean";

import { env } from "../config/env";
import prisma from "../config/db";

// ============================================
// HELMET - Security Headers
// ============================================
export const securityHeaders = helmet({
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
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes by default
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => env.NODE_ENV === "test",
});

// ============================================
// AUTH RATE LIMITER - Stricter for auth endpoints
// ============================================
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes.",
  },
  skipSuccessfulRequests: true,
});

// ============================================
// XSS CLEAN - Sanitize user input
// ============================================
export const xssClean = xss();

// ============================================
// HPP - HTTP Parameter Pollution protection
// ============================================
export const hppClean = hpp();

// ============================================
// DEVICE FINGERPRINT MIDDLEWARE
// ============================================
export interface DeviceRequest extends Request {
  deviceFingerprint?: string;
  userId?: string;
}

export const deviceTracking = async (
  req: DeviceRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Generate a simple fingerprint from headers
    const fingerprint = generateFingerprint(req);
    req.deviceFingerprint = fingerprint;

    // Log device activity for security monitoring
    if (req.userId) {
      await logDeviceActivity(req.userId, fingerprint, req);
    }

    next();
  } catch (error) {
    // Don't block requests on device tracking failures
    next();
  }
};

function generateFingerprint(req: Request): string {
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

async function logDeviceActivity(
  userId: string,
  fingerprint: string,
  req: Request
) {
  try {
    // Check if device is blocked
    const device = await prisma.deviceFingerprint.findUnique({
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
    await prisma.deviceFingerprint.upsert({
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
    await prisma.securityLog.create({
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
  } catch (error) {
    // Silently fail for non-critical tracking
  }
}

// ============================================
// IP WHITELIST MIDDLEWARE (for admin routes)
// ============================================
export const ipWhitelist = (allowedIps: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const clientIp = req.ip || "";
    if (allowedIps.includes(clientIp) || env.NODE_ENV === "development") {
      next();
    } else {
      _res.status(403).json({
        success: false,
        message: "Access denied from this IP address",
      });
    }
  };
};

// ============================================
// REQUEST TIMESTAMP MIDDLEWARE
// ============================================
export const requestTimestamp = (req: Request, _res: Response, next: NextFunction) => {
  (req as Request & { requestTime: Date }).requestTime = new Date();
  next();
};