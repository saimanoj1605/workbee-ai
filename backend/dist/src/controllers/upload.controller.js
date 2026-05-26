"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const upload_service_1 = require("../services/upload.service");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
exports.uploadFile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    if (!file)
        throw new AppError_1.AppError("No file provided", 400);
    const folder = req.body.folder || "workbee";
    const result = await (0, upload_service_1.uploadImage)(file.buffer, folder);
    (0, response_1.sendSuccess)(res, result, 201, "File uploaded");
});
