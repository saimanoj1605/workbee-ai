"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releasePaymentSchema = exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentSchema = zod_1.z.object({
    applicationId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3).default("USD"),
});
exports.releasePaymentSchema = zod_1.z.object({
    paymentId: zod_1.z.string().uuid(),
});
