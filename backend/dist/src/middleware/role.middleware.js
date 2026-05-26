"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const AppError_1 = require("../utils/AppError");
const requireRole = (...roles) => (req, _res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
        return next(new AppError_1.AppError("Forbidden: insufficient permissions", 403));
    }
    next();
};
exports.requireRole = requireRole;
