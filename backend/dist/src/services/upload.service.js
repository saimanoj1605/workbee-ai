"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
const AppError_1 = require("../utils/AppError");
let configured = false;
const ensureCloudinary = () => {
    if (!env_1.env.CLOUDINARY_CLOUD_NAME ||
        !env_1.env.CLOUDINARY_API_KEY ||
        !env_1.env.CLOUDINARY_API_SECRET) {
        throw new AppError_1.AppError("Cloudinary is not configured", 503);
    }
    if (!configured) {
        cloudinary_1.v2.config({
            cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
            api_key: env_1.env.CLOUDINARY_API_KEY,
            api_secret: env_1.env.CLOUDINARY_API_SECRET,
        });
        configured = true;
    }
    return cloudinary_1.v2;
};
const uploadImage = async (fileBuffer, folder = "workbee") => {
    const cld = ensureCloudinary();
    return new Promise((resolve, reject) => {
        const stream = cld.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
            if (error || !result) {
                reject(new AppError_1.AppError("Upload failed", 500));
                return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        stream.end(fileBuffer);
    });
};
exports.uploadImage = uploadImage;
