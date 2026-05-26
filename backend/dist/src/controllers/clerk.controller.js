"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUser = void 0;
const zod_1 = require("zod");
const clerkService = __importStar(require("../services/clerk.service"));
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const syncSchema = zod_1.z.object({
    clerkId: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    fullName: zod_1.z.string().min(2),
    role: zod_1.z.enum(["STUDENT", "BUSINESS", "ADMIN"]),
    businessName: zod_1.z.string().optional(),
});
exports.syncUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = syncSchema.parse(req.body);
    const result = await clerkService.syncClerkUser(data);
    (0, response_1.sendSuccess)(res, result, result.isNew ? 201 : 200, "User synced");
});
