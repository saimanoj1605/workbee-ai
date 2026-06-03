"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileController = exports.getProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
const response_1 = require("../utils/response");
const getProfileController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const profile = await (0, profile_service_1.getProfile)(userId);
        (0, response_1.sendSuccess)(res, profile);
    }
    catch (error) {
        next(error);
    }
};
exports.getProfileController = getProfileController;
const updateProfileController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const profile = await (0, profile_service_1.updateProfile)(userId, req.body);
        (0, response_1.sendSuccess)(res, profile, 200, "Profile updated successfully");
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfileController = updateProfileController;
