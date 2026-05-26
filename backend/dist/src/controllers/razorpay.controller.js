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
exports.verifyPayment = exports.createOrder = void 0;
const zod_1 = require("zod");
const razorpayService = __importStar(require("../services/razorpay.service"));
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const orderSchema = zod_1.z.object({
    applicationId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
});
const verifySchema = zod_1.z.object({
    razorpay_order_id: zod_1.z.string(),
    razorpay_payment_id: zod_1.z.string(),
    razorpay_signature: zod_1.z.string(),
});
exports.createOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { applicationId, amount } = orderSchema.parse(req.body);
    const result = await razorpayService.createRazorpayOrder(req.userId, applicationId, amount);
    (0, response_1.sendSuccess)(res, result, 201, "Razorpay order created");
});
exports.verifyPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const body = verifySchema.parse(req.body);
    const payment = await razorpayService.verifyRazorpayPayment(req.userId, body);
    (0, response_1.sendSuccess)(res, payment, 200, "Payment verified and held");
});
