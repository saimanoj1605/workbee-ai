"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const response_1 = require("../utils/response");
const getDashboardController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const dashboard = await (0, dashboard_service_1.getDashboard)(userId);
        (0, response_1.sendSuccess)(res, dashboard);
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardController = getDashboardController;
