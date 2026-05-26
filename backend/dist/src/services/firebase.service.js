"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFirebaseConfigured = exports.sendPhoneOTP = exports.createSessionCookie = exports.verifySessionCookie = exports.setCustomUserClaims = exports.deleteFirebaseUser = exports.createFirebaseUser = exports.getFirebaseUser = exports.verifyFirebaseToken = exports.initializeFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("../config/env");
const AppError_1 = require("../utils/AppError");
// ============================================
// FIREBASE ADMIN INITIALIZATION
// ============================================
let firebaseApp = null;
const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }
    if (!env_1.env.FIREBASE_PROJECT_ID || !env_1.env.FIREBASE_CLIENT_EMAIL || !env_1.env.FIREBASE_PRIVATE_KEY) {
        console.warn("Firebase credentials not configured. Firebase auth will be disabled.");
        return null;
    }
    try {
        const serviceAccount = {
            projectId: env_1.env.FIREBASE_PROJECT_ID,
            clientEmail: env_1.env.FIREBASE_CLIENT_EMAIL,
            privateKey: env_1.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        };
        firebaseApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin initialized successfully");
        return firebaseApp;
    }
    catch (error) {
        console.error("Failed to initialize Firebase Admin:", error);
        throw new AppError_1.AppError("Failed to initialize Firebase authentication", 500);
    }
};
exports.initializeFirebase = initializeFirebase;
// ============================================
// VERIFY FIREBASE ID TOKEN
// ============================================
const verifyFirebaseToken = async (token) => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new AppError_1.AppError("Firebase authentication is not configured", 503);
    }
    try {
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        return decodedToken;
    }
    catch (error) {
        console.error("Firebase token verification failed:", error);
        throw new AppError_1.AppError("Invalid or expired Firebase token", 401);
    }
};
exports.verifyFirebaseToken = verifyFirebaseToken;
// ============================================
// GET FIREBASE AUTH USER
// ============================================
const getFirebaseUser = async (uid) => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new AppError_1.AppError("Firebase authentication is not configured", 503);
    }
    try {
        const userRecord = await firebase_admin_1.default.auth().getUser(uid);
        return userRecord;
    }
    catch (error) {
        console.error("Failed to get Firebase user:", error);
        throw new AppError_1.AppError("Firebase user not found", 404);
    }
};
exports.getFirebaseUser = getFirebaseUser;
// ============================================
// CREATE FIREBASE USER (for admin purposes)
// ============================================
const createFirebaseUser = async (email, password, displayName) => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new AppError_1.AppError("Firebase authentication is not configured", 503);
    }
    try {
        const userRecord = await firebase_admin_1.default.auth().createUser({
            email,
            password,
            displayName,
            emailVerified: false,
        });
        return userRecord;
    }
    catch (error) {
        console.error("Failed to create Firebase user:", error);
        throw new AppError_1.AppError("Failed to create user", 500);
    }
};
exports.createFirebaseUser = createFirebaseUser;
// ============================================
// DELETE FIREBASE USER
// ============================================
const deleteFirebaseUser = async (uid) => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new AppError_1.AppError("Firebase authentication is not configured", 503);
    }
    try {
        await firebase_admin_1.default.auth().deleteUser(uid);
    }
    catch (error) {
        console.error("Failed to delete Firebase user:", error);
        throw new AppError_1.AppError("Failed to delete user", 500);
    }
};
exports.deleteFirebaseUser = deleteFirebaseUser;
// ============================================
// SET CUSTOM USER CLAIMS
// ============================================
const setCustomUserClaims = async (uid, claims) => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new AppError_1.AppError("Firebase authentication is not configured", 503);
    }
    try {
        await firebase_admin_1.default.auth().setCustomUserClaims(uid, claims);
    }
    catch (error) {
        console.error("Failed to set custom claims:", error);
        throw new AppError_1.AppError("Failed to set user claims", 500);
    }
};
exports.setCustomUserClaims = setCustomUserClaims;
// ============================================
// VERIFY FIREBASE SESSION COOKIE
// ============================================
const verifySessionCookie = async (sessionCookie, checkRevoked = true) => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new AppError_1.AppError("Firebase authentication is not configured", 503);
    }
    try {
        const decodedClaims = await firebase_admin_1.default.auth().verifySessionCookie(sessionCookie, checkRevoked);
        return decodedClaims;
    }
    catch (error) {
        console.error("Session cookie verification failed:", error);
        throw new AppError_1.AppError("Invalid or expired session cookie", 401);
    }
};
exports.verifySessionCookie = verifySessionCookie;
// ============================================
// CREATE SESSION COOKIE
// ============================================
const createSessionCookie = async (idToken, expiresIn = 86400000 // 24 hours in milliseconds
) => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new AppError_1.AppError("Firebase authentication is not configured", 503);
    }
    try {
        const sessionCookie = await firebase_admin_1.default.auth().createSessionCookie(idToken, { expiresIn });
        return sessionCookie;
    }
    catch (error) {
        console.error("Failed to create session cookie:", error);
        throw new AppError_1.AppError("Failed to create session cookie", 500);
    }
};
exports.createSessionCookie = createSessionCookie;
// ============================================
// SEND PHONE OTP (via Firebase)
// Note: This requires Firebase phone auth to be set up
// ============================================
const sendPhoneOTP = async (phoneNumber) => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new AppError_1.AppError("Firebase authentication is not configured", 503);
    }
    // Note: In a real implementation, you would use Firebase's phone auth
    // which requires a client-side component. This is a placeholder.
    console.log(`Phone OTP would be sent to: ${phoneNumber}`);
    // Generate a 6-digit OTP for demo purposes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
};
exports.sendPhoneOTP = sendPhoneOTP;
// ============================================
// CHECK FIREBASE CONFIGURATION STATUS
// ============================================
const isFirebaseConfigured = () => {
    return !!(env_1.env.FIREBASE_PROJECT_ID && env_1.env.FIREBASE_CLIENT_EMAIL && env_1.env.FIREBASE_PRIVATE_KEY);
};
exports.isFirebaseConfigured = isFirebaseConfigured;
