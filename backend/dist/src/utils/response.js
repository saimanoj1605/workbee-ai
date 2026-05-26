"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, status = 200, message) => {
    res.status(status).json({
        success: true,
        ...(message ? { message } : {}),
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, status = 400) => {
    res.status(status).json({
        success: false,
        message,
    });
};
exports.sendError = sendError;
