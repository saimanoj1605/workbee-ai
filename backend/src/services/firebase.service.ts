import admin from "firebase-admin";

import { env } from "../config/env";
import { AppError } from "../utils/AppError";

// ============================================
// FIREBASE ADMIN INITIALIZATION
// ============================================

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    console.warn("Firebase credentials not configured. Firebase auth will be disabled.");
    return null;
  }

  try {
    const serviceAccount = {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    console.log("Firebase Admin initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw new AppError("Failed to initialize Firebase authentication", 500);
  }
};

// ============================================
// VERIFY FIREBASE ID TOKEN
// ============================================

export const verifyFirebaseToken = async (token: string): Promise<admin.auth.DecodedIdToken> => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new AppError("Firebase authentication is not configured", 503);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    throw new AppError("Invalid or expired Firebase token", 401);
  }
};

// ============================================
// GET FIREBASE AUTH USER
// ============================================

export const getFirebaseUser = async (uid: string): Promise<admin.auth.UserRecord> => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new AppError("Firebase authentication is not configured", 503);
  }

  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error("Failed to get Firebase user:", error);
    throw new AppError("Firebase user not found", 404);
  }
};

// ============================================
// CREATE FIREBASE USER (for admin purposes)
// ============================================

export const createFirebaseUser = async (
  email: string,
  password: string,
  displayName?: string
): Promise<admin.auth.UserRecord> => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new AppError("Firebase authentication is not configured", 503);
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    return userRecord;
  } catch (error) {
    console.error("Failed to create Firebase user:", error);
    throw new AppError("Failed to create user", 500);
  }
};

// ============================================
// DELETE FIREBASE USER
// ============================================

export const deleteFirebaseUser = async (uid: string): Promise<void> => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new AppError("Firebase authentication is not configured", 503);
  }

  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    console.error("Failed to delete Firebase user:", error);
    throw new AppError("Failed to delete user", 500);
  }
};

// ============================================
// SET CUSTOM USER CLAIMS
// ============================================

export const setCustomUserClaims = async (
  uid: string,
  claims: { [key: string]: any }
): Promise<void> => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new AppError("Firebase authentication is not configured", 503);
  }

  try {
    await admin.auth().setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error("Failed to set custom claims:", error);
    throw new AppError("Failed to set user claims", 500);
  }
};

// ============================================
// VERIFY FIREBASE SESSION COOKIE
// ============================================

export const verifySessionCookie = async (
  sessionCookie: string,
  checkRevoked: boolean = true
): Promise<admin.auth.DecodedIdToken> => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new AppError("Firebase authentication is not configured", 503);
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, checkRevoked);
    return decodedClaims;
  } catch (error) {
    console.error("Session cookie verification failed:", error);
    throw new AppError("Invalid or expired session cookie", 401);
  }
};

// ============================================
// CREATE SESSION COOKIE
// ============================================

export const createSessionCookie = async (
  idToken: string,
  expiresIn: number = 86400000 // 24 hours in milliseconds
): Promise<string> => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new AppError("Firebase authentication is not configured", 503);
  }

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    return sessionCookie;
  } catch (error) {
    console.error("Failed to create session cookie:", error);
    throw new AppError("Failed to create session cookie", 500);
  }
};

// ============================================
// SEND PHONE OTP (via Firebase)
// Note: This requires Firebase phone auth to be set up
// ============================================

export const sendPhoneOTP = async (phoneNumber: string): Promise<string> => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new AppError("Firebase authentication is not configured", 503);
  }

  // Note: In a real implementation, you would use Firebase's phone auth
  // which requires a client-side component. This is a placeholder.
  console.log(`Phone OTP would be sent to: ${phoneNumber}`);
  
  // Generate a 6-digit OTP for demo purposes
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

// ============================================
// CHECK FIREBASE CONFIGURATION STATUS
// ============================================

export const isFirebaseConfigured = (): boolean => {
  return !!(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
};