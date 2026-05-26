import { v2 as cloudinary } from "cloudinary";

import { env } from "../config/env";
import { AppError } from "../utils/AppError";

let configured = false;

const ensureCloudinary = () => {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new AppError("Cloudinary is not configured", 503);
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  return cloudinary;
};

export const uploadImage = async (
  fileBuffer: Buffer,
  folder = "workbee"
): Promise<{ url: string; publicId: string }> => {
  const cld = ensureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(new AppError("Upload failed", 500));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(fileBuffer);
  });
};
